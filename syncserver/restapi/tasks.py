from celery import shared_task
import ConfigParser, os, subprocess, sys

def get_servers():
    config = ConfigParser.ConfigParser()
    config.read('/etc/absync/absync.conf')
    return filter(lambda x:x, config.get('Servers', 'servers').split(","))

def create_repo_url(url):
    import urlparse
    s = urlparse.urlsplit(url)
    return s.scheme + '://' + s.netloc + '/api/v1/repo/create/'

def request_repo(url, name):
    import json, urllib2
    data = json.dumps({"repo_name": name})
    req = urllib2.Request(create_repo_url(url), data, {'Content-Type': 'application/json'})
    try:
        s = urllib2.urlopen(req, timeout=1)
        return s.getcode() in (200, 201)
    except:
        return False

BASE='/var/www/html/repos/'
SERVERS = get_servers()

@shared_task
def sync_repo(storeId):
    repo_dir="{0}/{1}/{2}".format(BASE, storeId[:2], storeId)
    os.chdir(repo_dir)

    print SERVERS
    print repo_dir

    for server in SERVERS:
        path = "{0}/{1}".format(server, storeId)
        subprocess.call(["/usr/bin/git", "branch", "-D", "incoming"], stdout=False, stderr=False)
        if subprocess.call(["/usr/bin/ab-sync", ".", path], stdout=False, stderr=False) > 0:
            if path.find('://') > 0:
                success = request_repo(server, storeId)
            else:
                subprocess.call(["/bin/mkdir", "-p", path], stdout=False, stderr=False)
                success = subprocess.call(["/usr/bin/git", "init", "--bare", path]) == 0
            subprocess.call(["/usr/bin/git", "push", path, "master"])

