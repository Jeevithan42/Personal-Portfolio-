
// ---------- PHYSICS TUNING ----------
// These five numbers control the whole feel of the game.
// Tweak them and refresh to experiment:
const GRAVITY = 0.45;   // downward pull per frame (higher = heavier ball)
const BOUNCE = 0.6;    // energy kept after a bounce (0 = dead, 1 = superball)
const AIR_DRAG = 0.995;  // horizontal air resistance per frame
const POWER = 0.16;   // how hard the slingshot converts drag distance to speed
const MAX_SPEED = 24;     // speed cap so shots stay controllable

// ---------- HOOP GEOMETRY ----------
// These match the sizes in styles.css (.hoop-container and children).
// If you resize the hoop in CSS, update these to match.
const HOOP_W = 110;  // total hoop container width
const RIM_X = 28;   // rim's left tip, relative to hoop container
const RIM_Y = 85;   // rim height, relative to hoop container
const RIM_W = 74;   // rim width (ball is 44px, so there's room to swish)
const BOARD_X = 102;  // backboard's left edge, relative to hoop container
const BOARD_H = 90;   // backboard height

const BALL_R = 22;    // ball radius (ball div is 44px)


// GAME

const area = document.getElementById('game-area');
if (area) initGame();

function initGame() {
    const ballEl = document.getElementById('ball');
    const hoopEl = document.getElementById('hoop');
    const scoreEl = document.getElementById('score');
    const bestEl = document.getElementById('best');
    const swishEl = document.getElementById('swish');
    const resetBtn = document.getElementById('reset-ball');

    let W = area.clientWidth;
    let H = area.clientHeight;
    // mobile CSS scales the hoop to 0.8 — physics must match the visuals
    let S = window.matchMedia('(max-width: 768px)').matches ? 0.8 : 1;

    const ball = { x: 80, y: H - BALL_R - 6, vx: 0, vy: 0 };
    const hoop = { x: 0, y: 0 };

    let score = 0;
    let best = Number(localStorage.getItem('jm-hoops-best') || 0);
    let scoredThisFlight = false;
    let dragging = false;
    let pointer = { x: 0, y: 0 };
    let prevY = ball.y;

    bestEl.textContent = best;

    const SWISH_WORDS = ['SWISH!', 'BUCKETS!', 'COUNT IT!', '+1!'];

    // --- aim preview dots ---
    const dots = [];
    for (let i = 0; i < 10; i++) {
        const d = document.createElement('div');
        d.className = 'aim-dot';
        area.appendChild(d);
        dots.push(d);
    }

    function hideDots() {
        dots.forEach(d => (d.style.display = 'none'));
    }

    // rim tips and rim line in game-area coordinates (honors mobile scale)
    function rim() {
        return {
            lx: hoop.x + RIM_X * S,
            rx: hoop.x + (RIM_X + RIM_W) * S,
            y: hoop.y + RIM_Y * S,
        };
    }

    function resetBall() {
        ball.x = W / 2;            // start centered so it's easy to spot
        ball.y = H - BALL_R - 6;
        ball.vx = 0;
        ball.vy = 0;
        scoredThisFlight = false;
    }

    function moveHoop() {
        const minX = W * 0.05;                          // roam almost the full width
        const maxX = W - (HOOP_W + 20) * S;
        const minY = 50;
        const maxY = Math.max(minY + 10, H * 0.7);      // top down to 70% of the screen
        hoop.x = minX + Math.random() * (maxX - minX);
        hoop.y = minY + Math.random() * (maxY - minY);
        hoopEl.style.left = hoop.x + 'px';
        hoopEl.style.top = hoop.y + 'px';
    }

    // --- collisions ---
    function collideWalls() {
        if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx) * BOUNCE; }
        if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx) * BOUNCE; }
        if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy) * BOUNCE; }
        if (ball.y > H - BALL_R) {
            ball.y = H - BALL_R;
            ball.vy = -Math.abs(ball.vy) * BOUNCE;
            ball.vx *= 0.98;                          // floor friction
            if (Math.abs(ball.vy) < 1.2) ball.vy = 0; // settle instead of micro-bouncing
            scoredThisFlight = false;                 // touching the floor ends the flight
        }
    }

    function collideBoard() {
        const bx = hoop.x + BOARD_X * S;
        const topY = hoop.y;
        const botY = hoop.y + BOARD_H * S;
        if (ball.y > topY - BALL_R && ball.y < botY + BALL_R) {
            if (ball.x + BALL_R > bx && ball.x < bx && ball.vx > 0) {
                ball.x = bx - BALL_R;
                ball.vx = -Math.abs(ball.vx) * BOUNCE;
            }
        }
    }

    // ball lands on / bounces off any bordered .brutal-card on the page,
    // treating each one as a solid rectangular surface
    const SURFACE_SELECTOR = '.brutal-card';

    function collideSurfaces() {
        const origin = area.getBoundingClientRect();
        document.querySelectorAll(SURFACE_SELECTOR).forEach((el) => {
            const b = el.getBoundingClientRect();
            const left = b.left - origin.left, right  = b.right  - origin.left;
            const top  = b.top  - origin.top,  bottom = b.bottom - origin.top;

            // closest point on the card box to the ball's centre
            const cx = Math.max(left, Math.min(ball.x, right));
            const cy = Math.max(top,  Math.min(ball.y, bottom));
            let dx = ball.x - cx, dy = ball.y - cy;
            let dist = Math.hypot(dx, dy);
            let nx, ny;

            if (dist > 0.0001) {
                if (dist >= BALL_R) return;            // not touching this card
                nx = dx / dist; ny = dy / dist;
            } else {
                // ball centre is inside the box — escape through the nearest edge
                const dl = ball.x - left, dr = right - ball.x;
                const dt = ball.y - top,  db = bottom - ball.y;
                const m = Math.min(dl, dr, dt, db);
                nx = m === dl ? -1 : m === dr ? 1 : 0;
                ny = m === dt ? -1 : m === db ? 1 : 0;
                dist = 0;
            }

            ball.x += nx * (BALL_R - dist);            // push the ball out to the edge
            ball.y += ny * (BALL_R - dist);

            const vn = ball.vx * nx + ball.vy * ny;    // speed heading into the surface
            if (vn < 0) {
                ball.vx -= (1 + BOUNCE) * vn * nx;     // reflect it back out (bounce)
                ball.vy -= (1 + BOUNCE) * vn * ny;
            }

            if (ny < -0.7) {                           // sitting on a roughly-flat top
                ball.vx *= 0.98;                       // rolling friction
                if (Math.abs(ball.vy) < 1.2) ball.vy = 0; // settle so it rests, not jitters
                scoredThisFlight = false;
            }
        });
    }

    // ball bounces off a rim tip like a tiny peg
    function bounceOffPoint(px, py) {
        const dx = ball.x - px;
        const dy = ball.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist < BALL_R + 3 && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            ball.x += nx * (BALL_R + 3 - dist);
            ball.y += ny * (BALL_R + 3 - dist);
            const dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) {
                ball.vx -= (1 + BOUNCE) * dot * nx;
                ball.vy -= (1 + BOUNCE) * dot * ny;
            }
        }
    }

    function checkScore() {
        const r = rim();
        const crossedRim = prevY < r.y && ball.y >= r.y && ball.vy > 0;
        const insideRim = ball.x > r.lx + 6 && ball.x < r.rx - 6;
        if (!scoredThisFlight && crossedRim && insideRim) {
            scoredThisFlight = true;
            score++;
            scoreEl.textContent = score;
            if (score > best) {
                best = score;
                bestEl.textContent = best;
                localStorage.setItem('jm-hoops-best', best);
            }
            celebrate();
            moveHoop(); // the hoop relocates after every made basket
        }
    }

    function celebrate() {
        swishEl.textContent = SWISH_WORDS[Math.floor(Math.random() * SWISH_WORDS.length)];
        swishEl.style.left = Math.max(10, hoop.x - 30) + 'px';
        swishEl.style.top = Math.max(10, hoop.y + 30) + 'px';
        swishEl.classList.remove('show');
        void swishEl.offsetWidth; // restart the CSS animation
        swishEl.classList.add('show');
    }
    swishEl.addEventListener('animationend', () => swishEl.classList.remove('show'));

    // --- input: slingshot drag ---
    function toLocal(e) {
        const r = area.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function launchVelocity() {
        let vx = (ball.x - pointer.x) * POWER;
        let vy = (ball.y - pointer.y) * POWER;
        const sp = Math.hypot(vx, vy);
        if (sp > MAX_SPEED) {
            vx *= MAX_SPEED / sp;
            vy *= MAX_SPEED / sp;
        }
        return { vx, vy, sp: Math.min(sp, MAX_SPEED) };
    }

    function showAim() {
        const v = launchVelocity();
        let px = ball.x, py = ball.y, vx = v.vx, vy = v.vy;
        for (const d of dots) {
            for (let k = 0; k < 4; k++) { // 4 physics steps between dots
                vy += GRAVITY;
                vx *= AIR_DRAG;
                px += vx;
                py += vy;
            }
            d.style.left = px + 'px';
            d.style.top = py + 'px';
            d.style.display = 'block';
        }
    }

    ballEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        dragging = true;
        pointer = toLocal(e);
        ball.vx = 0;
        ball.vy = 0;
    });

    window.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        pointer = toLocal(e);
        showAim();
    });

    window.addEventListener('pointerup', () => {
        if (!dragging) return;
        dragging = false;
        hideDots();
        const v = launchVelocity();
        if (v.sp < 2) return; // too gentle — treat as a cancelled shot
        ball.vx = v.vx;
        ball.vy = v.vy;
        scoredThisFlight = false;
    });

    resetBtn.addEventListener('click', resetBall);

    window.addEventListener('resize', () => {
        W = area.clientWidth;
        H = area.clientHeight;
        S = window.matchMedia('(max-width: 768px)').matches ? 0.8 : 1;
        hoop.x = Math.min(hoop.x, Math.max(0, W - (HOOP_W + 20) * S));
        hoop.y = Math.min(hoop.y, Math.max(50, H - 220));
        hoopEl.style.left = hoop.x + 'px';
        hoopEl.style.top = hoop.y + 'px';
        ball.x = Math.min(ball.x, W - BALL_R);
        ball.y = Math.min(ball.y, H - BALL_R);
    });

    // --- main loop ---
    function step() {
        if (!dragging) {
            prevY = ball.y;
            ball.vy += GRAVITY;
            ball.vx *= AIR_DRAG;
            ball.x += ball.vx;
            ball.y += ball.vy;
            collideWalls();
            collideBoard();
            collideSurfaces();
            const r = rim();
            bounceOffPoint(r.lx, r.y); // left rim tip
            bounceOffPoint(r.rx, r.y); // right rim tip
            checkScore();
        }
        ballEl.style.left = (ball.x - BALL_R) + 'px';
        ballEl.style.top = (ball.y - BALL_R) + 'px';
        requestAnimationFrame(step);
    }

    resetBall();
    moveHoop();
    step();
}

// =====================================================
// STICKERS — click for a blurb, click away to close
// =====================================================
document.querySelectorAll('.sticker-wrap').forEach((wrap) => {
    const btn = wrap.querySelector('.sticker');
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.sticker-wrap.open').forEach((w) => {
            if (w !== wrap) w.classList.remove('open');
        });
        wrap.classList.toggle('open');
    });
});

document.addEventListener('click', (e) => {
    document.querySelectorAll('.sticker-wrap.open').forEach((w) => {
        if (!w.contains(e.target)) w.classList.remove('open');
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.sticker-wrap.open').forEach((w) => w.classList.remove('open'));
    }
});
