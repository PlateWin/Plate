import { API_ROOT, WALL_URL } from './config.js';

const ADMIN_SESSION_URL = `${API_ROOT}/admin/session`;

let isAdmin = false;
let cards = [];
let panX = 0, panY = 0, zoom = 1;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let currentEdges = [];
let hasAutoFit = false;
let isExpanded = false;
let isAnimating = false;
const GRAPH = {
    width: 2200,
    height: 1500,
    centerX: 1100,
    centerY: 720,
    minZoom: 0.34,
    maxZoom: 1.8
};

const canvas = document.getElementById('wall-canvas');
const world = document.getElementById('wall-world');
const links = document.getElementById('wall-links');
const statusEl = document.getElementById('wall-status');
const dialog = document.getElementById('wall-dialog');
const dialogContent = document.getElementById('wall-dialog-content');
const composeBtn = document.getElementById('wall-compose');
const resetViewBtn = document.getElementById('wall-reset-view');
const exitBtn = document.getElementById('wall-exit-canvas');
const placeholder = document.getElementById('wall-placeholder');
const hintEl = document.querySelector('.wall-compact-hint');

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('plate-admin-token');
    if (token) {
        try {
            const res = await fetch(ADMIN_SESSION_URL, { headers: { 'x-admin-token': token } });
            isAdmin = res.ok;
        } catch {}
    }

    statusEl.textContent = isAdmin ? 'Admin Graph Mode' : 'Public Message Board';
    statusEl.classList.toggle('admin', isAdmin);

    try {
        const res = await fetch(WALL_URL);
        if (!res.ok) throw new Error(`Wall API responded ${res.status}`);
        cards = await res.json();
    } catch (e) {
        console.error('Wall: failed to load cards', e);
        cards = await loadFallbackCards();
    }

    renderCards();
    initCanvasControls();
    initExpandCollapse();
    initDialog();

    // Initial: fit graph to fullscreen viewport, then clip to small window
    fitGraphToViewport();
    updateTransform();
    updateClipPath();
});

