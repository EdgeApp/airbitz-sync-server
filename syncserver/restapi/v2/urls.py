from django.conf.urls import patterns, url

import views as v

urlpatterns = patterns('',
     url(r'^store/(?P<storeId>.+)?$', v.RepoStore.as_view(), name="repo-store")
)



