import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator
from django.views.decorators.http import require_http_methods

from .models import User, Post

# APIs
@require_http_methods(["PUT"])
def update_post(request, post_id):

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Login required."}, status=403)
    
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)
    
    if post.poster != request.user:
        return JsonResponse({"error": "You can only edit your own posts."}, status=403) # 403 é mais apropriado que 400 aqui
    
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON."}, status=400)
    
    content = body.get("content", "").strip()

    if not content:
        return JsonResponse({"error": "Content cannot be empty."}, status=400)

    if len(content) > 280:
        return JsonResponse({"error": "Post cannot exceed 280 characters."}, status=400)

    post.content = content
    post.save()

    return JsonResponse({
        "message": "Post edited successfully.",
        "content": post.content
    }, status=200)
    
@require_http_methods(["PUT"])
def toggle_follow(request, username):

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Login required."}, status=403)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)
    
    if user == request.user:
        return JsonResponse({"error": "You cannot follow yourself."}, status=400)
    
    already_followed = request.user.following.filter(id=user.id).exists()

    if already_followed:
        request.user.following.remove(user)
        is_followed = False
    else:
        request.user.following.add(user)
        is_followed = True

    response = user.serialize()
    response["is_followed"] = is_followed

    return JsonResponse(response, status=200)


@require_http_methods(["GET"])
def user_profile(request, username):

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)
    
    response = user.serialize()
    response["is_followed"] = request.user.is_authenticated and request.user.following.filter(pk=user.id).exists()
    response["is_me"] = request.user.is_authenticated and user == request.user

    return JsonResponse(response, status=200)


@require_http_methods(["PUT"])
def toggle_like(request, post_id):

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Login required."}, status=403)

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)

    already_liked = post.likes.filter(id=request.user.id).exists()

    if already_liked:
        post.likes.remove(request.user)
        is_liked = False
    else:
        post.likes.add(request.user)
        is_liked = True

    return JsonResponse({
        "likes": post.likes.count(),
        "is_liked": is_liked
    }, status=200)

@require_http_methods(["GET","POST"])
def posts(request):
    if request.method == "GET":

        username = request.GET.get("username")
        following = request.GET.get("following")

        posts = Post.objects.all()

        if following:
            if not request.user.is_authenticated:
                return JsonResponse({"error": "Login required."}, status=403)
            
            posts = posts.filter(poster__in=request.user.following.all())

        if username:
            posts = posts.filter(poster__username=username)

        posts = posts.order_by("-created_at")

        paginator = Paginator(posts, 10)

        page_number = request.GET.get("page")
        page_obj = paginator.get_page(page_number)

        posts_data = []
        for post in page_obj:
            p = post.serialize()
            p["is_liked"] = request.user.is_authenticated and post.likes.filter(id=request.user.id).exists()
            p["is_owner"] = request.user.is_authenticated and (post.poster == request.user)
            posts_data.append(p)

        response = {
            "page": page_obj.number,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
            "num_pages": paginator.num_pages,
            "posts": posts_data,
        }

        return JsonResponse(response, status=200)
    
    elif request.method == "POST":
        
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Login required."}, status=403)
        
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON."}, status=400)
        
        content = body.get("content", "").strip()

        if not content:
            return JsonResponse({"error": "Content cannot be empty."}, status=400)

        if len(content) > 280:
            return JsonResponse({"error": "Post cannot exceed 280 characters."}, status=400)

        Post.objects.create(content=content, poster=request.user)

        return JsonResponse({"message": "Post created successfully."}, status=201)


# renders
def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
