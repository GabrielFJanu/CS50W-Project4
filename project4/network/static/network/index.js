document.addEventListener('DOMContentLoaded', () => {
    const newPostForm = document.querySelector("#new-post-form")
    newPostForm.onsubmit = event => {
        event.preventDefault();
        event.target.querySelector("#new-post-content").value = '';
    }
});