// ── Clip-path: map placeholder rect to CSS inset() ──
function updateClipPath() {
    if (isExpanded || isAnimating || !placeholder) return;
    const r = placeholder.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const top = r.top;
    const right = vw - r.right;
    const bottom = vh - r.bottom;
    const left = r.left;
    canvas.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round 20px)`;
}

// Update clip on scroll/resize when not expanded
window.addEventListener('scroll', () => { if (!isExpanded && !isAnimating) updateClipPath(); }, { passive: true });
window.addEventListener('resize', () => {
    if (!isExpanded && !isAnimating) updateClipPath();
    hasAutoFit = false;
    fitGraphToViewport();
    updateTransform();
});

async function loadFallbackCards() {
    try {
        const res = await fetch('./data/wall.json');
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data.cards || []);
    } catch (error) {
        console.error('Wall: failed to load fallback cards', error);
        return [];
    }
}

function renderCards() {
    world.querySelectorAll('.wall-card').forEach(el => el.remove());
    layoutGraph();
    renderLinks();
    cards.forEach(card => {
        ensureCardPosition(card);
        const el = createCardElement(card);
        world.appendChild(el);
    });
    if (!hasAutoFit) fitGraphToViewport();
    updateTransform();
}

function createCardElement(card) {
    const el = document.createElement('div');
    el.className = `wall-card ${card.color || 'blue'} ${card.type || 'text'}`;
    if (isAdmin) el.classList.add('draggable');
    el.style.left = `${card.x}px`;
    el.style.top = `${card.y}px`;
    el.dataset.id = card.id;

    const orb = document.createElement('div');
    orb.className = 'wall-orb';

    if (card.type === 'image') {
        const img = document.createElement('img');
        img.src = card.content;
        img.alt = '留言图谱图片节点';
        img.draggable = false;
        el.appendChild(img);
    } else {
        el.appendChild(orb);
        const contentDiv = document.createElement('div');
        contentDiv.className = 'wall-card-content';
        if (card.type === 'code') {
            contentDiv.textContent = card.content;
        } else {
            contentDiv.innerHTML = renderMarkdown(card.content);
        }
        el.appendChild(contentDiv);
    }

    const meta = document.createElement('div');
    meta.className = 'wall-card-meta';
    meta.textContent = formatMeta(card);
    el.appendChild(meta);

    if (isAdmin) {
        const delBtn = document.createElement('button');
        delBtn.className = 'wall-card-delete';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCard(card.id, el);
        });
        el.appendChild(delBtn);
        initCardDrag(el, card);
    }

    el.addEventListener('mouseenter', () => focusGraphNode(card.id));
    el.addEventListener('mouseleave', () => clearGraphFocus());

    return el;
}

function ensureCardPosition(card) {
    if (Number.isFinite(card.x) && Number.isFinite(card.y)) return;
    const index = cards.indexOf(card);
    const angle = index * 1.618;
    const radius = 120 + Math.sqrt(index + 1) * 92;
    card.x = Math.round(GRAPH.centerX + Math.cos(angle) * radius);
    card.y = Math.round(GRAPH.centerY + Math.sin(angle) * radius);
}

function layoutGraph() {
    cards.forEach(ensureCardPosition);
    const edges = buildEdges();
    const locked = new Set(cards.filter(c => Number.isFinite(c.x) && Number.isFinite(c.y) && c.createdAt).map(c => c.id));
    for (let step = 0; step < 42; step++) {
        cards.forEach((card, i) => {
            if (locked.has(card.id) && step > 10) return;
            let fx = (GRAPH.centerX - card.x) * 0.0018;
            let fy = (GRAPH.centerY - card.y) * 0.0018;
            cards.forEach((other, j) => {
                if (i === j) return;
                const dx = card.x - other.x;
                const dy = card.y - other.y;
                const distSq = Math.max(dx * dx + dy * dy, 1600);
                fx += dx * 4200 / distSq;
                fy += dy * 4200 / distSq;
            });
            edges.forEach(edge => {
                if (edge.source !== card && edge.target !== card) return;
                const other = edge.source === card ? edge.target : edge.source;
                const dx = other.x - card.x;
                const dy = other.y - card.y;
                const dist = Math.max(Math.hypot(dx, dy), 1);
                const target = edge.strength === 'semantic' ? 200 : 260;
                const pull = (dist - target) * 0.0035;
                fx += (dx / dist) * pull;
                fy += (dy / dist) * pull;
            });
            card.x = Math.round(Math.min(Math.max(card.x + fx, 60), GRAPH.width - 210));
            card.y = Math.round(Math.min(Math.max(card.y + fy, 50), GRAPH.height - 180));
        });
    }
}

// ── Links (no particles, no animateMotion) ──
function edgeRandom(idA, idB, salt) {
    const str = idA < idB ? `${idA}-${idB}-${salt}` : `${idB}-${idA}-${salt}`;
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return ((h >>> 0) % 10000) / 10000;
}

function renderLinks() {
    if (!links) return;
    links.innerHTML = '';
    currentEdges = buildEdges();

    currentEdges.forEach(edge => {
        const s = edge.source, t = edge.target;
        ensureCardPosition(s);
        ensureCardPosition(t);
        const r1 = edgeRandom(s.id, t.id, 0);
        const r2 = edgeRandom(s.id, t.id, 1);
        const r3 = edgeRandom(s.id, t.id, 2);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', getCurvePath(s.x + 75, s.y + 38, t.x + 75, t.y + 38, r1, r2));
        path.setAttribute('class', `wall-link strength-${edge.strength}`);
        path.dataset.source = s.id;
        path.dataset.target = t.id;
        path.style.strokeWidth = `${0.5 + r3 * 0.6}`;
        path.style.opacity = `${0.1 + r1 * 0.14}`;
        links.appendChild(path);
    });

    // Anchor dots
    const anchorSet = new Set();
    currentEdges.forEach(edge => {
        [edge.source, edge.target].forEach(card => {
            if (anchorSet.has(card.id)) return;
            anchorSet.add(card.id);
            ensureCardPosition(card);
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', card.x + 75);
            dot.setAttribute('cy', card.y + 38);
            dot.setAttribute('r', '2.5');
            dot.setAttribute('fill', 'rgba(0, 47, 167, 0.2)');
            dot.setAttribute('class', 'wall-anchor');
            dot.dataset.id = card.id;
            links.appendChild(dot);
        });
    });
}

function getCurvePath(x1, y1, x2, y2, r1, r2) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.max(Math.hypot(dx, dy), 1);
    const nx = -dy / dist, ny = dx / dist;
    const sign = r1 > 0.5 ? 1 : -1;
    const bend = Math.min(dist * (0.12 + r1 * 0.24), 140) * sign;
    const t1 = 0.24 + r2 * 0.18, t2 = 0.56 + r2 * 0.18;
    const asym = 0.45 + (r1 - 0.5) * 0.7;
    return `M ${x1} ${y1} C ${x1 + dx * t1 + nx * bend} ${y1 + dy * t1 + ny * bend}, ${x1 + dx * t2 + nx * bend * asym} ${y1 + dy * t2 + ny * bend * asym}, ${x2} ${y2}`;
}

function focusGraphNode(id) {
    const related = new Set([id]);
    currentEdges.forEach(e => {
        if (e.source.id === id) related.add(e.target.id);
        if (e.target.id === id) related.add(e.source.id);
    });
    world.querySelectorAll('.wall-card').forEach(el => {
        const cid = el.dataset.id;
        el.classList.toggle('is-dimmed', !related.has(cid));
        el.classList.toggle('is-related', related.has(cid) && cid !== id);
        el.classList.toggle('is-active', cid === id);
    });
    links.querySelectorAll('.wall-link').forEach(p => {
        const a = p.dataset.source === id || p.dataset.target === id;
        p.classList.toggle('is-active', a);
        p.classList.toggle('is-dimmed', !a);
    });
    links.querySelectorAll('.wall-anchor').forEach(d => {
        d.classList.toggle('is-active', related.has(d.dataset.id));
        d.classList.toggle('is-dimmed', !related.has(d.dataset.id));
    });
}

function clearGraphFocus() {
    world.querySelectorAll('.wall-card').forEach(el => el.classList.remove('is-dimmed', 'is-related', 'is-active'));
    links.querySelectorAll('.wall-link').forEach(p => p.classList.remove('is-active', 'is-dimmed'));
    links.querySelectorAll('.wall-anchor').forEach(d => d.classList.remove('is-active', 'is-dimmed'));
}

function buildEdges() {
    const edges = [];
    for (let i = 1; i < cards.length; i++) {
        edges.push({ source: cards[i - 1], target: cards[i], strength: 'time' });
    }
    for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
            if (edges.length > cards.length * 2) return edges;
            if (semanticOverlap(cards[i].content, cards[j].content) >= 2) {
                edges.push({ source: cards[i], target: cards[j], strength: 'semantic' });
            }
        }
    }
    return edges;
}

function semanticOverlap(a = '', b = '') {
    const tok = v => new Set(String(v).toLowerCase().match(/[\p{Script=Han}\w]{2,}/gu) || []);
    const l = tok(a), r = tok(b);
    let s = 0;
    l.forEach(w => { if (r.has(w)) s++; });
    return s;
}

function formatMeta(card) {
    if (!card.createdAt) return 'visitor node';
    const d = new Date(card.createdAt);
    if (Number.isNaN(d.getTime())) return 'visitor node';
    return `node · ${d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}`;
}

function renderMarkdown(content = '') {
    if (typeof marked !== 'undefined' && typeof marked.parse === 'function') return marked.parse(content);
    return escapeHtml(String(content)).replace(/\n/g, '<br>');
}

function escapeHtml(v = '') {
    return v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

// ── Card drag (admin) ──
function initCardDrag(el, card) {
    let dragging = false, startX, startY, origX, origY;
    el.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('wall-card-delete')) return;
        e.stopPropagation();
        dragging = true;
        startX = e.clientX; startY = e.clientY;
        origX = card.x; origY = card.y;
        el.style.zIndex = 100; el.style.transition = 'none';
    });
    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        card.x = origX + (e.clientX - startX) / zoom;
        card.y = origY + (e.clientY - startY) / zoom;
        el.style.left = `${card.x}px`;
        el.style.top = `${card.y}px`;
    });
    document.addEventListener('mouseup', async () => {
        if (!dragging) return;
        dragging = false;
        el.style.zIndex = ''; el.style.transition = '';
        const token = localStorage.getItem('plate-admin-token');
        try {
            await fetch(`${WALL_URL}/${card.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body: JSON.stringify({ x: Math.round(card.x), y: Math.round(card.y) })
            });
            renderLinks();
        } catch (e) {
            console.error('Wall: failed to save position', e);
        }
    });
}

