/**
 * NOISE VORTEX PRO - MAIN APPLICATION INTERACTIVITY
 * Handles Category Carousel scrolling, ANC Modes, Sound Lab, 3D Color Customizer,
 * Rewards Modal, Cart Drawer, and UI Sound Feedback.
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Audio FX Global Toggle
  const soundToggleBtn = document.getElementById('global-sound-toggle');
  if (soundToggleBtn && window.noiseAudio) {
    soundToggleBtn.addEventListener('click', () => {
      window.noiseAudio.soundFxEnabled = !window.noiseAudio.soundFxEnabled;
      if (window.noiseAudio.soundFxEnabled) {
        soundToggleBtn.classList.add('sound-on');
        showToast('🔊 Audio FX Synthesizer: ON');
        window.noiseAudio.playUiClick();
      } else {
        soundToggleBtn.classList.remove('sound-on');
        showToast('🔇 Audio FX: OFF');
      }
    });
  }                       

  // Generic click sound effect on interactive buttons
  document.querySelectorAll('button, .nav-link, .category-tile-card').forEach(el => {
    el.addEventListener('click', () => {
      if (window.noiseAudio) window.noiseAudio.playUiClick();
    });
  });

  // 2. Category Carousel Scroll Buttons
  const catTrack = document.getElementById('category-track');
  const catLeft = document.getElementById('cat-scroll-left');
  const catRight = document.getElementById('cat-scroll-right');

  if (catTrack && catLeft && catRight) {
    catLeft.addEventListener('click', () => {
      catTrack.scrollBy({ left: -320, behavior: 'smooth' });
    });
    catRight.addEventListener('click', () => {
      catTrack.scrollBy({ left: 320, behavior: 'smooth' });
    });
  }

  // 3. 3D Headphone Color Customizer
  const colorChips = document.querySelectorAll('.color-chip');
  colorChips.forEach(chip => {
    chip.addEventListener('click', () => {
      colorChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const colorKey = chip.getAttribute('data-color');
      if (window.headphoneApp) {
        window.headphoneApp.changeColorway(colorKey);
      }

      // Update cart drawer color preview tag
      const drawerColorTag = document.getElementById('drawer-item-color');
      const drawerBadge = document.getElementById('drawer-selected-badge');
      const colorNames = {
        obsidian: 'Obsidian Stealth',
        cyberorange: 'Signature Flame',
        cyancyber: 'Glacial Cyan',
        titanium: 'Lunar Titanium'
      };
      if (drawerColorTag) drawerColorTag.textContent = colorNames[colorKey];
      if (drawerBadge) drawerBadge.textContent = 'Edition: ' + colorNames[colorKey];

      showToast(`Selected Colorway: ${colorNames[colorKey]}`);
    });
  });

  // 4. Active ANC Live Simulator Widget
  const ancModeBtns = document.querySelectorAll('.anc-mode-btn');
  const ancModeLabel = document.getElementById('anc-mode-label');
  const dbMeter = document.getElementById('db-meter');
  const playSoundDemoBtn = document.getElementById('play-sound-demo-btn');

  ancModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      ancModeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const mode = btn.getAttribute('data-mode');
      if (window.noiseAudio) {
        window.noiseAudio.applyAncMode(mode);
      }

      if (mode === 'anc') {
        ancModeLabel.textContent = 'Mode: Max ANC Active (Anti-Wave Active)';
        dbMeter.textContent = '-48 dB REJECTION';
        dbMeter.style.color = 'var(--noise-cyan)';
      } else if (mode === 'transparency') {
        ancModeLabel.textContent = 'Mode: Transparency (Ambient Voice Enhanced)';
        dbMeter.textContent = '+6 dB PASSTHROUGH';
        dbMeter.style.color = '#4ade80';
      } else {
        ancModeLabel.textContent = 'Mode: Normal Ambient (No Filtering)';
        dbMeter.textContent = '0 dB NORMAL';
        dbMeter.style.color = '#f87171';
      }
    });
  });

  if (playSoundDemoBtn && window.noiseAudio) {
    playSoundDemoBtn.addEventListener('click', () => {
      const isSimulating = window.noiseAudio.toggleAncNoiseSimulation();
      if (isSimulating) {
        playSoundDemoBtn.classList.add('active');
        playSoundDemoBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          <span>Stop Simulation</span>
        `;
        showToast('✈️ Simulating jet cabin engine roar with real-time cancel');
      } else {
        playSoundDemoBtn.classList.remove('active');
        playSoundDemoBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          <span>Simulate Ambient Roar & Anti-Wave Cancel</span>
        `;
      }
    });
  }

  // 5. Sound Lab Synthesizer Presets
  const soundPlayBtns = document.querySelectorAll('.btn-sound-play');
  soundPlayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      if (!window.noiseAudio) return;

      btn.classList.add('playing');
      setTimeout(() => btn.classList.remove('playing'), 2200);

      if (preset === 'bass') {
        window.noiseAudio.playSubBassDemo();
        showToast('💥 Firing 38Hz Deep Sub-Bass Wave');
      } else if (preset === 'spatial') {
        window.noiseAudio.playSpatialDemo();
        showToast('🌐 360° Spatial Panning Left to Right');
      } else if (preset === 'treble') {
        window.noiseAudio.playTrebleDemo();
        showToast('✨ High-Frequency Harmonic Dispersion');
      }
    });
  });

  // 6. Floating "Noise Rewards" Modal
  const rewardsTrigger = document.getElementById('rewards-widget-trigger');
  const rewardsModal = document.getElementById('rewards-modal-overlay');
  const rewardsCloseBtn = document.getElementById('rewards-close-btn');
  const copyCouponBtn = document.getElementById('copy-rewards-coupon');

  if (rewardsTrigger && rewardsModal) {
    rewardsTrigger.addEventListener('click', () => {
      rewardsModal.classList.add('active');
    });
  }

  if (rewardsCloseBtn && rewardsModal) {
    rewardsCloseBtn.addEventListener('click', () => {
      rewardsModal.classList.remove('active');
    });
  }

  if (rewardsModal) {
    rewardsModal.addEventListener('click', (e) => {
      if (e.target === rewardsModal) rewardsModal.classList.remove('active');
    });
  }

  if (copyCouponBtn) {
    copyCouponBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('NOISEVIP500').then(() => {
        copyCouponBtn.textContent = 'Copied!';
        showToast('🎁 Coupon NOISEVIP500 copied to clipboard!');
        setTimeout(() => copyCouponBtn.textContent = 'Copy', 2000);
      });
    });
  }

  // 7. Dynamic Shopping Bag / Cart Drawer Manager
  let cart = [];

  // Load cart from localStorage if present
  try {
    const saved = localStorage.getItem('noise_cart_items');
    if (saved) {
      cart = JSON.parse(saved);
      if (!Array.isArray(cart)) cart = [];
    }
  } catch (e) {
    cart = [];
  }

  const openCartBtn = document.getElementById('open-cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartOverlay = document.getElementById('cart-drawer-overlay');
  const checkoutBtn = document.getElementById('checkout-btn');
  const cartCounter = document.getElementById('cart-counter');
  const drawerItemCount = document.getElementById('drawer-item-count');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const orderSummaryBox = document.getElementById('order-summary-box');
  const couponBox = document.getElementById('cart-coupon-box');
  const drawerFooter = document.getElementById('cart-drawer-footer');
  const summarySubtotal = document.getElementById('summary-subtotal');
  const summaryFinal = document.getElementById('summary-final-price');

  const openCart = () => cartOverlay && cartOverlay.classList.add('active');
  const closeCart = () => cartOverlay && cartOverlay.classList.remove('active');

  if (openCartBtn) openCartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartOverlay) {
    cartOverlay.addEventListener('click', (e) => {
      if (e.target === cartOverlay) closeCart();
    });
  }

  function saveCart() {
    try {
      localStorage.setItem('noise_cart_items', JSON.stringify(cart));
    } catch (e) {}
  }

  function renderCart() {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Update cart counter badges
    if (cartCounter) {
      cartCounter.textContent = totalQty;
      cartCounter.style.display = totalQty > 0 ? 'flex' : 'none';
    }
    if (drawerItemCount) {
      drawerItemCount.textContent = `(${totalQty} ${totalQty === 1 ? 'item' : 'items'})`;
    }

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="empty-cart-state">
          <div class="empty-cart-icon">🛍️</div>
          <h4>Your Bag is Empty</h4>
          <p>Add some awesome smartwatches or audio gear to get started!</p>
          <a href="#top-picks" class="btn-noise-pill" id="cart-continue-shopping" style="display:inline-block; text-decoration:none;">Explore Top Picks</a>
        </div>
      `;
      const contBtn = document.getElementById('cart-continue-shopping');
      if (contBtn) contBtn.addEventListener('click', closeCart);
      if (orderSummaryBox) orderSummaryBox.style.display = 'none';
      if (couponBox) couponBox.style.display = 'none';
      if (drawerFooter) drawerFooter.style.display = 'none';
      return;
    }

    if (orderSummaryBox) orderSummaryBox.style.display = 'block';
    if (couponBox) couponBox.style.display = 'flex';
    if (drawerFooter) drawerFooter.style.display = 'block';

    let html = '';
    let subtotal = 0;

    cart.forEach(item => {
      subtotal += item.price * item.quantity;
      const formattedPrice = '₹' + Number(item.price).toLocaleString('en-IN');
      const formattedOldPrice = item.mrp ? '₹' + Number(item.mrp).toLocaleString('en-IN') : '';

      html += `
        <div class="cart-product-item" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <div class="cart-item-header-row">
              <h4 class="cart-item-title">${item.name}</h4>
              <button class="cart-item-remove" data-id="${item.id}" title="Remove item" aria-label="Remove">✕</button>
            </div>
            <p class="cart-item-color">${item.spec || 'Official Noise Flagship'}</p>
            <div class="cart-item-price-row">
              <span class="item-price">${formattedPrice}</span>
              ${formattedOldPrice ? `<span class="item-old-price">${formattedOldPrice}</span>` : ''}
            </div>
            <div class="qty-selector">
              <button class="qty-btn qty-minus" data-id="${item.id}" aria-label="Decrease quantity">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn qty-plus" data-id="${item.id}" aria-label="Increase quantity">+</button>
            </div>
          </div>
        </div>
      `;
    });

    cartItemsContainer.innerHTML = html;

    const discount = subtotal > 500 ? 500 : 0;
    const finalVal = Math.max(0, subtotal - discount);

    if (summarySubtotal) summarySubtotal.textContent = '₹' + subtotal.toLocaleString('en-IN');
    if (summaryFinal) summaryFinal.textContent = '₹' + finalVal.toLocaleString('en-IN');

    // Attach quantity and remove buttons
    cartItemsContainer.querySelectorAll('.qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const itm = cart.find(x => x.id === id);
        if (itm) {
          itm.quantity++;
          saveCart();
          renderCart();
          if (window.noiseAudio) window.noiseAudio.playUiClick();
        }
      });
    });

    cartItemsContainer.querySelectorAll('.qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const idx = cart.findIndex(x => x.id === id);
        if (idx !== -1) {
          if (cart[idx].quantity > 1) {
            cart[idx].quantity--;
          } else {
            cart.splice(idx, 1);
          }
          saveCart();
          renderCart();
          if (window.noiseAudio) window.noiseAudio.playUiClick();
        }
      });
    });

    cartItemsContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const removed = cart.find(x => x.id === id);
        cart = cart.filter(x => x.id !== id);
        saveCart();
        renderCart();
        if (removed) showToast(`Removed ${removed.name} from Bag`);
        if (window.noiseAudio) window.noiseAudio.playUiClick();
      });
    });
  }

  function addToCart(product) {
    const existing = cart.find(x => x.id === product.id || x.name === product.name);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id || ('prod_' + Date.now()),
        name: product.name,
        price: Number(product.price),
        mrp: Number(product.mrp || (product.price * 1.8)),
        image: product.image,
        spec: product.spec || '',
        quantity: 1
      });
    }
    saveCart();
    renderCart();
    openCart();
    showToast(`Added ${product.name} to your Bag!`);
  }

  // Add to Cart buttons in Product Grid & Festive Campaign
  const addCartBtns = document.querySelectorAll('.btn-add-cart, .btn-festive-buy');
  addCartBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.noise-product-card') || btn.closest('.festive-product-card') || btn.closest('.master-feature-card');
      let name = btn.getAttribute('data-name');
      let price = btn.getAttribute('data-price');
      let mrp = btn.getAttribute('data-mrp');
      let img = btn.getAttribute('data-img');
      let spec = btn.getAttribute('data-spec');
      let id = btn.getAttribute('data-id') || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '');

      if (card) {
        if (!name) {
          const titleEl = card.querySelector('.product-card-title, .festive-card-title, .master-feature-title');
          if (titleEl) name = titleEl.textContent.trim().replace(/\s+/g, ' ');
        }
        if (!price) {
          const priceEl = card.querySelector('.prod-price, .festive-card-offer strong, .mf-price');
          if (priceEl) price = priceEl.textContent.replace(/[^0-9]/g, '');
        }
        if (!mrp) {
          const mrpEl = card.querySelector('.prod-old-price, .mf-mrp');
          if (mrpEl) mrp = mrpEl.textContent.replace(/[^0-9]/g, '');
        }
        if (!img) {
          const imgEl = card.querySelector('img.product-thumb, img.festive-card-img, img.master-hero-img');
          if (imgEl) img = imgEl.getAttribute('src');
        }
        if (!spec) {
          const specEl = card.querySelector('.product-card-spec, .festive-card-offer');
          if (specEl) spec = specEl.textContent.trim();
        }
      }

      addToCart({
        id: id || 'item-' + Date.now(),
        name: name || 'Noise Product',
        price: Number(price) || 2999,
        mrp: Number(mrp) || 5999,
        image: img || 'assets/watch.jpg',
        spec: spec || 'Official Noise Flagship'
      });
    });
  });

  // Smart Watches Mega Menu Dropdown Interactions
  const swDropdown = document.getElementById('nav-smartwatches-dropdown');
  const swLink = document.getElementById('nav-smartwatches-link');
  const megaMenu = document.getElementById('smartwatch-mega-menu');

  if (swLink && swDropdown) {
    let leaveTimeout = null;

    const showMenu = () => {
      if (leaveTimeout) clearTimeout(leaveTimeout);
      swDropdown.classList.add('active');
    };

    const hideMenu = () => {
      leaveTimeout = setTimeout(() => {
        swDropdown.classList.remove('active');
      }, 220);
    };

    swLink.addEventListener('mouseenter', showMenu);
    swLink.addEventListener('mouseleave', hideMenu);

    if (megaMenu) {
      megaMenu.addEventListener('mouseenter', showMenu);
      megaMenu.addEventListener('mouseleave', hideMenu);

      megaMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (leaveTimeout) clearTimeout(leaveTimeout);
          swDropdown.classList.remove('active');
        });
      });
    }

    swLink.addEventListener('click', (e) => {
      e.preventDefault();
      swDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!swDropdown.contains(e.target)) {
        swDropdown.classList.remove('active');
      }
    });
  }

  // Initial cart render on page load
  renderCart();

  // Checkout Celebration Confetti
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ff5500', '#00f0ff', '#ffffff']
        });
      }
      showToast('🎉 Order initiated! Redirecting to secure gateway...');
      setTimeout(() => {
        closeCart();
      }, 1800);
    });
  }

  // Wishlist Heart toggles
  document.querySelectorAll('.wishlist-toggle').forEach(heartBtn => {
    heartBtn.addEventListener('click', () => {
      heartBtn.classList.toggle('active');
      const isWishlisted = heartBtn.classList.contains('active');
      showToast(isWishlisted ? '❤️ Added to Wishlist' : 'Removed from Wishlist');
    });
  });

  // =========================================================================
  // 8. Dynamic Hero Carousel with Slow Ambient Color Transitions
  // Matches Reference Images 1 & 2: Navbar + Stage background softly highlights active ad
  // =========================================================================
  // =========================================================================
  // 8. Hero Carousel & Scroll-Driven Dark-to-White Transition
  // =========================================================================
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDots = document.querySelectorAll('#hero-carousel-dots .dot');
  const heroCard = document.getElementById('hero-curved-card');
  const heroOverlay = document.getElementById('hero-scroll-overlay');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let currentHeroSlide = 0;
  let heroTimer = null;

  function switchHeroSlide(targetIndex) {
    if (!heroSlides.length) return;
    
    currentHeroSlide = (targetIndex + heroSlides.length) % heroSlides.length;

    heroSlides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === currentHeroSlide);
    });

    heroDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentHeroSlide);
    });
  }

  function startHeroAutoPlay() {
    stopHeroAutoPlay();
    heroTimer = setInterval(() => {
      switchHeroSlide(currentHeroSlide + 1);
    }, 5500);
  }

  function stopHeroAutoPlay() {
    if (heroTimer) {
      clearInterval(heroTimer);
      heroTimer = null;
    }
  }

  // Bind dots
  heroDots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      switchHeroSlide(idx);
      startHeroAutoPlay();
    });
  });

  // Pause carousel auto-rotation on mouse hover
  if (heroCard) {
    heroCard.addEventListener('mouseenter', stopHeroAutoPlay);
    heroCard.addEventListener('mouseleave', startHeroAutoPlay);
  }

  if (heroSlides.length) {
    switchHeroSlide(0);
    startHeroAutoPlay();
  }

  // =========================================================================
  // 9. Scroll-Driven Hero Dark-to-White Color Transition
  // GPU-friendly requestAnimationFrame + passive listener (respects reduced motion)
  // =========================================================================
  if (heroCard && heroOverlay && !prefersReducedMotion) {
    let isTicking = false;

    function handleHeroScrollTransition() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const heroHeight = heroCard.offsetHeight || 600;
      // Transition completes across 65% of hero scroll
      const threshold = Math.max(heroHeight * 0.65, 300);
      const progress = Math.min(Math.max(scrollY / threshold, 0), 1);

      // Smooth white overlay opacity
      heroOverlay.style.opacity = progress.toFixed(3);

      // Switch text to dark (#111) and button to black when card becomes predominantly light
      if (progress > 0.45) {
        heroCard.classList.add('hero-theme-light');
      } else {
        heroCard.classList.remove('hero-theme-light');
      }

      isTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!isTicking) {
        window.requestAnimationFrame(handleHeroScrollTransition);
        isTicking = true;
      }
    }, { passive: true });

    // Initialize state on page load
    handleHeroScrollTransition();
  }

  // Toast Notification Helper
  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

});
