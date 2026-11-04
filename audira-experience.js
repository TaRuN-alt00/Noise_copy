/**
 * AUDIRA — MASTERPIECE 02 (MODERN HARMONY ACOUSTICS)
 * 196-Frame Planar-Magnetic Acoustic Experience
 * Responsive Canvas Scrub + GSAP Pinned Stage + Native Clickable Buy Now Actions
 */

(function () {
  'use strict';

  const FRAME_COUNT = 196;
  const framePath = (i) => `hp-frames/frame_${String(i + 1).padStart(4, "0")}.webp`;

  // Cover mask from frame 138-150 to smoothly transition video bottom into HTML top picks
  const COVER_FROM_FRAME = 138;
  const COVER_FULL_AT = 150;

  const canvas = document.getElementById("stage");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const track = document.getElementById("track");
  const stage = document.querySelector(".stage");
  if (!track || !stage) return;

  const loader = document.getElementById("loader");
  const loaderNum = document.getElementById("loaderNum");
  const loaderBar = document.getElementById("loaderBar");
  const hint = document.getElementById("hint");

  const images = new Array(FRAME_COUNT);
  const state = { frame: 0 };
  let lastDrawn = -1;
  let dpr = 1;
  let curRenderBox = { x: 0, y: 0, w: 0, h: 0 };

  document.body.classList.add("is-loading");

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  /* ---------- Canvas Sizing & Responsive Rendering ---------- */
  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = stage.getBoundingClientRect();
    canvas.width = Math.round((rect.width || window.innerWidth) * dpr);
    canvas.height = Math.round((rect.height || window.innerHeight) * dpr);
    lastDrawn = -1;
    draw();
  }

  function nearestLoaded(index) {
    for (let i = index; i >= 0; i--) {
      const img = images[i];
      if (img && img.complete && img.naturalWidth) return img;
    }
    for (let i = index + 1; i < FRAME_COUNT; i++) {
      const img = images[i];
      if (img && img.complete && img.naturalWidth) return img;
    }
    return null;
  }

  function draw() {
    const index = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(state.frame)));
    if (index === lastDrawn) return;
    const img = nearestLoaded(index);
    if (!img) return;

    const cw = canvas.width, ch = canvas.height;
    const ia = img.naturalWidth / img.naturalHeight; // 1280 / 720 = 1.7777
    const ca = cw / ch;

    // Responsive scaling formula:
    // On portrait mobile (ca < 1.0), scale up so the headphone and text remain large and prominent
    let scale;
    if (ca < 1.0) {
      const minWScale = cw / img.naturalWidth;
      const targetHScale = (ch * 0.65) / img.naturalHeight;
      scale = Math.max(minWScale, targetHScale);
    } else {
      // Landscape / desktop view
      scale = Math.abs(ca - ia) / ia < 0.16
        ? Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
        : Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    }

    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    curRenderBox = { x, y, w, h };

    const bottom = (typeof BOTTOM_COLORS !== 'undefined' && BOTTOM_COLORS[index]) || "#e4dece";
    const mid = (typeof MID_COLORS !== 'undefined' && MID_COLORS[index]) || "#ebe7da";

    // Letterbox background gradient blending with frame edges
    if (w < cw - 1 || h < ch - 1) {
      const bg = ctx.createLinearGradient(0, 0, 0, ch);
      bg.addColorStop(0, mid);
      bg.addColorStop(1, bottom);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cw, ch);
    } else {
      ctx.clearRect(0, 0, cw, ch);
    }

    // Paint clean video frame (100% natural, no clashing painted rectangles)
    ctx.drawImage(img, x, y, w, h);

    // Smooth gradient mask to cover bottom heading in raw video before HTML handover
    const m = clamp((index - COVER_FROM_FRAME) / (COVER_FULL_AT - COVER_FROM_FRAME));
    if (m > 0) {
      const [r, g, b] = rgb(bottom);
      const top = y + h * 0.86;
      const grad = ctx.createLinearGradient(0, top, 0, y + h * 0.91);
      grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
      grad.addColorStop(1, `rgb(${r},${g},${b})`);
      ctx.globalAlpha = m;
      ctx.fillStyle = grad;
      ctx.fillRect(x, top, w, ch - top);
      ctx.globalAlpha = 1;
    }

    lastDrawn = index;
  }

  /* ---------- Progressive Preload ---------- */
  function preload() {
    return new Promise((resolve) => {
      let done = 0;
      const initialBatch = [0, 1, 2, 5, 10, 20, 40, 60, 70, 80, 87, 100, 120, 140, 160, 180, 195];

      const tick = () => {
        done++;
        const pct = Math.round((done / FRAME_COUNT) * 100);
        if (loaderNum) loaderNum.textContent = pct;
        if (loaderBar) loaderBar.style.width = pct + "%";

        if (done >= 15 && loader && !loader.classList.contains("is-done")) {
          document.body.classList.remove("is-loading");
          loader.classList.add("is-done");
          init();
        }

        if (done === FRAME_COUNT) resolve();
      };

      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.onload = img.onerror = tick;
        img.src = framePath(i);
        images[i] = img;
      }
    });
  }

  /* ---------- GSAP ScrollTrigger PINNED Architecture ---------- */
  let isInitialized = false;

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn("GSAP / ScrollTrigger missing");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (typeof Lenis !== 'undefined') {
      const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // PINNED ScrollTrigger: Holds stage locked for 4800px of smooth scrubbing
    ScrollTrigger.create({
      trigger: track,
      pin: stage,
      start: "top top",
      end: "+=4800",
      scrub: 0.45,
      anticipatePin: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        state.frame = progress * (FRAME_COUNT - 1);
        draw();
        if (hint) hint.style.opacity = progress > 0.015 ? 0 : 1;
      }
    });

    // Gentle canvas entrance fade
    gsap.from(canvas, { opacity: 0, duration: 1.2, ease: "power2.out" });

    // Top picks reveal animations
    gsap.from(".picks__title", {
      y: 40, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: ".picks", start: "top 75%", once: true },
    });
    gsap.from(".pick", {
      y: 60, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.15,
      scrollTrigger: { trigger: ".picks__grid", start: "top 80%", once: true },
    });

    // Idle floating headphones
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".pick__img img").forEach((el, i) => {
        gsap.to(el, {
          y: -10, duration: 2.4 + i * 0.35, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.3,
        });
      });
    }

    // Direct clickable hit-testing on the video's native Buy Now buttons
    setupCanvasClickActions();

    draw();
  }

  /* ---------- Interactive Click & Cursor Handling ---------- */
  function openBuyingDrawer() {
    const cartOverlay = document.getElementById('cart-drawer-overlay');
    if (cartOverlay) cartOverlay.classList.add('active');
    if (typeof confetti === 'function') {
      confetti({ particleCount: 85, spread: 70, origin: { y: 0.6 } });
    }
  }

  function setupCanvasClickActions() {
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * dpr;
      const clickY = (e.clientY - rect.top) * dpr;
      const { x, y, w, h } = curRenderBox;

      // 1. Top-Right Orange "Buy Now" Button in video
      const trX = x + (995 / 1280) * w;
      const trY = y + (32 / 720) * h;
      const trW = (155 / 1280) * w;
      const trH = (60 / 720) * h;
      if (clickX >= trX && clickX <= trX + trW && clickY >= trY && clickY <= trY + trH) {
        openBuyingDrawer();
        return;
      }

      // 2. Left "Buy Now" Button under TRUE CLARITY (frames 58 to 92)
      if (state.frame >= 58 && state.frame <= 92) {
        const lX = x + (140 / 1280) * w;
        const lY = y + (520 / 720) * h;
        const lW = (150 / 1280) * w;
        const lH = (60 / 720) * h;
        if (clickX >= lX && clickX <= lX + lW && clickY >= lY && clickY <= lY + lH) {
          openBuyingDrawer();
          return;
        }
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * dpr;
      const my = (e.clientY - rect.top) * dpr;
      const { x, y, w, h } = curRenderBox;

      const trX = x + (995 / 1280) * w;
      const trY = y + (32 / 720) * h;
      const trW = (155 / 1280) * w;
      const trH = (60 / 720) * h;
      const isTr = (mx >= trX && mx <= trX + trW && my >= trY && my <= trY + trH);

      let isL = false;
      if (state.frame >= 58 && state.frame <= 92) {
        const lX = x + (140 / 1280) * w;
        const lY = y + (520 / 720) * h;
        const lW = (150 / 1280) * w;
        const lH = (60 / 720) * h;
        isL = (mx >= lX && mx <= lX + lW && my >= lY && my <= lY + lH);
      }

      canvas.style.cursor = (isTr || isL) ? 'pointer' : 'default';
    });
  }

  preload();

})();
