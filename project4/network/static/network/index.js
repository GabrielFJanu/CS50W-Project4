document.addEventListener('DOMContentLoaded', () => {
    const newPostForm = document.querySelector('#new-post-form')
    
    if (newPostForm){ //usuário logado

        const newPostContent = newPostForm.querySelector('#new-post-content')
        const newPostSubmitButton = newPostForm.querySelector('#new-post-submit-button')
        const newPostError = newPostForm.querySelector('#new-post-error')

        newPostSubmitButton.disabled = true; //inicia com submit button disabled

        newPostContent.oninput = () => {
            newPostSubmitButton.disabled = !newPostContent.value.trim(); //se content.trim() vazio = submit button disabled
        };

        newPostForm.onsubmit = event => {
            event.preventDefault(); //evita recarregar página
            newPostSubmitButton.disabled = true; //torna submit button disabled para evitar mais clicks

            fetch('/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    content: newPostContent.value.trim(),
                })
            })
            .then(response => {
                return response.json().then(json => {
                    if (!response.ok){
                        throw new Error(json.error);
                    }
                    return json;
                });
            })
            .then(jsonResponse => {
                newPostContent.value = '';
                newPostError.innerHTML = '';
                console.log(jsonResponse.message);
                load_all_posts(); //após sucesso do fetch, carrega página com o novo post
            })
            .catch(error => {
                newPostError.textContent = error.message; //mensagem de erro aparece
                newPostSubmitButton.disabled = false; //torna submit button abled para o usuário editar ou reenviar o form
            });
        };
    }

    //começa mostrando a primeira página
    load_all_posts();
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function load_feed(feed, page, username = '') {

    const postsList = feed.querySelector('.posts-list');
    const feedPagination = feed.querySelector('.feed-pagination')
    postsList.innerHTML = '';
    feedPagination.innerHTML = '';

    fetch(`/posts?page=${page}&username=${username}`)
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to load posts");
        }
        return response.json();
    })
    .then(data => {
        //posts
        data.posts.forEach(post => {
            
            const postCard = document.createElement("div");
            postCard.className = "card m-4"; // Mantendo a margem externa

            const cardBody = document.createElement("div");
            cardBody.className = "card-body";

            const usernameEl = document.createElement("h6");
            usernameEl.className = "card-title mb-2 font-weight-bold";
            usernameEl.textContent = `@${post.poster}`;
            usernameEl.style.cursor = "pointer";
            usernameEl.onclick = () => {
                load_profile_page(post.poster);
            };

            const content = document.createElement("p");
            content.className = "card-text my-2";
            content.textContent = post.content;

            const date = document.createElement("small");
            date.className = "text-muted d-block mb-2";
            date.textContent = new Date(post.created_at)
                .toLocaleString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit"
                });

            const likeContainer = document.createElement("div");
            likeContainer.className = "d-flex align-items-center";

            // Coração
            const likeHeart = document.createElement("span");
            likeHeart.className = "like-heart";
            likeHeart.style.cursor = "pointer";
            likeHeart.style.fontSize = "1.4rem";
            likeHeart.style.userSelect = "none";
            likeHeart.style.color = post.is_liked ? "#ed4956" : "#979797";
            likeHeart.textContent = post.is_liked ? "♥" : "♡";

            likeHeart.onclick = () => {
                fetch(`/posts/${post.id}/toggle_like`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCookie("csrftoken")
                    }
                })
                .then(response => {
                    return response.json().then(json => {
                        if (!response.ok){
                            throw new Error(json.error);
                        }
                        return json;
                    });
                })
                .then(data => {
                    post.is_liked = data.is_liked;
                    likeHeart.style.color = data.is_liked ? "#ed4956" : "#979797";
                    likeHeart.textContent = data.is_liked ? "♥" : "♡";
                    likeHeart.parentElement.querySelector('.like-count').textContent = data.likes;
                })
                .catch(error => {
                    console.error(error);
                });
            };

            // Contador
            const likeCount = document.createElement("span");
            likeCount.className = "like-count ml-1";
            likeCount.style.fontWeight = "500";
            likeCount.textContent = post.likes;

            likeContainer.append(likeHeart, likeCount);

            cardBody.append(
                usernameEl,
                content,
                date,
                likeContainer,
            );

            postCard.append(cardBody);

            postsList.append(postCard);
        });

        //pagination
        const nav = document.createElement("nav");
        nav.setAttribute("aria-label", "Page navigation");

        const ul = document.createElement("ul");
        ul.className = "pagination justify-content-center";

        // Previous
        const prevLi = document.createElement("li");
        prevLi.className = `page-item ${!data.has_previous ? "disabled" : ""}`;

        const prevButton = document.createElement("button");
        prevButton.className = "page-link";
        prevButton.type = "button";
        prevButton.textContent = "Previous";

        prevButton.onclick = () => {
            load_feed(feed, data.page - 1, username);
        };

        prevLi.append(prevButton);
        ul.append(prevLi);

        // Page numbers
        for (let i = 1; i <= data.num_pages; i++) {

            const li = document.createElement("li");
            li.className = `page-item ${i === data.page ? "active" : ""}`;

            const button = document.createElement("button");
            button.className = "page-link";
            button.type = "button";
            button.textContent = i;

            button.onclick = () => {
                load_feed(feed, i, username);
            };

            li.append(button);
            ul.append(li);
        }

        // Next
        const nextLi = document.createElement("li");
        nextLi.className = `page-item ${!data.has_next ? "disabled" : ""}`;

        const nextButton = document.createElement("button");
        nextButton.className = "page-link";
        nextButton.type = "button";
        nextButton.textContent = "Next";

        nextButton.onclick = () => {
            load_feed(feed, data.page + 1, username);
        };

        nextLi.append(nextButton);
        ul.append(nextLi);

        nav.append(ul);
        feedPagination.append(nav);
    })
    .catch(error => console.error(error));
}