async function deleteCard(id, el) {
    if (!confirm('Delete this card?')) return;
    const token = localStorage.getItem('plate-admin-token');
    try {
        const res = await fetch(`${WALL_URL}/${id}`, { method: 'DELETE', headers: { 'x-admin-token': token } });
        if (res.ok) { el.remove(); cards = cards.filter(c => c.id !== id); }
    } catch (e) { console.error('Wall: failed to delete card', e); }
}

// ── Canvas controls (only when expanded) ──
function initCanvasControls() {
    canvas.addEventListener('mousedown', (e) => {
        if (!isExpanded) return;
        if (e.target !== canvas && e.target !== world && e.target !== links) return;
        isPanning = true;
        panStart.x = e.clientX - panX;
        panStart.y = e.clientY - panY;
        canvas.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        panX = e.clientX - panStart.x;
        panY = e.clientY - panStart.y;
        updateTransform();
    });
    document.addEventListener('mouseup', () => {
        if (isPanning) { isPanning = false; canvas.style.cursor = ''; }
    });
    canvas.addEventListener('wheel', (e) => {
        if (!isExpanded || !e.ctrlKey) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const old = zoom;
        zoom = Math.min(Math.max(zoom * (e.deltaY > 0 ? 0.9 : 1.1), GRAPH.minZoom), GRAPH.maxZoom);
        panX = mx - (mx - panX) * (zoom / old);
        panY = my - (my - panY) * (zoom / old);
        updateTransform();
    }, { passive: false });
    canvas.addEventListener('dblclick', (e) => {
        if (!isExpanded) return;
        if (e.target !== canvas && e.target !== world && e.target !== links) return;
        const rect = canvas.getBoundingClientRect();
        openDialog((e.clientX - rect.left - panX) / zoom, (e.clientY - rect.top - panY) / zoom);
    });
    if (composeBtn) composeBtn.addEventListener('click', () => openDialog(getNextNodeX(), getNextNodeY()));
    if (resetViewBtn) resetViewBtn.addEventListener('click', () => { hasAutoFit = false; fitGraphToViewport(); updateTransform(); });
}

