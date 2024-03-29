from django.conf.urls import url

import views as v

urlpatterns = [
     url(r'^repo/create/?$', v.RepoCreateJS.as_view(), name="repo-create"),
     url(r'^repo/createjs/?$', v.RepoCreateJS.as_view(), name="repo-create"),
     url(r'^repo/sync/(?P<storeId>[^/]+)/?$', v.RepoSync.as_view(), name="repo-sync")
]

