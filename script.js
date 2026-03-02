/**
 * GREETING APP — script.js
 * Handles greeting logic + 3 random background animations:
 *   1. Confetti burst (canvas particles)
 *   2. Party popper burst (emoji particles on canvas)
 *   3. Radial glow burst (CSS overlay)
 *
 * Animation rules:
 *  - Only ONE animation fires per click
 *  - Previous animation is fully cleared before a new one starts
 *  - All animations auto-clean after running
 */

/* ============================================================
   DOM References
   ============================================================ */
const nameInput      = document.getElementById('name-input');
const greetBtn       = document.getElementById('greet-btn');
const greetingOutput = document.getElementById('greeting-output');
const canvas         = document.getElementById('fx-canvas');
const glowBurst      = document.getElementById('glow-burst');
const ctx            = canvas.getContext('2d');

/* ============================================================
   State — track active animation so we can cancel it cleanly
   ============================================================ */
let animationId   = null;   // requestAnimationFrame id
let cleanupTimer  = null;   // setTimeout id for cleanup
let isAnimating   = false;  // guard flag

/* ============================================================
   GREETING LOGIC
   ============================================================ */
greetBtn.addEventListener('click', () => {
  const raw  = nameInput.value.trim();
  const name = raw.length > 0 ? raw : 'Stranger';

  // Build greeting HTML — highlight the name in accent colour
  greetingOutput.innerHTML =
    `<p class="greeting-text">Hello, <span class="name-highlight">${escapeHtml(name)}</span> 👋</p>`;

  // Fire a random animation (cancels any existing one first)
  triggerRandomAnimation();
});

/* Allow pressing Enter in the input field */
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') greetBtn.click();
});

/**
 * Sanitise user input to prevent XSS when injecting into innerHTML.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ============================================================
   ANIMATION DISPATCHER
   ============================================================ */
function triggerRandomAnimation() {
  // Cancel & clean any in-progress animation first
  cancelActiveAnimation();

  // Pick one of three animations at random
  const pick = Math.floor(Math.random() * 3);
  switch (pick) {
    case 0: runConfetti();      break;
    case 1: runPartyPopper();   break;
    case 2: runGlowBurst();     break;
  }
}

/**
 * Hard-stop whatever is currently running.
 */
function cancelActiveAnimation() {
  if (animationId)  { cancelAnimationFrame(animationId); animationId = null; }
  if (cleanupTimer) { clearTimeout(cleanupTimer);        cleanupTimer = null; }
  clearCanvas();
  resetGlowBurst();
  isAnimating = false;
}

/* ============================================================
   CANVAS UTILITIES
   ============================================================ */
function showCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.display = 'none';
}

/* ============================================================
   ANIMATION 1 — CONFETTI BURST
   Colourful rectangular confetti raining down
   ============================================================ */
