/**
 * Page motion: split-text reveals, scrubbed statement text, velocity marquee,
 * magnetic buttons and the follow cursor. The pinned About and Experience
 * sections keep their own engines.
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Masked per-letter split. Screen readers get the plain text from the sr-only copy.
function splitChars(el) {
  const text = el.textContent.trim();
  const gradient = ['metallic-title', 'footer-metallic-title'].find((c) => el.classList.contains(c));
  // background-clip: text breaks on transformed children, so each letter carries the gradient
  if (gradient) el.classList.remove(gradient);

  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  let i = 0;
  text.split(/\s+/).forEach((word, w) => {
    if (w) visual.append(' ');
    const mask = document.createElement('span');
    mask.className = 'split-mask';
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = gradient ? `split-char ${gradient}` : 'split-char';
      c.style.setProperty('--i', i++);
      c.textContent = ch;
      mask.append(c);
    }
    visual.append(mask);
  });

  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = text;
  el.replaceChildren(label, visual);
}

function initReveals() {
  document.querySelectorAll('#hero-title .block > span').forEach(splitChars);
  document.getElementById('hero-title')?.classList.add('ready', 'is-in');

  const once = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      once.unobserve(e.target);
    });
  }, { threshold: 0.25 });

  document.querySelectorAll('#projects h2, #research h2, #skills h2, #contact h2').forEach((h) => {
    splitChars(h);
    once.observe(h);
  });
  const stage = document.getElementById('projects-content');
  if (stage) {
    stage.classList.add('clip-reveal');
    once.observe(stage);
  }
}

// Words darken one at a time as the statement crosses the viewport
function initStatement() {
  const el = document.getElementById('skills-statement');
  if (!el) return null;
  const text = el.textContent.trim();
  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = text;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  const words = text.split(/\s+/).map((w, i) => {
    const s = document.createElement('span');
    s.className = 'scrub-word';
    s.textContent = w;
    if (i) visual.append(' ');
    visual.append(s);
    return s;
  });
  el.replaceChildren(label, visual);

  return () => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.9 - r.top) / (vh * 0.55 + r.height), 0, 1);
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
  };
}

// Drifts on its own, speeds up and leans with scroll velocity, reverses on scroll up
function initMarquee() {
  const band = document.getElementById('tech-marquee');
  const track = band?.firstElementChild;
  if (!track) return;
  track.append(...[...track.children].map((n) => n.cloneNode(true)));

  let x = 0;
  let dir = -1;
  let boost = 0;
  let lastY = window.scrollY;
  let raf = 0;

  function frame() {
    const dy = window.scrollY - lastY;
    lastY = window.scrollY;
    if (dy) dir = dy > 0 ? -1 : 1;
    boost += (clamp(Math.abs(dy), 0, 60) - boost) * 0.1;

    const half = track.scrollWidth / 2;
    x = (x + dir * (0.6 + boost * 0.35)) % half;
    if (x > 0) x -= half;
    track.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${(dir * boost * 0.3).toFixed(2)}deg)`;
    raf = requestAnimationFrame(frame);
  }

  new IntersectionObserver(([e]) => {
    cancelAnimationFrame(raf);
    if (!e.isIntersecting) return;
    lastY = window.scrollY;
    raf = requestAnimationFrame(frame);
  }).observe(band);
}

function initMagnetic() {
  document.querySelectorAll('.circle-btn, #contact a, #contact button, #sem-media-content a, #experience button[onclick]').forEach((el) => {
    el.classList.add('magnetic');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${(dx * 0.28).toFixed(1)}px, ${(dy * 0.28).toFixed(1)}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// Sits on top of the native cursor, which stays visible
function initCursor() {
  const dot = document.createElement('div');
  dot.className = 'follow-cursor';
  dot.setAttribute('aria-hidden', 'true');
  document.body.append(dot);

  let x = 0;
  let y = 0;
  let cx = 0;
  let cy = 0;
  let moving = false;

  function frame() {
    cx += (x - cx) * 0.2;
    cy += (y - cy) * 0.2;
    dot.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) translate(-50%, -50%)`;
    if (Math.abs(x - cx) + Math.abs(y - cy) > 0.2) requestAnimationFrame(frame);
    else moving = false;
  }

  window.addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    dot.classList.add('is-on');
    const t = e.target instanceof Element ? e.target : null;
    const drag = t?.closest('#flex-carousel-container, #works-wheel-container');
    const hit = t?.closest('a, button, select, [onclick]');
    dot.classList.toggle('is-drag', !!drag && !hit);
    dot.classList.toggle('is-hit', !!hit);
    dot.textContent = drag && !hit ? 'Drag' : '';
    if (!moving) {
      moving = true;
      requestAnimationFrame(frame);
    }
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => dot.classList.remove('is-on'));
}

function init() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  initReveals();
  initMarquee();

  const statement = initStatement();
  if (statement) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; statement(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    statement();
  }

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    initMagnetic();
    initCursor();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
