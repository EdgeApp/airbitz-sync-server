from django.conf.urls import patterns, url

import views as v

urlpatterns = patterns('',
     url(r'^repo/create/?$', v.RepoCreate.as_view(), name="repo-create"),
     url(r'^repo/sync/(?P<storeId>[^/]+)/?$', v.RepoSync.as_view(), name="repo-sync")
)



