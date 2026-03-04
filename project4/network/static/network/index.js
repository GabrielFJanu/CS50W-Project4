document.addEventListener('DOMContentLoaded', () => {
    const newPostForm = document.querySelector('#new-post-form');

    if (newPostForm) { // usuário logado
        const newPostContent = newPostForm.querySelector('#new-post-content');
        const newPostSubmitButton = newPostForm.querySelector('#new-post-submit-button');
        const newPostError = newPostForm.querySelector('#new-post-error');

        newPostSubmitButton.disabled = true;

        newPostContent.oninput = () => {
            newPostSubmitButton.disabled = !newPostContent.value.trim();
        };

        newPostForm.onsubmit = event => {
            event.preventDefault();
            newPostSubmitButton.disabled = true;

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
                    if (!response.ok) {
                        throw new Error(json.error);
                    }
                    return json;
                });
            })
            .then(jsonResponse => {
                newPostContent.value = '';
                newPostError.textContent = '';
                console.log(jsonResponse.message);
                loadAllPosts();
            })
            .catch(error => {
                newPostError.textContent = error.message;
                newPostSubmitButton.disabled = false;
            });
        };
    }

    const navLinkUsername = document.querySelector('#nav-link-username')

    if(navLinkUsername) {
        navLinkUsername.onclick = event => {
            event.preventDefault();
            loadProfilePage(navLinkUsername.dataset.username);
        };
    }

    const navLinkFollowing = document.querySelector('#nav-link-following')

    if(navLinkFollowing) {
        navLinkFollowing.onclick = event => {
            event.preventDefault();
            loadFollowing();
        };
    }

    loadAllPosts();
});

// Função para obter o CSRF Token do Django
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

function showView(selector) {
    document.querySelector(selector).classList.remove('hidden');
}

function hideView(selector) {
    document.querySelector(selector).classList.add('hidden');
}

