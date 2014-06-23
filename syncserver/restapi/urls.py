from django.conf.urls import patterns, url

import views as v

urlpatterns = patterns('',
     url(r'^repo/create/?$', v.RepoCreate.as_view(), name="repo-create")
)



