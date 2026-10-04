// Mobile navigation
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');

function closeMenu(restoreFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '開啟導覽選單');
  mobileNav.hidden = true;
  document.body.classList.remove('menu-open');
  if (restoreFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '關閉導覽選單' : '開啟導覽選單');
  mobileNav.hidden = !open;
  document.body.classList.toggle('menu-open', open);
});
mobileNav
  .querySelectorAll('a')
  .forEach((link) => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true);
});
matchMedia('(min-width: 761px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});

// Contact and footer
let copyTimeout;
document.querySelector('#copy-email').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  clearTimeout(copyTimeout);
  try {
    await navigator.clipboard.writeText('louiskoxiang@gmail.com');
    status.textContent = 'Email 已複製！';
  } catch {
    status.textContent = '請選取旁邊的 Email 複製';
  }
  copyTimeout = setTimeout(() => {
    status.textContent = '';
  }, 3500);
});
document.querySelector('#copyright-year').textContent = new Date().getFullYear();

// Interwoven parametric curves projected from 3D. No external rendering library.
// The canvas is decorative; content and standard links work without JavaScript.
const canvas = document.querySelector('#sculpture');
const context = canvas.getContext('2d');
const stage = document.querySelector('.hero-art');
const motionButton = document.querySelector('.motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
let width = 0;
let height = 0;
let angle = 0.5;
let frameId = null;
let previousTime = 0;
let pointerX = 0;
let pointerY = 0;
let rotationX = 0;
let rotationY = 0;
let inView = true;

function updateMotionButton() {
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? '播放線框動畫' : '暫停線框動畫');
  motionButton.querySelector('.motion-icon').textContent = paused ? '▶' : 'Ⅱ';
  motionButton.querySelector('.motion-label').textContent = paused ? 'PLAY' : 'PAUSE';
}

function point(u, v) {
  const radius = 1.48 + 0.14 * Math.cos(3 * u);
  const tube = 0.55 + 0.08 * Math.sin(3 * u);
  let x = (radius + tube * Math.cos(v)) * Math.cos(u);
  let y = (radius + tube * Math.cos(v)) * Math.sin(u);
  let z = tube * Math.sin(v) + 0.22 * Math.sin(3 * u);
  const twist = angle * 0.32 + 0.4 + rotationY;
  const xx = x * Math.cos(twist) - z * Math.sin(twist);
  const zz = x * Math.sin(twist) + z * Math.cos(twist);
  x = xx;
  z = zz;
  const tilt = 0.92 + rotationX;
  const yy = y * Math.cos(tilt) - z * Math.sin(tilt);
  z = y * Math.sin(tilt) + z * Math.cos(tilt);
  y = yy;
  const spin = -0.4;
  const px = x * Math.cos(spin) - y * Math.sin(spin);
  const py = x * Math.sin(spin) + y * Math.cos(spin);
  const scale = Math.min(width, height) * 0.205;
  const perspective = 5 / (5 + z * 0.22);
  return [width * 0.51 + px * scale * perspective, height * 0.48 + py * scale * perspective, z];
}

function render() {
  if (!context || !width || !height) return;
  context.clearRect(0, 0, width, height);
  const rings = [];
  for (let i = 0; i < 74; i++) {
    const u = (i / 74) * Math.PI * 2;
    const points = [];
    let depth = 0;
    for (let j = 0; j <= 72; j++) {
      const p = point(u, (j / 72) * Math.PI * 2);
      points.push(p);
      depth += p[2];
    }
    rings.push({ points, depth: depth / points.length });
  }
  rings.sort((a, b) => b.depth - a.depth);
  rings.forEach(({ points, depth }) => {
    context.beginPath();
    points.forEach((p, i) => (i ? context.lineTo(p[0], p[1]) : context.moveTo(p[0], p[1])));
    context.strokeStyle = `rgba(29, 46, 19, ${Math.max(0.16, Math.min(0.8, 0.5 - depth * 0.2))})`;
    context.lineWidth = 0.85;
    context.stroke();
  });
}

function animate(time) {
  frameId = null;
  if (paused || !inView || document.hidden || !context) return;
  if (previousTime) angle += Math.min(time - previousTime, 50) * 0.00016;
  previousTime = time;
  rotationX += (pointerY * 0.18 - rotationX) * 0.035;
  rotationY += (pointerX * 0.25 - rotationY) * 0.035;
  render();
  frameId = requestAnimationFrame(animate);
}

function syncAnimation() {
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  previousTime = 0;
  if (!paused && inView && !document.hidden && context) frameId = requestAnimationFrame(animate);
  else render();
}

new ResizeObserver(() => {
  width = stage.clientWidth;
  height = stage.clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  render();
}).observe(stage);

new IntersectionObserver(
  (entries) => {
    inView = entries[0].isIntersecting;
    syncAnimation();
  },
  { threshold: 0 },
).observe(stage);

stage.addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
  const rect = stage.getBoundingClientRect();
  pointerX = (event.clientX - rect.left) / rect.width - 0.5;
  pointerY = (event.clientY - rect.top) / rect.height - 0.5;
});
stage.addEventListener('pointerleave', () => {
  pointerX = 0;
  pointerY = 0;
});
motionButton.addEventListener('click', () => {
  paused = !paused;
  updateMotionButton();
  syncAnimation();
});
reducedMotion.addEventListener('change', (event) => {
  paused = event.matches;
  updateMotionButton();
  syncAnimation();
});
document.addEventListener('visibilitychange', syncAnimation);
updateMotionButton();
syncAnimation();
