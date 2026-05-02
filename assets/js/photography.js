import { API_ROOT } from './config.js';
import { fetchSiteConfig, initHeroReveal, initRevealOnScroll } from './site-content.js';
let cards = [];
const filterGroup = document.getElementById('filter-group');
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.getElementById('lightbox-close');
const toolbar = document.querySelector('.toolbar');
const notes = document.querySelector('.notes');
const nav = document.getElementById('navbar');

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

async function applyPhotographyConfig() {
    try {
        const config = await fetchSiteConfig();
        renderSiteName(config.site.name);
        const note = document.getElementById('photo-note-text');
        if (note) note.textContent = config.photography.note;
    } catch (error) {
        console.error('Failed to apply photography config:', error);
    }
}

function refreshCards() {
    cards = Array.from(document.querySelectorAll('.photo-card'));
}

function applyFilter(category) {
    const visibleCards = [];
    cards.forEach((card) => {
        const match = category === 'all' || card.dataset.category === category;
        card.classList.toggle('is-hidden', !match);
        card.classList.remove('in-view');
        if (match) visibleCards.push(card);
    });

    visibleCards.forEach((card, index) => {
        setTimeout(() => card.classList.add('in-view'), index * 55);
    });
}

function openLightbox(card) {
    const img = card.querySelector('img');
    const title = card.querySelector('.photo-meta h3')?.textContent || '';
    const sub = card.querySelector('.photo-meta p')?.textContent || '';
    const shotTime = card.dataset.shotTime || '????';
    const lat = card.dataset.lat || '--';
    const lng = card.dataset.lng || '--';

    lightboxImage.src = img?.src || '';
    lightboxImage.alt = img?.alt || 'Photo';
    lightboxCaption.innerHTML = `<span class="caption-title">${title}</span><span class="caption-sub">${sub}</span><div class="caption-meta-row"><span class="caption-meta">TIME  ${shotTime}</span><span class="caption-meta">GPS  ${lat}, ${lng}</span></div>`;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function renderPhotos(photos) {
    if (!Array.isArray(photos) || photos.length === 0) return;
    gallery.innerHTML = photos.map((photo) => `
        <article class="photo-card" data-category="${photo.category}" data-shot-time="${photo.shotTime || ''}" data-lat="${photo.lat || ''}" data-lng="${photo.lng || ''}">
            <img src="${photo.src}" alt="${photo.alt || photo.title || 'Photo'}">
            <div class="photo-meta"><h3>${photo.title}</h3><p>${photo.subtitle || ''}</p></div>
        </article>
    `).join('');
}

async function loadPhotos() {
    try {
        const res = await fetch(`${API_ROOT}/photos`);
        if (!res.ok) return;
        const photos = await res.json();
        renderPhotos(photos);
    } catch (e) {}
}

function initScrollMotion() {
    requestAnimationFrame(() => toolbar?.classList.add('is-visible'));
    initRevealOnScroll(cards, {
        threshold: 0.12
    });
    initRevealOnScroll(notes ? [notes] : [], {
        threshold: 0.2
    });
}

function initTiltMotion() {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    cards.forEach((card) => {
        let frameId = null;

        card.addEventListener('mousemove', (event) => {
            if (card.classList.contains('is-hidden')) return;
            if (frameId) cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -3;
                const rotateY = ((x - centerX) / centerX) * 3;
                card.style.transform = `translateY(-6px) perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                frameId = null;
            });
        });
        card.addEventListener('mouseleave', () => {
            if (frameId) cancelAnimationFrame(frameId);
            frameId = null;
            card.style.transform = '';
        });
        card.addEventListener('click', () => openLightbox(card));
    });
}

function initNavMotion() {
    const updateNav = () => nav?.classList.toggle('scrolled', window.scrollY > 30);
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
}

filterGroup?.addEventListener('click', (event) => {
    const target = event.target.closest('.filter-btn');
    if (!target) return;
    const filter = target.dataset.filter || 'all';
    document.querySelectorAll('.filter-btn').forEach((btn) => btn.classList.toggle('active', btn === target));
    applyFilter(filter);
});
lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && lightbox?.classList.contains('open')) closeLightbox(); });

await applyPhotographyConfig();
await loadPhotos();
refreshCards();
initScrollMotion();
initTiltMotion();
initNavMotion();
initHeroReveal();