// ═══════════════════════════════════════
//  Expand / Collapse — clip-path animation (GPU only)
// ═══════════════════════════════════════
function initExpandCollapse() {
    if (!canvas || typeof gsap === 'undefined') return;

    canvas.addEventListener('click', (e) => {
        if (isExpanded || isAnimating) return;
        if (e.target.closest('button')) return;
        expandCanvas();
    });

    if (exitBtn) exitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isExpanded || isAnimating) return;
        collapseCanvas();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isExpanded && !isAnimating) collapseCanvas();
    });
}

function expandCanvas() {
    if (isExpanded || isAnimating) return;
    isAnimating = true;

    // Current clip values
    const r = placeholder.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const from = { top: r.top, right: vw - r.right, bottom: vh - r.bottom, left: r.left, round: 20 };

    document.body.classList.add('wall-expanded');
    if (hintEl) gsap.to(hintEl, { opacity: 0, duration: 0.2 });

    // Animate clip-path from window rect to full screen
    gsap.to(from, {
        top: 0, right: 0, bottom: 0, left: 0, round: 0,
        duration: 0.55,
        ease: 'power3.out',
        onUpdate: () => {
            canvas.style.clipPath = `inset(${from.top}px ${from.right}px ${from.bottom}px ${from.left}px round ${from.round}px)`;
        },
        onComplete: () => {
            canvas.style.clipPath = 'none';
            canvas.classList.add('is-expanded');
            isExpanded = true;
            isAnimating = false;

            // Fade in UI
            gsap.fromTo(
                [canvas.querySelector('.wall-canvas-hud'), resetViewBtn, exitBtn],
                { opacity: 0 },
                { opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
            );
        }
    });
}

function collapseCanvas() {
    if (!isExpanded || isAnimating) return;
    isAnimating = true;

    // Fade out UI first
    gsap.to([canvas.querySelector('.wall-canvas-hud'), resetViewBtn, exitBtn], {
        opacity: 0, duration: 0.2, ease: 'power2.in'
    });

    canvas.classList.remove('is-expanded');

    // Target clip values
    const r = placeholder.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const state = { top: 0, right: 0, bottom: 0, left: 0, round: 0 };
    const target = { top: r.top, right: vw - r.right, bottom: vh - r.bottom, left: r.left, round: 20 };

    gsap.to(state, {
        ...target,
        duration: 0.5,
        ease: 'power3.inOut',
        delay: 0.1,
        onUpdate: () => {
            canvas.style.clipPath = `inset(${state.top}px ${state.right}px ${state.bottom}px ${state.left}px round ${state.round}px)`;
        },
        onComplete: () => {
            document.body.classList.remove('wall-expanded');
            isExpanded = false;
            isAnimating = false;
            if (hintEl) gsap.to(hintEl, { opacity: 1, duration: 0.3, delay: 0.1 });
        }
    });
}

function updateTransform() {
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
}

function fitGraphToViewport() {
    if (!cards.length || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const padding = Math.min(120, Math.max(44, rect.width * 0.08));
    const bounds = cards.reduce((box, c) => ({
        minX: Math.min(box.minX, c.x),
        minY: Math.min(box.minY, c.y),
        maxX: Math.max(box.maxX, c.x + 150),
        maxY: Math.max(box.maxY, c.y + 140)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    const gw = Math.max(bounds.maxX - bounds.minX, 1);
    const gh = Math.max(bounds.maxY - bounds.minY, 1);
    const fit = Math.min(1, (rect.width - padding * 2) / gw, (rect.height - padding * 2) / gh);
    zoom = Math.max(GRAPH.minZoom, Math.min(fit, 1));
    panX = Math.round((rect.width - gw * zoom) / 2 - bounds.minX * zoom);
    panY = Math.round((rect.height - gh * zoom) / 2 - bounds.minY * zoom);
    hasAutoFit = true;
}

function getNextNodeX() { const i = cards.length; return Math.round(GRAPH.centerX + Math.cos(i * 1.618) * (170 + i * 18)); }
function getNextNodeY() { const i = cards.length; return Math.round(GRAPH.centerY + Math.sin(i * 1.618) * (170 + i * 18)); }

// ── Dialog ──
let dialogX = 0, dialogY = 0, selectedType = 'text', selectedColor = 'blue', lastDialogTrigger = null;

function initDialog() {
    document.querySelectorAll('.wall-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.wall-type-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
            selectedType = btn.dataset.type;
        });
    });
    document.querySelectorAll('.wall-color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.wall-color-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
            selectedColor = btn.dataset.color;
        });
    });
    document.getElementById('wall-dialog-cancel').addEventListener('click', closeDialog);
    document.getElementById('wall-dialog-create').addEventListener('click', createCard);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDialog(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dialog.style.display !== 'none') closeDialog(); });
}

