import { FRAGMENTS_URL } from './config.js';

let allFragments = [];
let activeTag = null;

document.addEventListener('DOMContentLoaded', async () => {
    const feed = document.getElementById('fragments-feed');
    const tagFilter = document.getElementById('tag-filter');

    try {
        const res = await fetch(FRAGMENTS_URL);
        if (!res.ok) throw new Error('Failed to fetch fragments');
        allFragments = await res.json();
    } catch (e) {
        console.error('Fragments load error:', e);
        feed.innerHTML = '<div class="fragments-empty">Failed to load fragments. Is the backend running?</div>';
        return;
    }

    if (!allFragments.length) {
        feed.innerHTML = '<div class="fragments-empty">No fragments yet. Thoughts are waiting to be captured.</div>';
        return;
    }

    renderTagFilter(tagFilter);
    renderFragments(feed);
});

function renderTagFilter(container) {
    const tagCount = {};
    allFragments.forEach(f => {
        (f.tags || []).forEach(t => {
            tagCount[t] = (tagCount[t] || 0) + 1;
        });
    });

    const tags = Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]);
    if (tags.length === 0) return;

    let html = '<button class="tag-filter-btn active" data-tag="">All</button>';
    tags.forEach(t => {
        html += `<button class="tag-filter-btn" data-tag="${t}">${t} (${tagCount[t]})</button>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('.tag-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTag = btn.dataset.tag || null;
            renderFragments(document.getElementById('fragments-feed'));
        });
    });
}

function renderFragments(container) {
    const filtered = activeTag
        ? allFragments.filter(f => (f.tags || []).includes(activeTag))
        : allFragments;

    if (!filtered.length) {
        container.innerHTML = '<div class="fragments-empty">No fragments with this tag.</div>';
        return;
    }

    container.innerHTML = filtered.map(f => {
        const html = marked.parse(f.text);
        const dateStr = new Date(f.date).toISOString();
        const displayDate = formatRelativeTime(f.date);
        const absDate = new Date(f.date).toLocaleString('zh-CN');
        const tagsHtml = (f.tags || []).map(t => `<span class="fragment-tag">${t}</span>`).join('');

        return `
            <div class="fragment-card">
                <div class="fragment-date">
                    <span class="relative-time">${displayDate}</span>
                    <span class="absolute-time">${absDate}</span>
                </div>
                <div class="fragment-text">${html}</div>
                ${tagsHtml ? `<div class="fragment-tags">${tagsHtml}</div>` : ''}
            </div>
        `;
    }).join('');

    // GSAP entrance animation
    gsap.fromTo('.fragment-card',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08 }
    );
}

function formatRelativeTime(dateStr) {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 30) return `${days} days ago`;
    if (months < 12) return `${months} months ago`;
    return `${years} years ago`;
}
