from rest_framework import status
from rest_framework.response import Response 
from subprocess import check_call, check_output, CalledProcessError
from django.conf import settings

# We can change this
JS_PATH="/home/bitz/code/airbitz-sync-server/src/create_repo_cli.js"

def create_repo(repo_name):
    try:
        check_call(["node", JS_PATH, repo_name])
        return Response(status=status.HTTP_200_OK)
    except CalledProcessError:
        return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

