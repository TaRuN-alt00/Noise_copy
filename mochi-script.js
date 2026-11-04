/**
 * MOCHI — MASTERPIECE 03 SCRIPT
 * Single rAF-throttled scroll handler for 3 pinned stages
 * Progressive spec-row lighting + Colorway selection + Confetti Checkout
 */

(function () {
  'use strict';

  const stageHero = document.getElementById('stage-hero');
  const stageReveal = document.getElementById('stage-reveal');
  const stageSpecs = document.getElementById('stage-specs');
  const specRows = document.querySelectorAll('.spec-row');

  let ticking = false;
  let lastSpecIndex = -1;

  function calculateProgress(element) {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    const scrollDistance = rect.height - window.innerHeight;
    if (scrollDistance <= 0) return 0;
    const p = -rect.top / scrollDistance;
    return Math.min(1, Math.max(0, p));
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateStages();
        ticking = false;
      });
      ticking = true;
    }
  }

  function updateStages() {
    // 1. Stage Hero
    if (stageHero) {
      const pHero = calculateProgress(stageHero);
      stageHero.style.setProperty('--p', pHero.toFixed(4));
    }

    // 2. Stage Reveal
    if (stageReveal) {
      const pReveal = calculateProgress(stageReveal);
      stageReveal.style.setProperty('--p', pReveal.toFixed(4));
    }

    // 3. Stage Specs on Deep Plum
    if (stageSpecs) {
      const pSpecs = calculateProgress(stageSpecs);
      stageSpecs.style.setProperty('--p', pSpecs.toFixed(4));

      // Light rows cumulatively: floor(p * 4) -> 0, 1, 2, 3
      const currentActiveRow = Math.min(3, Math.max(0, Math.floor(pSpecs * 4)));
      if (currentActiveRow !== lastSpecIndex) {
        lastSpecIndex = currentActiveRow;
        specRows.forEach((row, idx) => {
          if (idx <= currentActiveRow) {
            row.classList.add('is-active');
          } else {
            row.classList.remove('is-active');
          }
        });
      }
    }
  }

  // Scroll listener
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateStages();

  // ---------- Pre-Order Bag Drawer Interactions ----------
  const cartOverlay = document.getElementById('cart-drawer-overlay');
  const openCartBtn = document.getElementById('open-cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const checkoutBtn = document.getElementById('checkout-btn');

  function openDrawer(colorway, price, img) {
    if (!cartOverlay) return;
    if (colorway) {
      const t = document.getElementById('drawer-item-title');
      const c = document.getElementById('drawer-item-color');
      const p = document.getElementById('drawer-item-price');
      const tot = document.getElementById('drawer-item-total');
      const i = document.getElementById('drawer-item-img');

      if (t) t.textContent = `Mochi // ${colorway}`;
      if (c) c.textContent = `Soft Pastel Edition • ${colorway}`;
      if (p) p.textContent = price || '₹6,499';
      if (tot) tot.textContent = price || '₹6,499';
      if (i && img) i.src = img;
    }
    cartOverlay.classList.add('active');
  }

  function closeDrawer() {
    if (cartOverlay) cartOverlay.classList.remove('active');
  }

  if (openCartBtn) openCartBtn.addEventListener('click', () => openDrawer());
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeDrawer);
  if (cartOverlay) {
    cartOverlay.addEventListener('click', (e) => {
      if (e.target === cartOverlay) closeDrawer();
    });
  }

  // Colorway Table selection buttons
  document.querySelectorAll('.btn-cw-select').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.colourway-row');
      if (row) {
        const name = row.dataset.name || 'Strawberry Milk';
        const price = row.dataset.price || '₹6,499';
        const img = row.dataset.img || 'assets/mochi/mochi-still.jpg';
        openDrawer(name, price, img);
      }
    });
  });

  // Main CTA button
  const ctaBtn = document.getElementById('btn-main-cta');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer('Strawberry Milk', '₹6,499', 'assets/mochi/mochi-still.jpg');
    });
  }

  // Checkout Confetti celebration
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 110,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#FF6FA5', '#FFD9E2', '#E6DBFF', '#FFF1C9']
        });
      }
      checkoutBtn.textContent = 'Order Confirmed! Redirecting...';
      setTimeout(() => {
        closeDrawer();
        checkoutBtn.textContent = 'Complete Pre-Order';
      }, 1800);
    });
  }

})();
