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
def like_post(request, post_id):

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Login required."}, status=403)

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)

    data = json.loads(request.body)
    like = data.get("like")

    if like:
        post.likes.add(request.user)
    else:
        post.likes.remove(request.user)

    return JsonResponse({
        "likes": post.likes.count(),
        "is_liked": post.likes.filter(id=request.user.id).exists()
    }, status=200)

@require_http_methods(["GET","POST"])
def posts(request):
    if request.method == "GET":
        posts = Post.objects.all().order_by("-created_at")
        paginator = Paginator(posts, 10)

        page_number = request.GET.get("page")
        page_obj = paginator.get_page(page_number)

        posts_data = []
        for post in page_obj:
            p = post.serialize()
            p["is_liked"] = request.user.is_authenticated and post.likes.filter(id=request.user.id).exists()
            posts_data.append(p)

        data = {
            "page": page_obj.number,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
            "num_pages": paginator.num_pages,
            "posts": posts_data,
        }

        return JsonResponse(data, status=200)
    
    elif request.method == "POST":
        
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Login required."}, status=403)
        
        data = json.loads(request.body)
        content = data.get("content", "").strip()

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
