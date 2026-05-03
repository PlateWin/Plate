import { API_ROOT, WALL_URL } from './config.js';

const ADMIN_SESSION_URL = `${API_ROOT}/admin/session`;

let isAdmin = false;
let cards = [];
let panX = 0, panY = 0, zoom = 1;
let isPanning = false;
let panStart = { x: 0, y: 0 };

const canvas = document.getElementById('wall-canvas');
const world = document.getElementById('wall-world');
const statusEl = document.getElementById('wall-status');
const dialog = document.getElementById('wall-dialog');
const dialogContent = document.getElementById('wall-dialog-content');

document.addEventListener('DOMContentLoaded', async () => {
    // Check admin status
    const token = localStorage.getItem('plate-admin-token');
    if (token) {
        try {
            const res = await fetch(ADMIN_SESSION_URL, { headers: { 'x-admin-token': token } });
            isAdmin = res.ok;
        } catch {}
    }

    statusEl.textContent = isAdmin ? 'Admin Mode' : 'Read Only';
    statusEl.classList.toggle('admin', isAdmin);

    // Load cards
    try {
        const res = await fetch(WALL_URL);
        if (res.ok) cards = await res.json();
    } catch (e) {
        console.error('Wall: failed to load cards', e);
    }

    renderCards();
    initCanvasControls();
    initDialog();

    // GSAP entrance
    gsap.from(canvas, { opacity: 0, duration: 0.8, ease: 'power2.out' });
});

function renderCards() {
    world.innerHTML = '';
    cards.forEach(card => {
        const el = createCardElement(card);
        world.appendChild(el);
    });
    updateTransform();
}

function createCardElement(card) {
    const el = document.createElement('div');
    el.className = `wall-card ${card.color || 'blue'} ${card.type || 'text'}`;
    if (isAdmin) el.classList.add('draggable');
    el.style.left = `${card.x}px`;
    el.style.top = `${card.y}px`;
    el.style.width = `${card.width || 240}px`;
    el.dataset.id = card.id;

    // Content
    if (card.type === 'image') {
        el.innerHTML = `<img src="${card.content}" alt="灵感墙图片卡片" draggable="false">`;
    } else if (card.type === 'code') {
        el.textContent = card.content;
    } else {
        // text or quote — render markdown
        const contentDiv = document.createElement('div');
        contentDiv.className = 'wall-card-content';
        contentDiv.innerHTML = marked.parse(card.content);
        el.appendChild(contentDiv);
    }

    // Delete button (admin)
    if (isAdmin) {
        const delBtn = document.createElement('button');
        delBtn.className = 'wall-card-delete';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCard(card.id, el);
        });
        el.appendChild(delBtn);

        // Drag to move
        initCardDrag(el, card);
    }

    return el;
}

function initCardDrag(el, card) {
    let dragging = false;
    let startX, startY, origX, origY;

    el.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('wall-card-delete')) return;
        e.stopPropagation();
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        origX = card.x;
        origY = card.y;
        el.style.zIndex = 100;
        el.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const dx = (e.clientX - startX) / zoom;
        const dy = (e.clientY - startY) / zoom;
        card.x = origX + dx;
        card.y = origY + dy;
        el.style.left = `${card.x}px`;
        el.style.top = `${card.y}px`;
    });

    document.addEventListener('mouseup', async () => {
        if (!dragging) return;
        dragging = false;
        el.style.zIndex = '';
        el.style.transition = '';

        // Save position
        const token = localStorage.getItem('plate-admin-token');
        try {
            await fetch(`${WALL_URL}/${card.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                body: JSON.stringify({ x: Math.round(card.x), y: Math.round(card.y) })
            });
        } catch (e) {
            console.error('Wall: failed to save position', e);
        }
    });
}

async function deleteCard(id, el) {
    if (!confirm('Delete this card?')) return;
    const token = localStorage.getItem('plate-admin-token');
    try {
        const res = await fetch(`${WALL_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'x-admin-token': token }
        });
        if (res.ok) {
            el.remove();
            cards = cards.filter(c => c.id !== id);
        }
    } catch (e) {
        console.error('Wall: failed to delete card', e);
    }
}

function initCanvasControls() {
    // Pan: drag on empty canvas
    canvas.addEventListener('mousedown', (e) => {
        if (e.target !== canvas && e.target !== world) return;
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
        if (isPanning) {
            isPanning = false;
            canvas.style.cursor = 'grab';
        }
    });

    // Zoom: Ctrl + scroll
    canvas.addEventListener('wheel', (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const oldZoom = zoom;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoom = Math.min(Math.max(zoom * delta, 0.3), 3);

        // Zoom toward cursor
        panX = mouseX - (mouseX - panX) * (zoom / oldZoom);
        panY = mouseY - (mouseY - panY) * (zoom / oldZoom);

        updateTransform();
    }, { passive: false });

    // Double-click to create (admin only)
    canvas.addEventListener('dblclick', (e) => {
        if (!isAdmin) return;
        if (e.target !== canvas && e.target !== world) return;
        const rect = canvas.getBoundingClientRect();
        const cardX = (e.clientX - rect.left - panX) / zoom;
        const cardY = (e.clientY - rect.top - panY) / zoom;
        openDialog(cardX, cardY);
    });
}

function updateTransform() {
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
}

// Dialog
let dialogX = 0, dialogY = 0;
let selectedType = 'text';
let selectedColor = 'blue';
let lastDialogTrigger = null;

function initDialog() {
    document.querySelectorAll('.wall-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.wall-type-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            selectedType = btn.dataset.type;
        });
    });

    document.querySelectorAll('.wall-color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.wall-color-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            selectedColor = btn.dataset.color;
        });
    });

    document.getElementById('wall-dialog-cancel').addEventListener('click', closeDialog);
    document.getElementById('wall-dialog-create').addEventListener('click', createCard);

    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) closeDialog();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dialog.style.display !== 'none') closeDialog();
    });
}

function openDialog(x, y) {
    lastDialogTrigger = document.activeElement;
    dialogX = x;
    dialogY = y;
    dialogContent.value = '';
    selectedType = 'text';
    selectedColor = 'blue';
    document.querySelectorAll('.wall-type-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
    });
    const defaultType = document.querySelector('.wall-type-btn[data-type="text"]');
    defaultType.classList.add('active');
    defaultType.setAttribute('aria-pressed', 'true');
    document.querySelectorAll('.wall-color-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
    });
    const defaultColor = document.querySelector('.wall-color-btn[data-color="blue"]');
    defaultColor.classList.add('active');
    defaultColor.setAttribute('aria-pressed', 'true');
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
            body: JSON.stringify({
                type: selectedType,
                content,
                x: Math.round(dialogX),
                y: Math.round(dialogY),
                color: selectedColor
            })
        });
        if (res.ok) {
            const card = await res.json();
            cards.push(card);
            world.appendChild(createCardElement(card));
            closeDialog();
        }
    } catch (e) {
        console.error('Wall: failed to create card', e);
    }
}
