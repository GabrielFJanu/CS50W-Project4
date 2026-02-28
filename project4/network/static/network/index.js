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

document.addEventListener('DOMContentLoaded', () => {
    const newPostForm = document.querySelector("#new-post-form")
    
    if (newPostForm){ //usuário logado

        const newPostContent = newPostForm.querySelector("#new-post-content")
        const newPostSubmitButton = newPostForm.querySelector("#new-post-submit-button")
        const newPostError = newPostForm.querySelector("#new-post-error")

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
            })
            .catch(error => {
                newPostError.innerHTML = error.message; //mensagem de erro aparece
                newPostSubmitButton.disabled = false; //torna submit button abled para o usuário editar ou reenviar o form
            });
        };
    }
});