from rest_framework import serializers
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from restapi.utils import create_repo
from restapi.utils import create_repo_js
from restapi.tasks import sync_repo

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
        print request.DATA
        ser = self.repo_serializer(data=request.DATA)
        if ser.is_valid():
            return create_repo(ser.object.repo_name)
        else:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR, data=ser.errors)

    def get(self, request):
        return self.common(request)

    def post(self, request):
        return self.common(request)

class RepoCreateJS(APIView):
    repo_serializer = RepoSerializer

    def common(self, request):
        print request.DATA
        ser = self.repo_serializer(data=request.DATA)
        if ser.is_valid():
            return create_repo_js(ser.object.repo_name)
        else:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR, data=ser.errors)

    def get(self, request):
        return self.common(request)

    def post(self, request):
        return self.common(request)

class RepoSync(APIView):
    def get(self, request, storeId):
        sync_repo.delay(storeId)
        return Response(status=status.HTTP_200_OK)
