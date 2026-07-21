"""URL configuration for ara_downloader."""
from django.contrib import admin
from django.urls import path
from django.views.generic import TemplateView

from downloader import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('api/info/', views.fetch_info, name='fetch_info'),
    path(
        'favicon.svg',
        TemplateView.as_view(template_name='downloader/favicon.svg', content_type='image/svg+xml'),
        name='favicon',
    ),
]
