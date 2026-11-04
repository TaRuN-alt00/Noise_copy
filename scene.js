/**
 * NOISE VORTEX PRO - 3D HEADPHONE SCENE ENGINE (THREE.JS + GSAP)
 * Realistic procedural 3D flagship headphone with multi-angle scroll animation,
 * exploded acoustic driver components, studio lighting, and 360° color customizer.
 */

class HeadphoneShowcase {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.canvas = document.getElementById('headphone-canvas');
    this.loader = document.getElementById('canvas-loader');
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.headphoneGroup = null;
    this.explodedParts = [];
    this.particles = null;
    this.sonicRings = [];
    
    // Color palettes for real-time switcher
    this.colorPalettes = {
      obsidian: {
        body: 0x16181f,
        metal: 0x3a3f4d,
        cushion: 0x111317,
        accent: 0xff5e1e,
        roughness: 0.35,
        metalness: 0.85
      },
      cyberorange: {
        body: 0xff5511,
        metal: 0x1e2025,
        cushion: 0x15161b,
        accent: 0xff8833,
        roughness: 0.3,
        metalness: 0.7
      },
      cyancyber: {
        body: 0x00d2ff,
        metal: 0x121d24,
        cushion: 0x0a1014,
        accent: 0x00f0ff,
        roughness: 0.25,
        metalness: 0.8
      },
      titanium: {
        body: 0xe2e8f0,
        metal: 0xcbd5e1,
        cushion: 0xf1f5f9,
        accent: 0x94a3b8,
        roughness: 0.3,
        metalness: 0.95
      }
    };

    this.currentColor = 'obsidian';
    this.materials = {};
    
    // Interaction states
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.manualRotation = { x: 0, y: 0 };
    this.isCustomizerSection = false;
    
