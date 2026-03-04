
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
    path("posts/<int:post_id>", views.post, name="post"),
    path("posts/<int:post_id>/likes", views.post_likes, name="post_likes"),
    path("users/<str:username>", views.user_profile, name="user_profile"),
    path("users/<str:username>/followers", views.user_followers, name="user_followers"),
]
