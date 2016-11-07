from django.conf.urls import url

import views as v

urlpatterns = [
     url(r'^store/(?P<storeId>[0-9a-fA-F]+)/?$', v.RepoStore.as_view(), name="repo-store"),
     url(r'^store/(?P<storeId>[0-9a-fA-F]+)/(?P<start_hash>[0-9a-fA-F]+)/?$', v.RepoStore.as_view(), name="repo-commit"),
]

