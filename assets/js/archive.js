import { POSTS_URL } from './config.js';
const root = document.getElementById('archive-root');

function getMonthKey(dateText) {
  if (!dateText) return 'Unknown';
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return dateText.slice(0, 7) || 'Unknown';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
}

async function initArchivePage() {
  if (!root) return;
  try {
    const response = await fetch(POSTS_URL);
    if (!response.ok) throw new Error('Failed to load posts.');
    const posts = await response.json();

    const groupMap = new Map();
    posts.forEach((post) => {
      const key = getMonthKey(post.date);
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push(post);
    });

    const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));
    root.innerHTML = '';

    sortedKeys.forEach((key) => {
      const block = document.createElement('section');
      block.className = 'archive-group glass-card';
      const groupPosts = groupMap.get(key) || [];
      block.innerHTML = `<h2 class="archive-title">${key} (${groupPosts.length})</h2>`;

      groupPosts.forEach((post) => {
        const item = document.createElement('div');
        item.style.marginBottom = '0.55rem';
        item.innerHTML = `
          <a class="post-link" href="/article.html?id=${post.id}">${post.title}</a>
          <div class="meta-line">${post.date || ''}</div>
        `;
        block.appendChild(item);
      });

      root.appendChild(block);
    });
  } catch (error) {
    root.innerHTML = `<p class="meta-line">Error: ${error.message}</p>`;
  }
}

initArchivePage();
