import { fetchSiteConfig, initHeroReveal, initRevealOnScroll, renderMetaDescription, renderOpenGraph } from './site-content.js';

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
  const label = document.getElementById('about-hero-label');
  const line1 = document.getElementById('about-hero-line-1');
  const line2 = document.getElementById('about-hero-line-2');
  const subtitle = document.getElementById('about-hero-subtitle');

  if (label) label.textContent = config.aboutPage.heroLabel;
  if (line1) line1.textContent = config.aboutPage.heroTitleLine1;
  if (line2) line2.textContent = config.aboutPage.heroTitleLine2;
  if (subtitle) subtitle.textContent = config.aboutPage.heroSubtitle;
}

function renderCards(config) {
  const container = document.getElementById('about-cards');
  if (!container) return;

  container.innerHTML = config.aboutPage.cards.map((card) => `
    <article class="glass-card reveal-element">
      <p class="meta-line">${escapeHtml(card.meta)}</p>
      <h2>${escapeHtml(card.title)}</h2>
      <p>${escapeHtml(card.body)}</p>
    </article>
  `).join('');
}

async function initAboutPage() {
  try {
    const config = await fetchSiteConfig();
    document.title = config.seo.aboutTitle;
    renderMetaDescription(config.seo.aboutDescription);
    renderOpenGraph('og:title', config.seo.aboutTitle);
    renderOpenGraph('og:description', config.seo.aboutDescription);
    renderSiteName(config.site.name);
    renderHero(config);
    initHeroReveal();
    renderCards(config);
    initRevealOnScroll(document.querySelectorAll('#about-cards .glass-card, #about-hero-label'), {
      threshold: 0.16
    });
    const footer = document.getElementById('site-footer-text');
    if (footer) footer.textContent = config.site.footerText;
  } catch (error) {
    console.error('Failed to apply about page config:', error);
  }
}

initAboutPage();
