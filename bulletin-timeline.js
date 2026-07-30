/* =====================================================
   EXPERIENCE TIMELINE — BULLETIN BOARD
   Renders the experience entries as pinned sticky notes laid out in
   a snaking (boustrophedon) path across a corkboard, connected by a
   hand-drawn wavy string. No-op on any page without #bulletin-timeline.
   ===================================================== */

(function () {
  // entry data lives in site-content.txt (window.SITE_CONTENT.experience) —
  // edit that file to add/change timeline entries.
  const ENTRIES = (window.SITE_CONTENT && window.SITE_CONTENT.experience) || [];

  const NOTE_COLORS = {
    cyan: '#b5c7cd',
    lime: '#c7d1ab',
    orange: '#dfbfa8',
    purple: '#c9bbc9',
    pink: '#e0c3c4',
    yellow: '#eaddb6',
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const mount = document.getElementById('bulletin-timeline');
    if (!mount) return; // no-op on pages without the board

    injectStyles();
    mount.classList.add('bulletin-board');
    mount.setAttribute('role', 'list');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'bulletin-connector');
    mount.appendChild(svg);

    const notes = ENTRIES.map((entry, i) => buildNote(entry, i));
    notes.forEach((n) => mount.appendChild(n));

    let resizeTimer;
    function reflow() {
      layout(mount, svg, notes);
    }
    reflow();
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(reflow, 150);
    });
  }

  // deterministic pseudo-random in [0,1) — stable across re-layouts
  // so the board doesn't jump around every time it's redrawn
  function seeded(n) {
    const x = Math.sin(n * 999.99) * 10000;
    return x - Math.floor(x);
  }

  function buildNote(entry, i) {
    const note = document.createElement('div');
    note.className = 'bulletin-note';
    note.setAttribute('role', 'listitem');
    note.setAttribute('tabindex', '0');
    note.style.backgroundColor = NOTE_COLORS[entry.color] || NOTE_COLORS.yellow;
    note.dataset.pin = seeded(i * 5.1) > 0.5 ? 'pin' : 'tape';

    note.innerHTML = `
      <span class="bulletin-date">${entry.date}</span>
      <h3 class="bulletin-title">${entry.title}</h3>
      <p class="bulletin-org">${entry.org}</p>
      <div class="bulletin-details">
        <p>${entry.body}</p>
        <div class="badges" style="margin-top:0.7rem;">
          ${entry.tags.map((t) => `<span class="brutal-card badge">${t}</span>`).join('')}
        </div>
      </div>
    `;

    function toggle() {
      note.classList.toggle('expanded');
    }
    note.addEventListener('click', toggle);
    note.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    return note;
  }

  function layout(mount, svg, notes) {
    const width = mount.clientWidth || 900;
    // wider breakpoints than you'd expect — fewer, wider columns means less
    // text wrapping inside each note, which keeps note heights predictable
    // enough that the fixed row spacing below never overlaps them.
    const cols = width > 1100 ? 3 : width > 760 ? 2 : 1;
    const noteW =
      cols === 1 ? Math.min(280, width - 40) : Math.floor((width - (cols + 1) * 70) / cols);
    const gapX = 70,
      gapY = 280,
      padTop = 80;

    const anchors = [];

    notes.forEach((note, i) => {
      const row = Math.floor(i / cols);
      const posInRow = i % cols;
      const col = row % 2 === 0 ? posInRow : cols - 1 - posInRow;

      const baseX = gapX + col * (noteW + gapX);
      const baseY = padTop + row * gapY;

      // small, tame jitter — the row spacing above already does the heavy
      // lifting to keep notes from overlapping, this just keeps it from
      // looking like a rigid grid.
      const jitterX = cols === 1 ? 0 : (seeded(i * 2) - 0.5) * Math.min(16, gapX * 0.3);
      const jitterY = (seeded(i * 2 + 1) - 0.5) * 20;
      const rotation = (seeded(i * 3.7) - 0.5) * 8;

      const x = baseX + jitterX;
      const y = baseY + jitterY;

      note.style.width = noteW + 'px';
      note.style.left = x + 'px';
      note.style.top = y + 'px';
      note.style.setProperty('--rot', rotation.toFixed(1) + 'deg');

      anchors.push({ x: x + noteW / 2, y: y + 14 }); // pin sits near the top edge
    });

    const lastRow = Math.floor((notes.length - 1) / cols);
    const boardHeight = padTop + lastRow * gapY + 340;
    mount.style.height = boardHeight + 'px';

    drawConnector(svg, anchors, width, boardHeight);
  }

  function drawConnector(svg, points, width, height) {
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.innerHTML = '';

    if (points.length < 2) return;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const wobble = (seeded(i * 7.3) - 0.5) * Math.min(60, len * 0.5);
      const cx = mx + nx * wobble;
      const cy = my + ny * wobble;
      d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${p1.x} ${p1.y}`;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'bulletin-string');
    svg.appendChild(path);
  }

  function injectStyles() {
    if (document.getElementById('bulletin-timeline-styles')) return;
    const style = document.createElement('style');
    style.id = 'bulletin-timeline-styles';
    style.textContent = `
      .bulletin-board {
        position: relative;
        margin-top: 1.5rem;
        border: var(--border);
        box-shadow: var(--shadow);
        background-color: #c3a878;
        background-image:
          radial-gradient(rgba(54,52,46,0.12) 1px, transparent 1.5px),
          radial-gradient(rgba(54,52,46,0.08) 1px, transparent 1.5px);
        background-size: 26px 26px, 18px 18px;
        background-position: 0 0, 9px 13px;
        overflow: hidden;
      }

      .bulletin-connector { position: absolute; top: 0; left: 0; z-index: 0; pointer-events: none; }

      .bulletin-string {
        fill: none;
        stroke: #c8463c;
        stroke-width: 2.5;
        stroke-linecap: round;
        opacity: 0.65;
      }

      .bulletin-note {
        position: absolute;
        z-index: 1;
        border: var(--border);
        box-shadow: var(--shadow);
        padding: 0.9rem 1rem 0.7rem;
        cursor: pointer;
        transform: rotate(var(--rot, 0deg));
        transition: transform 0.2s ease, box-shadow 0.2s ease, z-index 0s;
      }

      .bulletin-note:hover,
      .bulletin-note:focus-visible {
        transform: rotate(0deg) translateY(-3px);
        box-shadow: 7px 7px 0px #36342e;
        z-index: 3;
        outline: none;
      }

      .bulletin-note.expanded {
        transform: rotate(0deg) scale(1.06);
        z-index: 5;
        box-shadow: 8px 8px 0px #36342e;
      }

      /* pushpin */
      .bulletin-note[data-pin="pin"]::before {
        content: '';
        position: absolute;
        top: -9px;
        left: 50%;
        transform: translateX(-50%);
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #f28b82, #c8463c 70%);
        box-shadow: 1px 2px 2px rgba(0,0,0,0.4);
      }

      /* washi tape */
      .bulletin-note[data-pin="tape"]::before {
        content: '';
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%) rotate(-2deg);
        width: 70px;
        height: 20px;
        background-color: rgba(255,255,255,0.65);
        border: 1px solid rgba(54,52,46,0.15);
      }

      .bulletin-date {
        display: block;
        font-size: 0.8rem;
        font-style: italic;
        color: #5a4b3d;
      }

      .bulletin-title {
        margin: 0.15rem 0;
        font-size: 1.15rem;
      }

      .bulletin-org {
        margin: 0;
        font-weight: 600;
        font-size: 0.9rem !important;
      }

      .bulletin-details {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transition: max-height 0.3s ease, opacity 0.3s ease;
      }

      .bulletin-note.expanded .bulletin-details {
        max-height: 320px;
        opacity: 1;
        margin-top: 0.5rem;
      }

      .bulletin-details p {
        font-size: 0.92rem !important;
        margin: 0;
      }

      @media (max-width: 700px) {
        .bulletin-connector { display: none; }
        .bulletin-board {
          height: auto !important;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .bulletin-note {
          position: relative !important;
          left: auto !important;
          top: auto !important;
          transform: rotate(var(--rot, 0deg)) !important;
          margin: 0.75rem 0;
          width: min(320px, 100%) !important;
        }
        .bulletin-note:hover,
        .bulletin-note.expanded {
          transform: rotate(0deg) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
