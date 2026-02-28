from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.text import Truncator


class User(AbstractUser):
    #following
    following = models.ManyToManyField("self", symmetrical=False, blank=True, related_name="followers") #symmetrical = False, indica que A segue B não implica necessáriamente que B segue A. Como se autoreferencia, então por default symmetrical=True, o que levaria related_name perder seu sentido.

class Post(models.Model):
    #content
    content = models.CharField(max_length=280) #padrão twitter/X
    #poster
    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    #created_at
    created_at = models.DateTimeField(auto_now_add=True) #preenchido automaticamente quando criado
    #updated_at
    updated_at = models.DateTimeField(auto_now=True) #preenchido automaticamente quando salvo

    def __str__(self):
        return f'"{Truncator(self.content).chars(50)}" by {self.poster}'
    
    def serialize(self):
        return {
            "id": self.id,
            "content": self.content,
            "poster": self.poster.username,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

class Like(models.Model):
    #post
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    #liker
    liker = models.ForeignKey(User, on_delete=models.CASCADE, related_name="likes")
    #liked_at
    liked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["post", "liker"], name="unique_like_per_user_post")
        ]
    
    def __str__(self):
        return f"{self.liker} likes {self.post}"