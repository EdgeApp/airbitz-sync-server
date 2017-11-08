from rest_framework import serializers
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from subprocess import check_call, check_output, CalledProcessError
from django.conf import settings

import json, os, os.path, random, string

from restapi.utils import create_repo

import logging
logger = logging.getLogger(__name__)

TMP_DIR = '/tmp'

def create_path(storeId):
    prefix = storeId[0:2]
    return "{0}/{1}/{2}".format(settings.REPO_PATH, prefix, storeId)

def git_hash_found(path, git_hash):
    try:
        check_output(['git', 'merge-base', 'HEAD', git_hash], cwd=path)
        return True
    except:
        return False

def git_head(path):
    try:
        return check_output(['git', 'rev-parse', '--verify', 'HEAD'], cwd=path).strip()
    except:
        return None

def git_changed_files(path, rev=None):
    if rev:
        output = check_output(['git', 'log', '--name-only', '--pretty=format:', '{0}..HEAD'.format(rev)], cwd=path)
    else:
        output = check_output(['git', 'log', '--name-only', '--pretty=format:'], cwd=path)
    # strip output, split by new lines and remove any empty lines
    return filter(lambda x : x, set(output.strip().split("\n")))

def git_show(path, filepath):
    return check_output(['git', 'show', 'HEAD:{0}'.format(filepath)], cwd=path).strip()

def git_file_lists(path, rev=None):
    changed_files = git_changed_files(path, rev=rev)
    file_contents = {}
    print changed_files
    for f in changed_files:
        try:
            file_contents[f] = json.loads(git_show(path, f))
        except:
            continue
    return file_contents

def git_change_dict(path, rev=None):
    current_hash = git_head(path)
    if not current_hash:
        # empty repo
        return {
            "changes": []
        }
    else:
        file_contents = git_file_lists(path, rev=rev)
        return {
            "hash": current_hash,
            "changes": file_contents
        }

def gen_id():
    return ''.join([random.choice(string.digits + string.letters) for i in range(0, 30)])

# Returns true if there are no changes staged to commit
def git_dirty(path, working_tree):
    try:
        check_output(['git', "--git-dir={0}".format(path), '--work-tree={0}'.format(working_tree), 'diff-index', '--quiet', '--cached', 'HEAD'], cwd=path)
        return False
    except Exception as e:
        return True

def git_update(path, storeId, changes, start_hash=None):
    check_output(['git', 'config', '--global', 'user.email', 'api@airbitz.co'])
    check_output(['git', 'config', '--global', 'user.name', 'Airbitz API'])

    # Prepare working tree:
    working_tree='{0}/{1}{2}'.format(TMP_DIR, storeId, gen_id())
    print working_tree
    os.makedirs(working_tree)
    check_output(["sudo", "git", "--git-dir={0}".format(path), '--work-tree={0}'.format(working_tree), "reset"], cwd=working_tree)

    # Add changed files:
    for k,v in changes.iteritems():
        filename = k
        try:
            os.makedirs(working_tree + '/' + os.path.dirname(filename))
        except:
            pass
        f = open(working_tree + '/' + filename, 'wb')
        f.write(json.dumps(v))
        f.close()
        check_output(["sudo", "git", "--git-dir={0}".format(path), '--work-tree={0}'.format(working_tree), "add", "--", filename], cwd=working_tree)

    # Make the commit:
    if git_dirty(path, working_tree):
        check_output(["sudo", "git", "--git-dir={0}".format(path), '--work-tree={0}'.format(working_tree), "commit", "-m", "web commit"], cwd=working_tree)
    else:
        print 'No changes to commit'
    try:
        # run post receive hook
        check_output(["./hooks/post-receive".format(path)], cwd=path)
    except Exception as e:
        print 'Working Tree', working_tree
        print e

class InvalidFilename(Exception):
    pass

def test_changes(changes):
    for filename,v in changes.iteritems():
        if filename in ('.', '..'):
            raise InvalidFilename("'{0}' is not a valid filename".format(filename))

class RepoStore(APIView):
    # Fetch latest
    def get(self, request, storeId, start_hash=None):
        logger.info("get - {0}".format(storeId))
        path = create_path(storeId)
        if not os.path.isdir(path):
            return Response(status=status.HTTP_404_NOT_FOUND)
        if start_hash and not git_hash_found(path, start_hash):
            return Response(status=status.HTTP_404_NOT_FOUND, data={'msg': 'Hash not found'})

        try:
            payload = git_change_dict(path, rev=start_hash)
            return Response(status=status.HTTP_200_OK, data=payload)
        except Exception as e:
            print e
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Update repository
    def post(self, request, storeId, start_hash=None):
        logger.info("post - {0}: {1}".format(storeId, request.body))
        path = create_path(storeId)
        if not os.path.isdir(path):
            return Response(status=status.HTTP_404_NOT_FOUND)
        if start_hash and not git_hash_found(path, start_hash):
            return Response(status=status.HTTP_404_NOT_FOUND, data={'msg': 'Hash not found'})

        try:
            changes = json.loads(request.body).get("changes", [])
            test_changes(changes)
            if len(changes):
                git_update(path, storeId, changes, start_hash=start_hash)
            payload = git_change_dict(path, rev=start_hash)
            return Response(status=status.HTTP_200_OK, data=payload)
        except InvalidFilename as e:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'msg': e.args[0]})
        except Exception as e:
            print e
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # New repository
    def put(self, request, storeId):
        logger.info("put - {0}: {1}".format(storeId, request.body))
        path = create_path(storeId)
        if os.path.isdir(path):
            return Response(status=status.HTTP_409_CONFLICT)
        return create_repo(storeId)

