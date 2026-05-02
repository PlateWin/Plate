import { fetchSiteConfig, renderMetaDescription, renderOpenGraph } from './site-content.js';

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderSiteName(name) {
  document.querySelectorAll('[data-site-name]').forEach((element) => {
    element.innerHTML = `${escapeHtml(name)}<span class="dot">.</span>`;
  });
}

function renderHero(config) {
  const label = document.getElementById('now-hero-label');
  const line1 = document.getElementById('now-hero-line-1');
  const line2 = document.getElementById('now-hero-line-2');
  const subtitle = document.getElementById('now-hero-subtitle');

  if (label) label.textContent = config.nowPage.heroLabel;
  if (line1) line1.textContent = config.nowPage.heroTitleLine1;
  if (line2) line2.textContent = config.nowPage.heroTitleLine2;
  if (subtitle) subtitle.textContent = config.nowPage.heroSubtitle;
}

function renderCards(config) {
  const container = document.getElementById('now-cards');
  if (!container) return;

  container.innerHTML = config.nowPage.items.map((item) => `
    <article class="glass-card">
      <p class="meta-line">${escapeHtml(item.meta)}</p>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(item.body)}</p>
    </article>
  `).join('');
}

async function initNowPage() {
  try {
    const config = await fetchSiteConfig();
    document.title = config.seo.nowTitle;
    renderMetaDescription(config.seo.nowDescription);
    renderOpenGraph('og:title', config.seo.nowTitle);
    renderOpenGraph('og:description', config.seo.nowDescription);
    renderSiteName(config.site.name);
    renderHero(config);
    renderCards(config);
    const footer = document.getElementById('site-footer-text');
    if (footer) footer.textContent = config.site.footerText;
  } catch (error) {
    console.error('Failed to apply now page config:', error);
  }
}

initNowPage();