function load_all_posts() {
    document.querySelector('#profile-page-view').style.display = 'none';

    const view = document.querySelector('#all-posts-view');
    view.style.display = 'block';

    const feed = view.querySelector('.feed');
    load_feed(feed, 1);
}

function load_profile_page(username) {
  document.querySelector('#all-posts-view').style.display = 'none';

  const view = document.querySelector('#profile-page-view');
  view.style.display = 'block';
  const feed = view.querySelector('.feed');

  fetch(`/users/${username}`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to load profile page");
      }
      return response.json();
    })
    .then(data => {
      const header = view.querySelector('#profile-info-header');
      header.innerHTML = '';

      const container = document.createElement('div');
      container.className = 'card m-2';

      container.innerHTML = `
        <div class="card-body d-flex justify-content-between align-items-center">
          <div>
            <h2 class="card-title font-weight-bold mb-1" id="profile-username"></h2>
            <div class="d-flex text-muted">
              <div class="mr-4">
                <span class="font-weight-bold text-dark" id="following-count"></span> Following
              </div>
              <div>
                <span class="font-weight-bold text-dark" id="follower-count"></span> Followers
              </div>
            </div>
          </div>
          <div id="follow-button-container"></div>
        </div>
      `;

      container.querySelector('#profile-username').textContent = `@${data.username}`;
      container.querySelector('#following-count').textContent = data.following;
      container.querySelector('#follower-count').textContent = data.followers;

      header.append(container);

      if (!data.is_me) {
        const btn = document.createElement('button');
        btn.className = data.is_followed
          ? 'btn btn-outline-secondary px-4'
          : 'btn btn-primary px-4';

        btn.textContent = data.is_followed ? 'Unfollow' : 'Follow';

        btn.onclick = () => {
            fetch(`/users/${username}/toggle_follow`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken")
                }
            })
            .then(response => {
                return response.json().then(json => {
                    if (!response.ok){
                        throw new Error(json.error);
                    }
                    return json;
                });
            })
            .then(toggleData => {
                container.querySelector('#following-count').textContent = toggleData.following;
                container.querySelector('#follower-count').textContent = toggleData.followers;
                btn.className = toggleData.is_followed
                ? 'btn btn-outline-secondary px-4'
                : 'btn btn-primary px-4';
                btn.textContent = toggleData.is_followed ? 'Unfollow' : 'Follow';
            })
            .catch(error => {
                console.error(error);
            });
        };

        container.querySelector('#follow-button-container').append(btn);
      }

      load_feed(feed, 1, data.username);
    })
    .catch(error => console.error(error));
}