// Carrega o feed de posts (para All Posts ou Profile)
function loadFeed(feed, page, username = '', following = false) {
    const postsList = feed.querySelector('.posts-list');
    const feedPagination = feed.querySelector('.feed-pagination');

    postsList.innerHTML = '';
    feedPagination.innerHTML = '';

    let url = `/posts?page=${page}`;

    if (username) {
        url += `&username=${username}`;
    }

    if (following) {
        url += `&following=1`;
    }

    fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to load posts");
        }
        return response.json();
    })
    .then(data => {
        data.posts.forEach(post => {
            const postCard = document.createElement("div");
            postCard.className = "card post-card";

            const cardBody = document.createElement("div");
            cardBody.className = "card-body";

            const usernameEl = document.createElement("a");
            usernameEl.href = '#';
            usernameEl.className = "post-username";
            usernameEl.textContent = `@${post.poster}`;
            usernameEl.onclick = event => {
                event.preventDefault();
                loadProfilePage(post.poster);
            };

            const content = document.createElement("p");
            content.className = "post-content";
            content.textContent = post.content;

            cardBody.append(usernameEl, content);

            const date = document.createElement("time");
            date.className = "post-date";
            date.dateTime = post.created_at;
            date.textContent = new Date(post.created_at)
                .toLocaleString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit"
                });
            
            cardBody.append(date);

            if (post.is_owner) {
                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.className = "btn btn-link post-edit-button";
                editButton.textContent = "Edit";

                const editPostForm = document.createElement("form");
                editPostForm.className = 'edit-post-form';
                editPostForm.innerHTML = `
                    <div class="form-group">
                        <textarea 
                            class="form-control edit-post-content"  
                            rows="3"
                            maxlength="280"></textarea>
                        <div class="edit-post-error"></div>
                    </div>
                    <button type="submit" class="btn btn-primary edit-post-submit-button">
                        Save
                    </button>`;
                editPostForm.classList.add('hidden');

                const editPostContent = editPostForm.querySelector('.edit-post-content');
                const editPostSubmitButton = editPostForm.querySelector('.edit-post-submit-button');
                const editPostError = editPostForm.querySelector('.edit-post-error');

                editButton.onclick = () => {
                    editPostContent.value = content.textContent;
                    editPostContent.focus();
                    editPostError.textContent = '';
                    editPostSubmitButton.disabled = false;

                    content.classList.add('hidden');
                    editButton.classList.add('hidden');
                    editPostForm.classList.remove('hidden');
                };

                editPostContent.oninput = () => {
                    editPostSubmitButton.disabled = !editPostContent.value.trim();
                };

                editPostForm.onsubmit = event => {
                    event.preventDefault();
                    editPostSubmitButton.disabled = true;

                    fetch(`/posts/${post.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken')
                        },
                        body: JSON.stringify({
                            content: editPostContent.value.trim(),
                        })
                    })
                    .then(response => {
                        return response.json().then(json => {
                            if (!response.ok) {
                                throw new Error(json.error);
                            }
                            return json;
                        });
                    })
                    .then(jsonResponse => {
                        content.textContent = jsonResponse.content;
                        editPostError.textContent = '';

                        content.classList.remove('hidden');
                        editButton.classList.remove('hidden');
                        editPostForm.classList.add('hidden');

                        console.log(jsonResponse.message);
                    })
                    .catch(error => {
                        editPostError.textContent = error.message;
                        editPostSubmitButton.disabled = false;
                    });
                };

                cardBody.append(editButton, editPostForm);
            }

            if (post.is_authenticated){
                const likeContainer = document.createElement("div");
                likeContainer.className = "like-container";

                const likeButton = document.createElement("button");
                likeButton.type = "button";
                likeButton.className = `like-heart ${post.is_liked ? 'liked' : ''}`;
                likeButton.textContent = post.is_liked ? "♥" : "♡";

                likeButton.onclick = () => {
                    fetch(`/posts/${post.id}/likes`, {
                        method: post.is_liked? "DELETE": "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRFToken": getCookie("csrftoken")
                        }
                    })
                    .then(response => {
                        return response.json().then(json => {
                            if (!response.ok) {
                                throw new Error(json.error);
                            }
                            return json;
                        });
                    })
                    .then(data => {
                        post.is_liked = data.is_liked;
                        likeButton.classList.toggle('liked', data.is_liked);
                        likeButton.textContent = data.is_liked ? "♥" : "♡";
                        likeContainer.querySelector('.like-count').textContent = data.likes;
                    })
                    .catch(error => console.error(error));
                };

                const likeCount = document.createElement("span");
                likeCount.className = "like-count";
                likeCount.textContent = post.likes;

                likeContainer.append(likeButton, likeCount);
                cardBody.append(likeContainer);
            }

            postCard.append(cardBody);
            postsList.append(postCard);
        });

        const nav = document.createElement("nav");
        nav.setAttribute("aria-label", "Page navigation");

        const ul = document.createElement("ul");
        ul.className = "pagination feed-pagination-list";

        // Previous
        const prevLi = document.createElement("li");
        prevLi.className = `page-item ${!data.has_previous ? "disabled" : ""}`;

        const prevButton = document.createElement("button");
        prevButton.className = "page-link";
        prevButton.type = "button";
        prevButton.textContent = "Previous";
        prevButton.disabled = !data.has_previous;
        if (data.has_previous) {
            prevButton.onclick = () => loadFeed(feed, data.page - 1, username, following);
        }

        prevLi.append(prevButton);
        ul.append(prevLi);

        // números
        for (let i = 1; i <= data.num_pages; i++) {
            const li = document.createElement("li");
            li.className = `page-item ${i === data.page ? "active" : ""}`;

            const button = document.createElement("button");
            button.className = "page-link";
            button.type = "button";
            button.textContent = i;
            button.onclick = () => loadFeed(feed, i, username, following);

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
        nextButton.disabled = !data.has_next;
        if (data.has_next) {
            nextButton.onclick = () => loadFeed(feed, data.page + 1, username, following);
        }

        nextLi.append(nextButton);
        ul.append(nextLi);

        nav.append(ul);
        feedPagination.append(nav);
    })
    .catch(error => console.error(error));
}

function loadAllPosts() {
    showView('#all-posts-view');
    hideView('#profile-page-view');
    hideView('#following-view');

    const view = document.querySelector('#all-posts-view');
    const feed = view.querySelector('.feed');
    loadFeed(feed, 1);
}

function loadProfilePage(username) {
    hideView('#all-posts-view');
    showView('#profile-page-view');
    hideView('#following-view');

    const view = document.querySelector('#profile-page-view');
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
        container.className = 'card profile-card';

        container.innerHTML = `
            <div class="card-body profile-header">
                <div>
                    <h2 class="profile-username" id="profile-username"></h2>
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <span class="profile-stat-number" id="following-count"></span> Following
                        </div>
                        <div class="profile-stat">
                            <span class="profile-stat-number" id="follower-count"></span> Followers
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

        if (data.is_authenticated && !data.is_me) {
            const btn = document.createElement('button');
            btn.type = "button";
            btn.className = data.is_followed
                ? 'btn btn-outline-secondary profile-follow-button'
                : 'btn btn-primary profile-follow-button';
            btn.textContent = data.is_followed ? 'Unfollow' : 'Follow';

            btn.onclick = () => {
                fetch(`/users/${username}/followers`, {
                    method: data.is_followed? "DELETE" : "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": getCookie("csrftoken")
                    }
                })
                .then(response => {
                    return response.json().then(json => {
                        if (!response.ok) {
                            throw new Error(json.error);
                        }
                        return json;
                    });
                })
                .then(toggleData => {
                    data.is_followed = toggleData.is_followed;
                    container.querySelector('#following-count').textContent = toggleData.following;
                    container.querySelector('#follower-count').textContent = toggleData.followers;

                    btn.className = toggleData.is_followed
                        ? 'btn btn-outline-secondary profile-follow-button'
                        : 'btn btn-primary profile-follow-button';
                    btn.textContent = toggleData.is_followed ? 'Unfollow' : 'Follow';
                })
                .catch(error => console.error(error));
            };

            container.querySelector('#follow-button-container').append(btn);
        }

        loadFeed(feed, 1, data.username);
    })
    .catch(error => console.error(error));
}

function loadFollowing(){
    hideView('#all-posts-view');
    hideView('#profile-page-view');
    showView('#following-view');

    const view = document.querySelector('#following-view');
    const feed = view.querySelector('.feed');

    loadFeed(feed, 1, '', true);
}