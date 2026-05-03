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

        // B2: Add copy buttons to code blocks
        addCopyButtons();

        // B3: Init article reading progress bar
        initArticleProgress();
        
        // Show content
        loadingIndicator.style.display = 'none';
        contentContainer.style.display = 'block';
        document.getElementById('reading-links').style.display = 'block';
        interactionsContainer.style.display = 'block';

        // B1: Build TOC
        buildTOC(contentContainer);
        
        // --- A2: Immersive Reveal Animation ---
        // 1. Initial Header Animation
        gsap.fromTo([contentContainer.firstChild, '.interactions-container'], 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.2 }
        );

        // 2. Scroll-triggered Paragraph Animations
        const elements = contentContainer.querySelectorAll('p, blockquote, h2, h3, img, pre, .comment-item');
        elements.forEach((el) => {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: "top 90%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                y: 20,
                duration: 0.8,
                ease: "power2.out"
            });
        });
        
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

function addCopyButtons() {
    document.querySelectorAll('.markdown-body pre').forEach(pre => {
        if (pre.querySelector('.copy-btn')) return;
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = 'Copy';
        btn.title = 'Copy code';
        btn.addEventListener('click', async () => {
            const code = pre.querySelector('code')?.innerText || '';
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(code);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = code;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                btn.textContent = '✓ Copied';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            } catch (err) { console.error('Copy failed:', err); }
        });
        pre.style.position = 'relative';
        pre.appendChild(btn);
    });
}

function initArticleProgress() {
    const bar = document.getElementById('article-progress-bar');
    const article = document.getElementById('markdown-content');
    if (!bar || !article) return;
    window.addEventListener('scroll', () => {
        const rect = article.getBoundingClientRect();
        const articleHeight = article.offsetHeight;
        const scrolled = Math.max(0, -rect.top);
        const progress = Math.min(Math.max(scrolled / (articleHeight - window.innerHeight), 0), 1);
        bar.style.width = `${progress * 100}%`;
    });
}

function estimateReadingMinutes(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

function buildTOC(contentEl) {
    const sidebar = document.getElementById('toc-sidebar');
    if (!sidebar) return;
    const headings = contentEl.querySelectorAll('h2, h3');
    if (headings.length === 0) return;

    let html = '<div class="toc-title">Contents</div>';
    headings.forEach((h, i) => {
        if (!h.id) h.id = `heading-${i}`;
        html += `<a class="toc-link" href="#${h.id}" data-level="${h.tagName[1]}">${h.textContent}</a>`;
    });
    sidebar.innerHTML = html;
    sidebar.style.display = 'block';

    const links = sidebar.querySelectorAll('.toc-link');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                links.forEach(l => l.classList.remove('active'));
                sidebar.querySelector(`[href="#${e.target.id}"]`)?.classList.add('active');
            }
        });
    }, { rootMargin: '-10% 0px -80% 0px' });
    headings.forEach(h => observer.observe(h));
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
