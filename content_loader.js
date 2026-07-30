// =====================================================
// CONTENT LOADER — renders everything defined in site-content.txt
// =====================================================
// All the actual copy/data lives in site-content.txt (loaded before
// this file via <script src="site-content.txt">, which sets
// window.SITE_CONTENT). This file only knows how to render it —
// edit site-content.txt to change what appears on the site.

document.addEventListener('DOMContentLoaded', () => {
    injectTextSnippets();
    renderGallery();
    renderBadges();
    renderFacts();
    renderSkills();
    renderEducation();
});

function injectTextSnippets() {
    document.querySelectorAll('[data-content]').forEach((el) => {
        const value = SITE_CONTENT.text[el.dataset.content];
        if (typeof value === 'string') el.textContent = value;
    });
}

// ---------- home: tech badges ----------
function renderBadges() {
    const row = document.getElementById('home-badges');
    if (!row) return;
    row.innerHTML = '';
    SITE_CONTENT.badges.forEach((badge) => {
        const span = document.createElement('span');
        span.className = 'brutal-card badge bg-' + badge.color;
        span.textContent = badge.label;
        row.appendChild(span);
    });
}

// ---------- about: fun facts ----------
function renderFacts() {
    const list = document.getElementById('about-facts');
    if (!list) return;
    list.innerHTML = '';
    SITE_CONTENT.facts.forEach((fact) => {
        const li = document.createElement('li');
        li.textContent = fact;
        list.appendChild(li);
    });
}

// ---------- skills ----------
function renderSkills() {
    const grid = document.getElementById('skills-grid');
    if (!grid) return;
    grid.innerHTML = '';
    SITE_CONTENT.skills.forEach((skill) => {
        const card = document.createElement('div');
        card.className = 'brutal-card skill-card bg-' + skill.color;
        card.innerHTML =
            '<span class="skill-icon">' + skill.icon + '</span>' +
            '<span class="skill-name">' + skill.name + '</span>';
        grid.appendChild(card);
    });
}

// ---------- education ----------
function renderEducation() {
    const list = document.getElementById('education-list');
    if (!list) return;
    list.innerHTML = '';
    SITE_CONTENT.education.forEach((entry, i) => {
        const card = document.createElement('div');
        card.className = 'brutal-card bg-' + entry.color;
        if (i > 0) card.style.marginTop = '3rem';
        let html = '<h3>' + entry.degree + '</h3>' +
            '<p><strong>' + entry.school + '</strong></p>' +
            '<p>' + entry.dates + '</p>';
        if (entry.details) html += '<p>' + entry.details + '</p>';
        card.innerHTML = html;
        list.appendChild(card);
    });
}

// ---------- gallery ----------
const PLACEHOLDER_COLORS = ['#e0c3c4', '#b5c7cd', '#eaddb6'];

function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return; // not on this page

    grid.innerHTML = '';

    // no images listed yet — show the taped-on placeholders
    if (SITE_CONTENT.gallery.length === 0) {
        PLACEHOLDER_COLORS.forEach((color) => {
            const card = document.createElement('div');
            card.className = 'brutal-card gallery-item';
            card.style.backgroundColor = color;
            card.innerHTML = '<div class="gallery-placeholder">Image</div>';
            grid.appendChild(card);
        });
        return;
    }

    SITE_CONTENT.gallery.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'brutal-card gallery-item';

        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt || '';
        img.loading = 'lazy';

        const overlay = document.createElement('div');
        overlay.className = 'gallery-overlay';
        overlay.innerHTML = '<span>View</span>';

        card.append(img, overlay);
        card.addEventListener('click', () => openLightbox(item));
        grid.appendChild(card);
    });
}

// ---------- lightbox ----------
let lightboxEl = null;

function buildLightbox() {
    lightboxEl = document.createElement('div');
    lightboxEl.className = 'lightbox';
    lightboxEl.innerHTML =
        '<button class="btn lightbox-close" aria-label="Close">✕ Close</button>' +
        '<img alt="">';

    // clicking the dark backdrop (but not the image) closes it
    lightboxEl.addEventListener('click', (e) => {
        if (e.target !== lightboxEl.querySelector('img')) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });

    document.body.appendChild(lightboxEl);
}

function openLightbox(item) {
    if (!lightboxEl) buildLightbox();
    const img = lightboxEl.querySelector('img');
    img.src = item.src;
    img.alt = item.alt || '';
    lightboxEl.classList.add('open');
}

function closeLightbox() {
    if (lightboxEl) lightboxEl.classList.remove('open');
}