function runConfetti() {
  isAnimating = true;
  showCanvas();

  const COLORS  = ['#f9c846','#ff6b6b','#48dbfb','#ff9ff3','#1dd1a1','#ffeaa7','#fd79a8','#a29bfe'];
  const PIECES  = 140;
  const GRAVITY = 0.38;
  const DRAG    = 0.985;

  // Spawn from random horizontal positions near the top
  const pieces = Array.from({ length: PIECES }, () => ({
    x:    Math.random() * canvas.width,
    y:    Math.random() * -canvas.height * 0.3,
    vx:   (Math.random() - 0.5) * 7,
    vy:   Math.random() * 4 + 1,
    w:    Math.random() * 10 + 6,
    h:    Math.random() * 5  + 3,
    rot:  Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: 1,
  }));

  const startTime = performance.now();
  const DURATION  = 3200; // ms

  function loop(now) {
    const elapsed = now - startTime;
    const progress = elapsed / DURATION;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let allGone = true;

    pieces.forEach(p => {
      p.vy  += GRAVITY;
      p.vx  *= DRAG;
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.spin;

      // Fade out in the last 30%
      if (progress > 0.70) p.alpha = Math.max(0, 1 - (progress - 0.70) / 0.30);

      if (p.y < canvas.height + 20) allGone = false;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (elapsed < DURATION && !allGone) {
      animationId = requestAnimationFrame(loop);
    } else {
      cleanupAnimation();
    }
  }

  animationId = requestAnimationFrame(loop);

  // Safety net cleanup
  cleanupTimer = setTimeout(cleanupAnimation, DURATION + 200);
}

/* ============================================================
   ANIMATION 2 — PARTY POPPER BURST
   Emoji + coloured orbs exploding from the centre
   ============================================================ */
function runPartyPopper() {
  isAnimating = true;
  showCanvas();

  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  const COLORS   = ['#f9c846','#ff6b6b','#48dbfb','#1dd1a1','#ff9ff3','#fd79a8','#a29bfe','#ffeaa7'];
  const EMOJIS   = ['🎉','🎊','⭐','💥','🌟','✨'];
  const ORBS     = 60;
  const EMOJI_N  = 18;

  // Orb particles
  const orbs = Array.from({ length: ORBS }, (_, i) => {
    const angle = (i / ORBS) * Math.PI * 2 + Math.random() * 0.4;
    const speed = Math.random() * 12 + 4;
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 2,
      r:  Math.random() * 7 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 1,
    };
  });

  // Emoji particles
  const emojis = Array.from({ length: EMOJI_N }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 9 + 3;
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 3,
      size: Math.random() * 20 + 18,
      char: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      alpha: 1,
      vy_extra: 0,
    };
  });

  const GRAVITY  = 0.28;
  const DRAG     = 0.97;
  const startTime = performance.now();
  const DURATION  = 2800;

  function loop(now) {
    const elapsed  = now - startTime;
    const progress = elapsed / DURATION;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw orbs
    orbs.forEach(p => {
      p.vy  += GRAVITY;
      p.vx  *= DRAG;
      p.x   += p.vx;
      p.y   += p.vy;
      if (progress > 0.65) p.alpha = Math.max(0, 1 - (progress - 0.65) / 0.35);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 8;
      ctx.fill();
      ctx.restore();
    });

    // Draw emojis
    emojis.forEach(p => {
      p.vy  += GRAVITY * 0.6;
      p.vx  *= DRAG;
      p.x   += p.vx;
      p.y   += p.vy;
      if (progress > 0.65) p.alpha = Math.max(0, 1 - (progress - 0.65) / 0.35);

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.font = `${p.size}px serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.char, p.x, p.y);
      ctx.restore();
    });

    if (elapsed < DURATION) {
      animationId = requestAnimationFrame(loop);
    } else {
      cleanupAnimation();
    }
  }

  animationId = requestAnimationFrame(loop);
  cleanupTimer = setTimeout(cleanupAnimation, DURATION + 200);
}

/* ============================================================
   ANIMATION 3 — RADIAL GLOW BURST
   A pulsing radial gradient that expands and fades
   ============================================================ */
function runGlowBurst() {
  isAnimating = true;

  // Pick a random accent colour for variety
  const PALETTES = [
    ['rgba(249,200,70,0.85)', 'rgba(249,200,70,0)'],
    ['rgba(72,219,251,0.80)', 'rgba(72,219,251,0)'],
    ['rgba(253,121,168,0.80)', 'rgba(253,121,168,0)'],
    ['rgba(29,209,161,0.75)', 'rgba(29,209,161,0)'],
  ];
  const [inner, outer] = PALETTES[Math.floor(Math.random() * PALETTES.length)];

  glowBurst.style.background =
    `radial-gradient(circle at center, ${inner} 0%, ${outer} 65%)`;
  glowBurst.style.animation = 'none';
  // Force reflow so removing & re-adding the class works
  void glowBurst.offsetWidth;
  glowBurst.classList.add('glow-burst-active');

  // Clean up once animation ends
  cleanupTimer = setTimeout(() => {
    resetGlowBurst();
    isAnimating = false;
  }, 1600);
}

function resetGlowBurst() {
  glowBurst.classList.remove('glow-burst-active');
  glowBurst.style.animation = 'none';
  glowBurst.style.opacity   = '0';
}

/* ============================================================
   SHARED CLEANUP
   ============================================================ */
function cleanupAnimation() {
  if (animationId)  { cancelAnimationFrame(animationId); animationId = null; }
  if (cleanupTimer) { clearTimeout(cleanupTimer);        cleanupTimer = null; }
  clearCanvas();
  isAnimating = false;
}

/* ============================================================
   RESPONSIVE CANVAS RESIZE
   ============================================================ */
window.addEventListener('resize', () => {
  if (canvas.style.display === 'block') {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});
