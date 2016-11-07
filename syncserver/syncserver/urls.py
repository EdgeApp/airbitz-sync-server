from django.conf.urls import include, url

from django.contrib import admin
admin.autodiscover()

urlpatterns = [
    url(r'^api/v1/', include('restapi.v1.urls')),
    url(r'^api/v2/', include('restapi.v2.urls')),
    url(r'^admin/', include(admin.site.urls)),
]
