# core/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Route all /api/ requests to the orchestrator app
    path('api/', include('orchestrator.urls')), 
]