    this.init();
  }

  init() {
    // 1. Setup Three.js Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x07080a, 0.045);

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Setup Lighting
    this.setupLighting();

    // 3. Build Realistic Procedural 3D Headphone
    this.buildMaterials();
    this.buildHeadphoneModel();
    this.buildAtmosphere();

    // 4. Setup Scroll-driven Multi-Angle Camera Choreography with GSAP
    this.setupScrollAnimation();

    // 5. Setup Drag Interactions for 360° Turntable
    this.setupInteractions();

    // 6. Handle Window Resizing
    window.addEventListener('resize', () => this.onResize());

    // 7. Hide Loader
    setTimeout(() => {
      if (this.loader) {
        this.loader.style.opacity = '0';
        setTimeout(() => this.loader.style.display = 'none', 500);
      }
    }, 600);

    // 8. Start Render Loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    // Key studio light (Crisp neutral white)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.keyLight.position.set(5, 6, 6);
    this.scene.add(this.keyLight);

    // Secondary fill light (Soft warm)
    const fillLight = new THREE.DirectionalLight(0xfff0e6, 1.2);
    fillLight.position.set(-6, 3, 4);
    this.scene.add(fillLight);

    // Rim light (Noise Signature Electric Orange)
    this.rimLightOrange = new THREE.DirectionalLight(0xff5e1e, 2.8);
    this.rimLightOrange.position.set(4, -3, -5);
    this.scene.add(this.rimLightOrange);

    // Accent rim light (Cyber Glacial Cyan)
    this.rimLightCyan = new THREE.DirectionalLight(0x00f0ff, 2.0);
    this.rimLightCyan.position.set(-5, 4, -4);
    this.scene.add(this.rimLightCyan);

    // Soft ground bounce light
    const bounceLight = new THREE.PointLight(0xffffff, 0.5, 10);
    bounceLight.position.set(0, -4, 2);
    this.scene.add(bounceLight);
  }

  buildMaterials() {
    const pal = this.colorPalettes[this.currentColor];

    // Main Outer Shell Material (High-end matte metal with micro-sparkle)
    this.materials.shell = new THREE.MeshStandardMaterial({
      color: pal.body,
      metalness: pal.metalness,
      roughness: pal.roughness,
      envMapIntensity: 1.5
    });

    // Brushed Aluminum Sliders & Hinges
    this.materials.aluminum = new THREE.MeshStandardMaterial({
      color: pal.metal,
      metalness: 0.95,
      roughness: 0.18,
      envMapIntensity: 2.0
    });

    // Ear Cushions (Soft thermo-adaptive leatherette)
    this.materials.cushion = new THREE.MeshStandardMaterial({
      color: pal.cushion,
      roughness: 0.85,
      metalness: 0.05
    });

    // Headband Canopy Mesh
    this.materials.meshCanopy = new THREE.MeshStandardMaterial({
      color: 0x1a1c22,
      roughness: 0.9,
      metalness: 0.1,
      wireframe: false
    });

    // Glowing Concentric Touchpad Ring (Noise Brand Accent)
    this.materials.glowAccent = new THREE.MeshBasicMaterial({
      color: pal.accent
    });

    // Acoustic Titanium Diaphragm (Exploded Part)
    this.materials.titaniumDriver = new THREE.MeshStandardMaterial({
      color: 0xd8e2dc,
      metalness: 0.95,
      roughness: 0.12
    });

    // Copper Voice Coil (Exploded Part)
    this.materials.copper = new THREE.MeshStandardMaterial({
      color: 0xb87333,
      metalness: 0.9,
      roughness: 0.3
    });

    // Neodymium Magnet (Exploded Part)
    this.materials.magnet = new THREE.MeshStandardMaterial({
      color: 0x333338,
      metalness: 0.98,
      roughness: 0.2
    });

    // Inner Driver Grille
    this.materials.grille = new THREE.MeshStandardMaterial({
      color: 0x22252c,
      metalness: 0.8,
      roughness: 0.4,
      wireframe: true
    });
  }

  buildHeadphoneModel() {
    this.headphoneGroup = new THREE.Group();

    // -------------------------------------------------------------
    // A. Headband Architecture
    // -------------------------------------------------------------
    // Curved tubular steel core
    const headbandCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.8, 0.4, 0),
      new THREE.Vector3(0, 2.65, 0),
      new THREE.Vector3(1.8, 0.4, 0)
    );
    const headbandGeo = new THREE.TubeGeometry(headbandCurve, 64, 0.12, 16, false);
    const headbandMesh = new THREE.Mesh(headbandGeo, this.materials.aluminum);
    this.headphoneGroup.add(headbandMesh);

    // Canopy Cushion Pad (Mesh wrap along the top curve)
    const canopyCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.3, 1.1, 0),
      new THREE.Vector3(0, 2.45, 0),
      new THREE.Vector3(1.3, 1.1, 0)
    );
    const canopyGeo = new THREE.TubeGeometry(canopyCurve, 40, 0.24, 20, false);
    const canopyMesh = new THREE.Mesh(canopyGeo, this.materials.meshCanopy);
    this.headphoneGroup.add(canopyMesh);

    // -------------------------------------------------------------
    // B. Left & Right Telescoping Arms & Hinges
    // -------------------------------------------------------------
    const createArmSlider = (side) => {
      const armGroup = new THREE.Group();
      armGroup.position.set(side * 1.8, 0.3, 0);

      // Slider bar with etched lines
      const sliderGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 24);
      const sliderMesh = new THREE.Mesh(sliderGeo, this.materials.aluminum);
      armGroup.add(sliderMesh);

      // Swivel Fork / Yoke (Connects headband to earcup)
      const forkGeo = new THREE.TorusGeometry(0.48, 0.08, 16, 32, Math.PI);
      const forkMesh = new THREE.Mesh(forkGeo, this.materials.aluminum);
      forkMesh.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      forkMesh.position.y = -0.5;
      armGroup.add(forkMesh);

      // Joint Pivot Pin
      const pinGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16);
      const pinMesh = new THREE.Mesh(pinGeo, this.materials.aluminum);
      pinMesh.rotation.x = Math.PI / 2;
      pinMesh.position.y = -0.5;
      armGroup.add(pinMesh);

      return armGroup;
    };

    const leftArm = createArmSlider(-1);
    const rightArm = createArmSlider(1);
    this.headphoneGroup.add(leftArm);
    this.headphoneGroup.add(rightArm);

    // -------------------------------------------------------------
    // C. Left & Right Earcups
    // -------------------------------------------------------------
    this.leftEarcupGroup = this.buildEarcup(-1, false);
    this.rightEarcupGroup = this.buildEarcup(1, true); // Right cup contains exploded parts

    this.headphoneGroup.add(this.leftEarcupGroup);
    this.headphoneGroup.add(this.rightEarcupGroup);

    // Center and scale whole model
    this.headphoneGroup.scale.set(1.4, 1.4, 1.4);
    this.headphoneGroup.position.set(0, -0.3, 0);
    this.scene.add(this.headphoneGroup);
  }

  buildEarcup(side, hasExplodedInternals) {
    const earcupGroup = new THREE.Group();
    earcupGroup.position.set(side * 1.8, -0.7, 0);

    // Angle the earcups slightly inwards like real human ear anatomy
    earcupGroup.rotation.y = side * 0.12;
    earcupGroup.rotation.z = side * 0.08;

    // 1. Outer CNC Aluminum Shell (Oval cup)
    const shellGeo = new THREE.CylinderGeometry(1.0, 0.95, 0.55, 48);
    shellGeo.rotateZ(Math.PI / 2);
    shellGeo.scale(1, 1.18, 0.9); // Ergonomic oval contour
    const shellMesh = new THREE.Mesh(shellGeo, this.materials.shell);
    earcupGroup.add(shellMesh);

    // 2. Concentric Touchpad Center Dial
    const dialGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.08, 48);
    dialGeo.rotateZ(Math.PI / 2);
    dialGeo.scale(1, 1.15, 0.88);
    const dialMesh = new THREE.Mesh(dialGeo, this.materials.aluminum);
    dialMesh.position.x = side * 0.28;
    earcupGroup.add(dialMesh);

    // 3. Glowing LED Status Ring (Noise brand pulse)
    const glowRingGeo = new THREE.TorusGeometry(0.74, 0.025, 16, 48);
    glowRingGeo.rotateY(Math.PI / 2);
    glowRingGeo.scale(1, 1.15, 0.88);
    const glowRing = new THREE.Mesh(glowRingGeo, this.materials.glowAccent);
    glowRing.position.x = side * 0.3;
    earcupGroup.add(glowRing);

    // 4. Memory Foam Cushion (Thick padded seal)
    const cushionGeo = new THREE.TorusGeometry(0.9, 0.26, 24, 48);
    cushionGeo.rotateY(Math.PI / 2);
    cushionGeo.scale(1, 1.2, 0.92);
    const cushionMesh = new THREE.Mesh(cushionGeo, this.materials.cushion);
    cushionMesh.position.x = -side * 0.22;
    earcupGroup.add(cushionMesh);

    // 5. Inner Acoustic Speaker Cloth
    const clothGeo = new THREE.CircleGeometry(0.78, 36);
    clothGeo.rotateY(-side * Math.PI / 2);
    const clothMesh = new THREE.Mesh(clothGeo, this.materials.meshCanopy);
    clothMesh.position.x = -side * 0.35;
    earcupGroup.add(clothMesh);

    // -------------------------------------------------------------
    // D. Exploded Internal Acoustic Driver Assembly (Right Cup)
    // -------------------------------------------------------------
    if (hasExplodedInternals) {
      this.explodedInternalGroup = new THREE.Group();
      this.explodedInternalGroup.position.set(0, 0, 0);

      // Part 1: Honeycomb Protective Acoustic Grille
      const grilleGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 32);
      grilleGeo.rotateZ(Math.PI / 2);
      this.meshGrille = new THREE.Mesh(grilleGeo, this.materials.grille);
      this.meshGrille.position.x = 0.05;
      this.explodedInternalGroup.add(this.meshGrille);

      // Part 2: 45mm Titanium Diaphragm Dome
      const diaphragmGeo = new THREE.SphereGeometry(0.58, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.35);
      diaphragmGeo.rotateZ(-Math.PI / 2);
      this.meshDiaphragm = new THREE.Mesh(diaphragmGeo, this.materials.titaniumDriver);
      this.meshDiaphragm.position.x = 0.12;
      this.explodedInternalGroup.add(this.meshDiaphragm);

      // Part 3: OFC Copper Voice Coil Ring
      const coilGeo = new THREE.TorusGeometry(0.42, 0.06, 16, 36);
      coilGeo.rotateY(Math.PI / 2);
      this.meshCoil = new THREE.Mesh(coilGeo, this.materials.copper);
      this.meshCoil.position.x = 0.2;
      this.explodedInternalGroup.add(this.meshCoil);

      // Part 4: N52 Neodymium Magnetic Engine Disc
      const magnetGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.1, 32);
      magnetGeo.rotateZ(Math.PI / 2);
      this.meshMagnet = new THREE.Mesh(magnetGeo, this.materials.magnet);
      this.meshMagnet.position.x = 0.3;
      this.explodedInternalGroup.add(this.meshMagnet);

      // Part 5: ANC Silicon Sensor Chiplet
      const chipGeo = new THREE.BoxGeometry(0.04, 0.22, 0.22);
      this.meshAncChip = new THREE.Mesh(chipGeo, this.materials.glowAccent);
      this.meshAncChip.position.set(0.25, 0.35, 0);
      this.explodedInternalGroup.add(this.meshAncChip);

      earcupGroup.add(this.explodedInternalGroup);

      // Track references for GSAP exploded animations
      this.explodedParts = [
        { mesh: this.meshGrille, targetX: 0.7, targetY: 0, targetZ: 0 },
        { mesh: this.meshDiaphragm, targetX: 1.45, targetY: 0, targetZ: 0 },
        { mesh: this.meshCoil, targetX: 2.15, targetY: 0, targetZ: 0 },
        { mesh: this.meshMagnet, targetX: 2.85, targetY: 0, targetZ: 0 },
        { mesh: this.meshAncChip, targetX: 1.9, targetY: 0.8, targetZ: 0 }
      ];
    }

    return earcupGroup;
  }

  buildAtmosphere() {
    // 1. Ambient Floating Audio Dust Particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 16;
      positions[i + 1] = (Math.random() - 0.5) * 16;
      positions[i + 2] = (Math.random() - 0.5) * 12;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particles);

    // 2. Pulsing Sonic Sound Wave Rings (Radiating around drivers)
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(1.2 + i * 0.5, 1.25 + i * 0.5, 48);
      ringGeo.rotateY(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff5e1e,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.15 - i * 0.04
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(2.4, -0.7, 0);
      ring.visible = false;
      this.headphoneGroup.add(ring);
      this.sonicRings.push(ring);
    }
  }

  setupScrollAnimation() {
    gsap.registerPlugin(ScrollTrigger);

    // Initial Hero State: Floating on right side of the hero card (Angle 1)
    this.headphoneGroup.rotation.set(0.18, -0.45, 0.08);
    this.headphoneGroup.position.set(1.5, 0.15, 0.6);

    // Multi-Section Scroll Timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".content-scroll-wrapper",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2
      }
    });

    // -------------------------------------------------------------
    // Phase 0 -> 1: Move from Hero Stage into Section 1 Overview
    // -------------------------------------------------------------
    tl.to(this.headphoneGroup.position, {
      x: 0,
      y: -0.2,
      z: 0.3,
      ease: "power2.inOut"
    }, "hero-to-overview")
    .to(this.headphoneGroup.rotation, {
      x: 0.1,
      y: 0.1,
      z: 0,
      ease: "power2.inOut"
    }, "hero-to-overview");

    // -------------------------------------------------------------
    // Phase 1 -> 2: Transition to Profile 90° (Craftsmanship)
    // -------------------------------------------------------------
    tl.to(this.headphoneGroup.rotation, {
      x: 0.08,
      y: 1.57, // Exact 90° machined profile
      z: -0.04,
      ease: "power2.inOut"
    }, "overview-to-profile")
    .to(this.headphoneGroup.position, {
      x: 1.7, // Positioned on right side of screen
      y: -0.1,
      z: 0.4,
      ease: "power2.inOut"
    }, "overview-to-profile");

    // -------------------------------------------------------------
    // Phase 2 -> 3: Transition to Exploded Acoustic Architecture
    // -------------------------------------------------------------
    tl.to(this.headphoneGroup.rotation, {
      x: 0.22,
      y: 1.35,
      z: 0.15,
      ease: "power2.inOut"
    }, "profile-to-acoustics")
    .to(this.headphoneGroup.position, {
      x: -1.6, // Shift left so text on right is clear
      y: -0.2,
      z: 0.9,
      ease: "power2.inOut"
    }, "profile-to-acoustics");

    // Explode right earcup internal parts outward!
    this.explodedParts.forEach(part => {
      tl.to(part.mesh.position, {
        x: part.targetX,
        y: part.targetY,
        z: part.targetZ,
        ease: "power3.out"
      }, "profile-to-acoustics");
    });

    // -------------------------------------------------------------
    // Phase 3 -> 4: Transition to Top Headband Canopy Arc (Comfort)
    // -------------------------------------------------------------
    // Collapse exploded parts back inside
    this.explodedParts.forEach(part => {
      tl.to(part.mesh.position, {
        x: 0.1,
        y: 0,
        z: 0,
        ease: "power2.in"
      }, "acoustics-to-comfort");
    });

    tl.to(this.headphoneGroup.rotation, {
      x: 1.32, // Overhead 75° arc
      y: 0.15,
      z: -0.5,
      ease: "power2.inOut"
    }, "acoustics-to-comfort")
    .to(this.headphoneGroup.position, {
      x: 1.8,
      y: -0.7,
      z: 1.1,
      ease: "power2.inOut"
    }, "acoustics-to-comfort");

    // -------------------------------------------------------------
    // Phase 4 -> 5: Transition to Active ANC Close-up & Waveform
    // -------------------------------------------------------------
    tl.to(this.headphoneGroup.rotation, {
      x: -0.1,
      y: -1.55,
      z: 0.08,
      ease: "power2.inOut"
    }, "comfort-to-anc")
    .to(this.headphoneGroup.position, {
      x: 0,
      y: -0.1,
      z: 1.4,
      ease: "power2.inOut"
    }, "comfort-to-anc");

    // -------------------------------------------------------------
    // Phase 5 -> 6: Sound Lab (Floating centered with sonic pulse)
    // -------------------------------------------------------------
    tl.to(this.headphoneGroup.rotation, {
      x: 0.15,
      y: 0.35,
      z: 0.04,
      ease: "power2.inOut"
    }, "anc-to-lab")
    .to(this.headphoneGroup.position, {
      x: 0,
      y: 0.25,
      z: 0.2,
      ease: "power2.inOut"
    }, "anc-to-lab");

    // -------------------------------------------------------------
    // Phase 6 -> 7: Customizer 360° Showroom Section
    // -------------------------------------------------------------
    tl.to(this.headphoneGroup.rotation, {
      x: 0.12,
      y: 0,
      z: 0,
      ease: "power2.inOut"
    }, "lab-to-customizer")
    .to(this.headphoneGroup.position, {
      x: 0,
      y: -0.2,
      z: 0.6,
      ease: "power2.inOut"
    }, "lab-to-customizer");

    // Enable drag interaction when reaching the customizer section
    ScrollTrigger.create({
      trigger: "#customizer",
      start: "top center",
      end: "bottom center",
      onEnter: () => this.setInteractiveMode(true),
      onLeave: () => this.setInteractiveMode(false),
      onEnterBack: () => this.setInteractiveMode(true),
      onLeaveBack: () => this.setInteractiveMode(false)
    });
  }

  setInteractiveMode(enabled) {
    this.isCustomizerSection = enabled;
    if (enabled) {
      this.container.classList.add('interactive-mode');
    } else {
      this.container.classList.remove('interactive-mode');
      this.manualRotation.x = 0;
      this.manualRotation.y = 0;
    }
  }

  setupInteractions() {
    const handleStart = (clientX, clientY) => {
      if (!this.isCustomizerSection) return;
      this.isDragging = true;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const handleMove = (clientX, clientY) => {
      if (!this.isDragging || !this.isCustomizerSection) return;
      const deltaX = clientX - this.previousMousePosition.x;
      const deltaY = clientY - this.previousMousePosition.y;

      this.manualRotation.y += deltaX * 0.008;
      this.manualRotation.x += deltaY * 0.008;

      // Clamp vertical tilt
      this.manualRotation.x = Math.max(-0.6, Math.min(0.6, this.manualRotation.x));

      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const handleEnd = () => {
      this.isDragging = false;
    };

    // Mouse Events
    window.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', handleEnd);

    // Touch Events for Mobile
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    });
    window.addEventListener('touchend', handleEnd);
  }

  changeColorway(colorKey) {
    if (!this.colorPalettes[colorKey]) return;
    this.currentColor = colorKey;
    const pal = this.colorPalettes[colorKey];

    // Smoothly animate material color changes
    gsap.to(this.materials.shell.color, {
      r: ((pal.body >> 16) & 255) / 255,
      g: ((pal.body >> 8) & 255) / 255,
      b: (pal.body & 255) / 255,
      duration: 0.6
    });

    gsap.to(this.materials.aluminum.color, {
      r: ((pal.metal >> 16) & 255) / 255,
      g: ((pal.metal >> 8) & 255) / 255,
      b: (pal.metal & 255) / 255,
      duration: 0.6
    });

    gsap.to(this.materials.cushion.color, {
      r: ((pal.cushion >> 16) & 255) / 255,
      g: ((pal.cushion >> 8) & 255) / 255,
      b: (pal.cushion & 255) / 255,
      duration: 0.6
    });

    gsap.to(this.materials.glowAccent.color, {
      r: ((pal.accent >> 16) & 255) / 255,
      g: ((pal.accent >> 8) & 255) / 255,
      b: (pal.accent & 255) / 255,
      duration: 0.6
    });

    // Animate a sleek 360 degree celebration spin on color switch
    gsap.to(this.headphoneGroup.rotation, {
      y: "+=" + Math.PI * 2,
      duration: 1.2,
      ease: "power2.out"
    });
  }

  pulseSonicRings() {
    this.sonicRings.forEach((ring, idx) => {
      ring.visible = true;
      ring.scale.set(1, 1, 1);
      ring.material.opacity = 0.45;

      gsap.to(ring.scale, {
        x: 2.2,
        y: 2.2,
        z: 2.2,
        duration: 1.2,
        delay: idx * 0.15,
        ease: "power1.out"
      });

      gsap.to(ring.material, {
        opacity: 0,
        duration: 1.2,
        delay: idx * 0.15,
        ease: "power1.out",
        onComplete: () => {
          if (idx === this.sonicRings.length - 1) {
            this.sonicRings.forEach(r => r.visible = false);
          }
        }
      });
    });
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // Subtle gentle floating levitation
    if (!this.isCustomizerSection) {
      this.headphoneGroup.position.y += Math.sin(elapsedTime * 1.5) * 0.0008;
    } else {
      // In customizer mode, apply smooth interpolated manual rotation
      this.headphoneGroup.rotation.y += (this.manualRotation.y - this.headphoneGroup.rotation.y) * 0.08;
      this.headphoneGroup.rotation.x += (this.manualRotation.x - this.headphoneGroup.rotation.x) * 0.08;
      
      // Auto gentle turn if not dragging
      if (!this.isDragging) {
        this.manualRotation.y += 0.003;
      }
    }

    // Slowly drift audio particle field
    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.03;
      this.particles.rotation.x = Math.sin(elapsedTime * 0.02) * 0.05;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.headphoneApp = new HeadphoneShowcase();
});
