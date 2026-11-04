/**
 * NOISE MASTER SERIES - 240-FRAME SMARTWATCH TEARDOWN EXPERIENCE
 * GSAP ScrollTrigger + Lenis Smooth Scroll + Canvas Frame Scrub
 */

(function () {
  'use strict';

  const FRAME_COUNT = 240;
  const framePath = (i) => `frames/frame_${String(i + 1).padStart(4, "0")}.webp`;

  const canvas = document.getElementById("stage");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const track = document.getElementById("track");
  const stage = document.querySelector(".stage");
  if (!track || !stage) return;

  const loader = document.getElementById("loader");
  const loaderNum = document.getElementById("loaderNum");
  const loaderBar = document.getElementById("loaderBar");
  const railFill = document.getElementById("railFill");
  const hint = document.getElementById("hint");
  const chapters = [...document.querySelectorAll(".chapter")];

  const images = new Array(FRAME_COUNT);
  const state = { frame: 0 };
  let lastDrawn = -1;
  let dpr = 1;
  let isInitialized = false;

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
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);

    lastDrawn = index;
  }

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  chapters.forEach((el) => {
    el.start = parseFloat(el.dataset.start);
    el.end = parseFloat(el.dataset.end);
    el.hold = el.dataset.hold === "1";
    if (el.classList.contains("chapter--hero") || el.classList.contains("chapter--final")) {
      gsap.set(el, { xPercent: -50 });
    }
  });

  function updateChapters(p) {
    chapters.forEach((el) => {
      const len = el.end - el.start;
      const fade = len * 0.28;

      let a = el.start === 0 ? 1 : clamp((p - el.start) / fade);
      let b = el.end >= 1 ? 1 : clamp((el.end - p) / fade);
      if (p < el.start || p > el.end + 0.0001) {
        if (!(el.end >= 1 && p >= el.start)) { a = 0; b = 0; }
      }

      const opacity = Math.min(a, b);
      const y = (1 - a) * 34 - (1 - b) * 34;
      gsap.set(el, { opacity, y });
      el.style.pointerEvents = opacity > 0.6 && (el.classList.contains("chapter--final") || el.querySelector('a, button')) ? "auto" : "none";
    });
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger missing');
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

    ScrollTrigger.create({
      trigger: track,
      pin: stage,
      start: "top top",
      end: "+=4500",
      scrub: 0.45,
      anticipatePin: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        state.frame = progress * (FRAME_COUNT - 1);
        draw();
        updateChapters(progress);

        if (railFill) railFill.style.transform = `scaleY(${progress})`;
        if (hint) hint.style.opacity = progress > 0.015 ? 0 : 1;
      }
    });

    updateChapters(0);
    draw();

    gsap.from(canvas, { scale: 1.08, duration: 2.2, ease: "power3.out" });
    gsap.from(".chapter--hero h1, .chapter--hero p", {
      y: 40, opacity: 0, duration: 1.4, ease: "power3.out", stagger: 0.16, delay: 0.4,
    });
  }

  let loadedCount = 0;

  function loadAllFrames() {
    const initialBatch = [0, 1, 2, 3, 4, 10, 20, 60, 120, 180, 239];
    
    function loadImg(i) {
      return new Promise((res) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          loadedCount++;
          if (loaderNum) {
            const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
            loaderNum.textContent = pct;
            if (loaderBar) loaderBar.style.width = pct + "%";
          }
          res(img);
        };
        img.src = framePath(i);
        images[i] = img;
      });
    }

    Promise.all(initialBatch.map(loadImg)).then(() => {
      init();
      if (loader && loadedCount >= 10) {
        document.body.classList.remove("is-loading");
        loader.classList.add("is-done");
      }
    });

    for (let i = 0; i < FRAME_COUNT; i++) {
      if (!initialBatch.includes(i)) {
        loadImg(i).then(() => {
          if (loadedCount === FRAME_COUNT && loader) {
            document.body.classList.remove("is-loading");
            loader.classList.add("is-done");
          }
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllFrames);
  } else {
    loadAllFrames();
  }

})();
