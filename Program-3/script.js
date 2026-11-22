const STORAGE_KEY = "blogPosts";

const homePage = document.getElementById("homePage");
const formPage = document.getElementById("formPage");
const postsContainer = document.getElementById("postsContainer");
const postForm = document.getElementById("postForm");
const formHeading = document.getElementById("formHeading");
const message = document.getElementById("message");

const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const contentInput = document.getElementById("content");

let editingPostId = null;

// Get posts from Local Storage
function getPosts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

// Save posts to Local Storage
function savePosts(posts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

// Navigate between SPA views
function showPage(page) {
    homePage.classList.add("hidden");
    formPage.classList.add("hidden");

    if (page === "home") {
        homePage.classList.remove("hidden");
        displayPosts();
    } else {
        formPage.classList.remove("hidden");
    }

    window.scrollTo(0, 0);
}

// Display all blog posts
function displayPosts() {
    const posts = getPosts();

    postsContainer.replaceChildren();

    if (posts.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-message";
        empty.textContent = "No blog posts available. Create your first post!";
        postsContainer.appendChild(empty);
        return;
    }

    posts.forEach(post => {
        const card = document.createElement("article");
        card.className = "post-card";

        const title = document.createElement("h3");
        title.textContent = post.title;

        const meta = document.createElement("p");
        meta.className = "post-meta";
        meta.textContent = `By ${post.author} | ${post.date}`;

        const content = document.createElement("p");
        content.className = "post-content";
        content.textContent = post.content;

        const actions = document.createElement("div");
        actions.className = "post-actions";

        const editButton = document.createElement("button");
        editButton.className = "primary-btn";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editPost(post.id));

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deletePost(post.id));

        actions.append(editButton, deleteButton);
        card.append(title, meta, content, actions);

        postsContainer.appendChild(card);
    });
}

// Open form for adding a new post
function addPost() {
    editingPostId = null;

    postForm.reset();
    formHeading.textContent = "Create Blog Post";
    message.textContent = "";

    showPage("form");
}

// Open form for editing an existing post
function editPost(id) {
    const post = getPosts().find(post => post.id === id);

    if (!post) return;

    editingPostId = id;

    titleInput.value = post.title;
    authorInput.value = post.author;
    contentInput.value = post.content;

    formHeading.textContent = "Edit Blog Post";
    message.textContent = "";

    showPage("form");
}

// Delete a blog post
function deletePost(id) {
    const posts = getPosts();
    const updatedPosts = posts.filter(post => post.id !== id);

    savePosts(updatedPosts);
    displayPosts();
}

// Add or update a blog post
postForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !author || !content) {
        message.textContent = "Please fill in all fields.";
        message.style.color = "red";
        return;
    }

    const posts = getPosts();

    if (editingPostId) {
        const index = posts.findIndex(
            post => post.id === editingPostId
        );

        if (index === -1) {
            message.textContent = "Post not found.";
            message.style.color = "red";
            return;
        }

        posts[index] = {
            ...posts[index],
            title,
            author,
            content,
            date: new Date().toLocaleString()
        };
    } else {
        const newPost = {
            id: Date.now().toString(),
            title,
            author,
            content,
            date: new Date().toLocaleString()
        };

        posts.unshift(newPost);
    }

    savePosts(posts);
    postForm.reset();

    showPage("home");
});

// Navigation buttons
document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", function () {
        const page = button.dataset.page;

        if (page === "add") {
            addPost();
        } else {
            showPage("home");
        }
    });
});

// Cancel form
document.getElementById("cancelButton").addEventListener("click", function () {
    showPage("home");
});

// Initial page
displayPosts();
showPage("home");
