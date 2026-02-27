document.addEventListener('DOMContentLoaded', () => {
    const newPostForm = document.querySelector("#new-post-form")
    
    if (newPostForm){ //usuário logado

        const newPostContent = newPostForm.querySelector("#new-post-content")
        const newPostSubmitButton = newPostForm.querySelector("#new-post-submit-button")

        newPostSubmitButton.disabled = true; //inicia com submit button disabled

        newPostForm.onsubmit = event => {
            event.preventDefault(); //evita recarregar página
            newPostContent.value = ''; //esvazia o content
            newPostSubmitButton.disabled = true; //submit button volta disabled
        };

        newPostContent.oninput = () => {
            newPostSubmitButton.disabled = newPostContent.value.trim() === ''; //se content.trim() vazio = submit button disabled
        };
    }
});