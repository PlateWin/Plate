import { POSTS_URL } from './config.js';
const root = document.getElementById('tags-grid');

function createTagMap(posts) {
  const map = new Map();
  posts.forEach((post) => {
    const tags = Array.isArray(post.tags) && post.tags.length > 0 ? post.tags : ['untagged'];
    tags.forEach((tag) => {
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag).push(post);
    });
  });
  return map;
}

async function initTagsPage() {
  if (!root) return;
  try {
    const response = await fetch(POSTS_URL);
    if (!response.ok) throw new Error('Failed to load posts.');
    const posts = await response.json();
    const tagMap = createTagMap(posts);
    const sortedTags = Array.from(tagMap.keys()).sort((a, b) => a.localeCompare(b));

    root.innerHTML = '';
    sortedTags.forEach((tag) => {
      const postsForTag = tagMap.get(tag) || [];
      const card = document.createElement('article');
      card.className = 'glass-card';
      card.innerHTML = `
        <div class="meta-line">${postsForTag.length} posts</div>
        <h3 style="margin:0.4rem 0 0.6rem; color: var(--primary-color);">#${tag}</h3>
        <div class="meta-line">${postsForTag.slice(0, 3).map((item) => item.title).join(' · ')}</div>
      `;

      postsForTag.forEach((post) => {
        const link = document.createElement('a');
        link.className = 'post-link';
        link.href = `/article.html?id=${post.id}`;
        link.textContent = post.title;
        card.appendChild(link);
      });

      root.appendChild(card);
    });
  } catch (error) {
    root.innerHTML = `<p class="meta-line">Error: ${error.message}</p>`;
  }
}

initTagsPage();
