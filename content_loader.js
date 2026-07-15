// =====================================================
// CONTENT LOADER — dynamic content for the portfolio
// =====================================================
// Everything the site renders dynamically lives in the
// SITE_CONTENT object below. Edit this ONE object to change
// content — no HTML surgery required.
//
// Why a JS object instead of a JSON file? A fetch() for JSON
// is blocked when you open the site directly from disk
// (file:// + CORS). Plain <img> tags and JS objects work fine.

const SITE_CONTENT = {

    // ---------- GALLERY ----------
    // 1. Drop image files into assets/images/gallery/
    // 2. List them here. Each entry becomes a card in the gallery,
    //    and clicking a card opens the image in a lightbox.
    // Example:
    //   { src: 'assets/images/gallery/hoops.jpg', alt: 'Playing basketball' },
    gallery: [
        // add your images here
    ],

    // ---------- TEXT SNIPPETS ----------
    // Any element with data-content="someKey" gets its text
    // replaced by the matching value here. Lets you edit copy
    // in one place. Example:
    //   HTML: <p data-content="heroTagline"></p>
    //   here: heroTagline: "I build things for the web.",
    text: {
        // heroTagline: "I'm a developer who loves building things that live on the internet.",
    },

};

// =====================================================
// RENDERING (you shouldn't need to edit below this line)
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    injectTextSnippets();
    renderGallery();
});

function injectTextSnippets() {
    document.querySelectorAll('[data-content]').forEach((el) => {
        const value = SITE_CONTENT.text[el.dataset.content];
        if (typeof value === 'string') el.textContent = value;
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