function openDialog(x, y) {
    lastDialogTrigger = document.activeElement;
    dialogX = x; dialogY = y;
    dialogContent.value = '';
    selectedType = 'text'; selectedColor = 'blue';
    document.querySelectorAll('.wall-type-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    document.querySelector('.wall-type-btn[data-type="text"]').classList.add('active');
    document.querySelector('.wall-type-btn[data-type="text"]').setAttribute('aria-pressed', 'true');
    document.querySelectorAll('.wall-color-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    document.querySelector('.wall-color-btn[data-color="blue"]').classList.add('active');
    document.querySelector('.wall-color-btn[data-color="blue"]').setAttribute('aria-pressed', 'true');
    dialog.style.display = 'flex';
    dialogContent.focus();
}

function closeDialog() {
    dialog.style.display = 'none';
    if (lastDialogTrigger && typeof lastDialogTrigger.focus === 'function') lastDialogTrigger.focus();
}

async function createCard() {
    const content = dialogContent.value.trim();
    if (!content) return;
    const token = localStorage.getItem('plate-admin-token');
    try {
        const res = await fetch(WALL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
            body: JSON.stringify({ type: selectedType, content, x: Math.round(dialogX), y: Math.round(dialogY), color: selectedColor })
        });
        if (res.ok) { const card = await res.json(); cards.push(card); renderCards(); closeDialog(); }
    } catch (e) { console.error('Wall: failed to create card', e); }
}
