// article.js - Fetches and renders markdown articles from CMS
import { POSTS_URL } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    const loadingIndicator = document.getElementById('loading-indicator');
    const contentContainer = document.getElementById('markdown-content');
    const interactionsContainer = document.getElementById('article-interactions');
    
    // UI Elements for Interactions
    const likeBtn = document.getElementById('btn-like');
    const likeCountSpan = document.getElementById('like-count');
    const commentCountSpan = document.getElementById('comment-count');
    const commentsList = document.getElementById('comments-list');
    const btnSubmitComment = document.getElementById('btn-submit-comment');
    const inputCommentAuthor = document.getElementById('comment-author');
    const inputCommentText = document.getElementById('comment-text');

    if (!postId) {
        showError("Missing Article ID. Please provide an ?id= parameter.");
        return;
    }

    try {
        const response = await fetch(`${POSTS_URL}/${postId}`);
        const postsResponse = await fetch(POSTS_URL);
        
        if (!response.ok || !postsResponse.ok) {
            throw new Error(`Article not found (404)`);
        }
        
        const post = await response.json();
        const posts = await postsResponse.json();
        
        // Parse markdown to HTML
        const htmlContent = marked.parse(post.content);
        
        // Inject content
        contentContainer.innerHTML = htmlContent;
        
        // Render Tags and Meta
        const metaDiv = document.createElement('div');
        metaDiv.className = 'article-meta-header';
        metaDiv.style.marginBottom = '2rem';
        metaDiv.style.color = 'var(--text-secondary)';
        const readingMinutes = estimateReadingMinutes(post.content);
        const updatedText = post.updatedAt || post.date;
        metaDiv.innerHTML = `
            <span>${post.date}</span>
            <span style="margin-left: 1rem;">${readingMinutes} min read</span>
            <span style="margin-left: 1rem;">Updated ${updatedText}</span>
            <div style="display:inline-flex; gap:0.5rem; margin-left: 1rem;">
                ${post.tags.map(t => `<span style="color:var(--primary-color);">#${t}</span>`).join('')}
            </div>
        `;
        contentContainer.insertBefore(metaDiv, contentContainer.firstChild);

        // Render Likes and Comments State
        likeCountSpan.textContent = post.likes || 0;
        renderComments(post.comments || []);
        renderReadingLinks(posts, post);
        
        // Apply syntax highlighting
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
        
        // Show content
        loadingIndicator.style.display = 'none';
        contentContainer.style.display = 'block';
        document.getElementById('reading-links').style.display = 'block';
        interactionsContainer.style.display = 'block';
        
        gsap.fromTo([contentContainer, interactionsContainer], 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", stagger: 0.2 }
        );
        
        document.title = `${post.title} | Plate.`;

    } catch (error) {
        console.error("Failed to load article:", error);
        showError(`Failed to load article: ${postId}. Please check if the CMS backend is running.`);
    }

    // Handle Like
    likeBtn.addEventListener('click', async () => {
        try {
            const res = await fetch(`${POSTS_URL}/${postId}/like`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                likeCountSpan.textContent = data.likes;
                likeBtn.style.color = '#FF5F56';
                likeBtn.style.transform = 'scale(1.1)';
                setTimeout(() => likeBtn.style.transform = 'scale(1)', 200);
            }
        } catch (e) {
            console.error(e);
        }
    });

    // Handle Comment Submit
    btnSubmitComment.addEventListener('click', async () => {
        const author = inputCommentAuthor.value.trim() || 'Anonymous';
        const text = inputCommentText.value.trim();
        
        if (!text) return alert('Please enter a comment.');
        
        try {
            const res = await fetch(`${POSTS_URL}/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, text })
            });
            
            if (res.ok) {
                const newComment = await res.json();
                appendComment(newComment);
                inputCommentText.value = '';
                commentCountSpan.textContent = parseInt(commentCountSpan.textContent) + 1;
            }
        } catch (e) {
            console.error(e);
        }
    });

    function renderComments(comments) {
        commentCountSpan.textContent = comments.length;
        commentsList.innerHTML = '';
        comments.forEach(appendComment);
    }

    function appendComment(comment) {
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.style.padding = '1rem';
        div.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        div.innerHTML = `
            <strong style="color:var(--primary-color);">${comment.author}</strong>
            <span style="color:var(--text-secondary); font-size: 0.8rem; margin-left: 1rem;">${new Date(comment.date).toLocaleString()}</span>
            <p style="margin-top: 0.5rem;">${comment.text}</p>
        `;
        commentsList.appendChild(div);
    }
    
    function showError(message) {
        loadingIndicator.style.display = 'none';
        contentContainer.style.display = 'block';
        contentContainer.innerHTML = `
            <div style="text-align: center; margin-top: 10vh;">
                <h1 style="color: var(--primary-color);">Error</h1>
                <p>${message}</p>
                <a href="/" class="back-link" style="margin-top: 2rem;">Return to Homepage</a>
            </div>
        `;
    }
});

function estimateReadingMinutes(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

function renderReadingLinks(posts, currentPost) {
    const nav = document.getElementById('post-navigation');
    const currentIndex = posts.findIndex(p => p.id === currentPost.id);
    
    const prev = posts[currentIndex + 1];
    const next = posts[currentIndex - 1];
    
    nav.innerHTML = `
        ${prev ? `<a href="/article.html?id=${prev.id}" class="reading-card"><span>Previous</span><strong>${prev.title}</strong></a>` : '<div class="reading-card muted"><span>Previous</span><strong>None</strong></div>'}
        ${next ? `<a href="/article.html?id=${next.id}" class="reading-card"><span>Next</span><strong>${next.title}</strong></a>` : '<div class="reading-card muted"><span>Next</span><strong>None</strong></div>'}
    `;
}
