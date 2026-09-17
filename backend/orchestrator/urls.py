from django.urls import path
from . import views

urlpatterns = [
    path('provision/', views.provision_env, name='provision_env'),
    path('simulate/', views.simulate_attack, name='simulate_attack'),
    path('mitigate/', views.mitigate_env, name='mitigate_env'),
    path('destroy/', views.destroy_env, name='destroy_env'),
    path('download-matrix/', views.download_matrix, name='download_matrix'),
]