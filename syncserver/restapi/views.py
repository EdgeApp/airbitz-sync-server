from rest_framework import serializers
from rest_framework import status
from rest_framework.response import Response 
from rest_framework.views import APIView
from subprocess import check_call, CalledProcessError

EXE_PATH="/create_repo.sh"

class RepoObject(object):
    def __init__(self, repo_name=None):
        self.repo_name = repo_name

class RepoSerializer(serializers.Serializer):
    repo_name = serializers.CharField(required=True)

    def restore_object(self, attrs, instance=None):
        if instance is not None:
            instance.repo_name = attrs.get('repo_name', instance.repo_name)
            return instance
        return RepoObject(**attrs)

class RepoCreate(APIView):
    repo_serializer = RepoSerializer

    def common(self, request):
        ser = self.repo_serializer(data=request.DATA)
        if ser.is_valid():
            try:
                check_call(['sudo', EXE_PATH, '/var/www/html/repos/', ser.object.repo_name])
                return Response(status=status.HTTP_200_OK)
            except CalledProcessError:
                return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR, data=ser.errors)

    def get(self, request):
        return self.common(request)

    def post(self, request):
        return self.common(request)

