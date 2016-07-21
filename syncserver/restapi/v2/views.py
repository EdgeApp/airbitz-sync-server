from rest_framework import serializers
from rest_framework import status
from rest_framework.response import Response 
from rest_framework.views import APIView
from subprocess import check_call, check_output, CalledProcessError
from django.conf import settings

import json, os, random, string

from restapi.utils import create_repo

TMP_DIR = '/tmp'

def git_rev(cwd):
    return check_output(['git', 'rev-parse', 'HEAD'], cwd=cwd).strip()

def git_changed_files(path, rev=None):
    if rev:
        output = check_output(['git', 'log', '{0}..HEAD'.format(rev), '--name-only', '--pretty=format:'], cwd=path)
    else:
        output = check_output(['git', 'log', '--name-only', '--pretty=format:'], cwd=path)
    # strip output, split by new lines and remove any empty lines
    return filter(lambda x : x, set(output.strip().split("\n")))

def git_file_lists(path, rev=None):
    changed_files=git_changed_files(path, rev=rev)
    file_contents = {}
    print changed_files
    for f in changed_files:
        file_contents[f] = git_show(f, path)
    return file_contents

def git_show(filepath, path):
    return check_output(['git', 'show', 'HEAD:{0}'.format(filepath)], cwd=path).strip()

def create_path(storeId):
    prefix = storeId[0:2]
    return "{0}/{1}/{2}".format(settings.REPO_PATH, prefix, storeId)

def git_change_dict(path, rev=None):
    current_hash=git_rev(path)
    file_contents=git_file_lists(path, rev=rev)
    data={
        "hash": current_hash,
        "changes": [{'key': k, 'value': v } for k,v in file_contents.iteritems()]
    }
    return data

def gen_id():
    return ''.join([random.choice(string.digits + string.letters) for i in range(0, 30)])

def git_update(path, storeId, changes, start_hash=None):
    check_output(['git', 'config', '--global', 'user.email', 'api@airbitz.co'])
    check_output(['git', 'config', '--global', 'user.name', 'Airbitz API'])

    new_repo_name="{0}{1}".format(storeId, gen_id())
    working_tree='{0}/{1}'.format(TMP_DIR, new_repo_name)
    print working_tree
    os.makedirs(working_tree)
    for change in changes:
        filename=change['key']
        filepath=working_tree + '/' + filename
        f = open(working_tree + '/' + change['key'], 'wb')
        f.write(change['value'])
        f.close()
        check_output(["sudo", "git", "--git-dir={0}".format(path), '--work-tree={0}'.format(working_tree), "add", filename], cwd=working_tree)
    check_output(["sudo", "git", "--git-dir={0}".format(path), '--work-tree={0}'.format(working_tree), "commit", "-m", "New commit"], cwd=working_tree)
    try:
        # run post receive hook
        check_output(["./hooks/post-receive".format(path)], cwd=path)
    except Exception as e:
        print 'Working Tree', working_tree
        print e

def git_hash_found(cwd, git_hash):
    try:
        check_output(['git', 'merge-base', 'HEAD', git_hash], cwd=cwd)
        return True
    except:
        return False

class RepoStore(APIView):
    # Fetch latest
    def get(self, request, storeId):
        data = json.loads(request.body)
        path = create_path(storeId)
        if not os.path.isdir(path):
            return Response(status=status.HTTP_404_NOT_FOUND)

        start_hash=data.get("hash", None)
        if start_hash and not git_hash_found(path, start_hash):
            return Response(status=status.HTTP_404_NOT_FOUND, data={'msg': 'Hash not found'})

        try:
            payload=git_change_dict(path, rev=start_hash)
            return Response(status=status.HTTP_200_OK, data=payload)
        except Exception as e:
            print e
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Update repository
    def post(self, request, storeId):
        data = json.loads(request.body)
        path = create_path(storeId)
        if not os.path.isdir(path):
            return Response(status=status.HTTP_404_NOT_FOUND)

        start_hash=data.get("hash", None)
        changes=data.get("changes", [])
        if start_hash and not git_hash_found(path, start_hash):
            return Response(status=status.HTTP_404_NOT_FOUND, data=json.dumps({'msg': 'Hash not found'}))
        try:
            git_update(path, storeId, changes, start_hash=start_hash)
            payload=git_change_dict(path, rev=start_hash)
            return Response(status=status.HTTP_200_OK, data=payload)
        except Exception as e:
            print e
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # New repository
    def put(self, request, storeId):
        path = create_path(storeId)
        if os.path.isdir(path):
            return Response(status=status.HTTP_409_CONFLICT)
        return create_repo(storeId)

