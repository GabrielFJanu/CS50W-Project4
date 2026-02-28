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
                    content: newPostContent.value,
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
                load_post_page(1); //após sucesso do fetch, carrega página com o novo post
            })
            .catch(error => {
                newPostError.innerHTML = error.message; //mensagem de erro aparece
                newPostSubmitButton.disabled = false; //torna submit button abled para o usuário editar ou reenviar o form
            });
        };
    }

    //começa mostrando a primeira página
    load_post_page(1);
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

function load_post_page(page) {
    const postsDiv = document.querySelector('#posts');
    const paginationDiv = document.querySelector('#pagination')
    postsDiv.innerHTML = '';
    paginationDiv.innerHTML = '';

    fetch(`/posts?page=${page}`)
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

            const username = document.createElement("h6");
            username.className = "card-title mb-2";
            username.textContent = post.poster;

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

            const likes = document.createElement("div");
            likes.className = "card-link";
            likes.innerHTML = `♥️ ${0}`;

            cardBody.append(
                username,
                content,
                date,
                likes
            );

            postCard.append(cardBody);

            postsDiv.append(postCard);
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
            load_post_page(data.page - 1);
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
                load_post_page(i);
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
            load_post_page(data.page + 1);
        };

        nextLi.append(nextButton);
        ul.append(nextLi);

        nav.append(ul);
        paginationDiv.append(nav);
    })
    .catch(error => console.error(error));
}