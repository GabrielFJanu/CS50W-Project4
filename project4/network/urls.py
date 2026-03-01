
from django.urls import path

from . import views

urlpatterns = [
    #renders
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    #APIs
    path("posts", views.posts, name="posts"),
    path("posts/<int:post_id>/toggle_like", views.toggle_like, name="toggle_like"),
    path("users/<str:username>", views.user_profile, name="user_profile"),
]
