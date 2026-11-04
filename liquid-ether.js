/**
 * LiquidEther - WebGL Fluid Dynamics Simulation in Vanilla JavaScript
 * Adapted from Navier-Stokes Eulerian fluid simulation with Three.js
 * Features:
 * - Real-time BFECC (Back-and-Forth Error Compensation and Correction)
 * - Mouse momentum & interactive physics
 * - Smooth Auto-Demo Driver when idle
 * - High-performance WebGL FBO ping-pong rendering
 * - Automatic IntersectionObserver & visibility pause/resume
 */

(function (window) {
  'use strict';

  var defaultColors = ['#5227FF', '#FF6FA5', '#B19EEF', '#00F0FF'];

  function makePaletteTexture(stops) {
    var arr;
    if (Array.isArray(stops) && stops.length > 0) {
      arr = stops.length === 1 ? [stops[0], stops[0]] : stops;
    } else {
      arr = ['#5227FF', '#FF6FA5'];
    }
    var w = arr.length;
    var data = new Uint8Array(w * 4);
    for (var i = 0; i < w; i++) {
      var c = new THREE.Color(arr[i]);
      data[i * 4 + 0] = Math.round(c.r * 255);
      data[i * 4 + 1] = Math.round(c.g * 255);
      data[i * 4 + 2] = Math.round(c.b * 255);
      data[i * 4 + 3] = 255;
    }
    var tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }

  var face_vert = [
    'attribute vec3 position;',
    'uniform vec2 px;',
    'uniform vec2 boundarySpace;',
    'varying vec2 uv;',
    'precision highp float;',
    'void main(){',
    '  vec3 pos = position;',
    '  vec2 scale = 1.0 - boundarySpace * 2.0;',
    '  pos.xy = pos.xy * scale;',
    '  uv = vec2(0.5) + (pos.xy) * 0.5;',
    '  gl_Position = vec4(pos, 1.0);',
    '}'
  ].join('\n');

  var line_vert = [
    'attribute vec3 position;',
    'uniform vec2 px;',
    'precision highp float;',
    'varying vec2 uv;',
    'void main(){',
    '  vec3 pos = position;',
    '  uv = 0.5 + pos.xy * 0.5;',
    '  vec2 n = sign(pos.xy);',
    '  pos.xy = abs(pos.xy) - px * 1.0;',
    '  pos.xy *= n;',
    '  gl_Position = vec4(pos, 1.0);',
    '}'
  ].join('\n');

  var mouse_vert = [
    'precision highp float;',
    'attribute vec3 position;',
    'attribute vec2 uv;',
    'uniform vec2 center;',
    'uniform vec2 scale;',
    'uniform vec2 px;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec2 pos = position.xy * scale * 2.0 * px + center;',
    '  vUv = uv;',
    '  gl_Position = vec4(pos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var advection_frag = [
    'precision highp float;',
    'uniform sampler2D velocity;',
    'uniform float dt;',
    'uniform bool isBFECC;',
    'uniform vec2 fboSize;',
    'uniform vec2 px;',
    'varying vec2 uv;',
    'void main(){',
    '  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;',
    '  if(isBFECC == false){',
    '    vec2 vel = texture2D(velocity, uv).xy;',
    '    vec2 uv2 = uv - vel * dt * ratio;',
    '    vec2 newVel = texture2D(velocity, uv2).xy;',
    '    gl_FragColor = vec4(newVel, 0.0, 0.0);',
    '  } else {',
    '    vec2 spot_new = uv;',
    '    vec2 vel_old = texture2D(velocity, uv).xy;',
    '    vec2 spot_old = spot_new - vel_old * dt * ratio;',
    '    vec2 vel_new1 = texture2D(velocity, spot_old).xy;',
    '    vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;',
    '    vec2 error = spot_new2 - spot_new;',
    '    vec2 spot_new3 = spot_new - error / 2.0;',
    '    vec2 vel_2 = texture2D(velocity, spot_new3).xy;',
    '    vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;',
    '    vec2 newVel2 = texture2D(velocity, spot_old2).xy;',
    '    gl_FragColor = vec4(newVel2, 0.0, 0.0);',
    '  }',
    '}'
  ].join('\n');

  var color_frag = [
    'precision highp float;',
    'uniform sampler2D velocity;',
    'uniform sampler2D palette;',
    'uniform vec4 bgColor;',
    'varying vec2 uv;',
    'void main(){',
    '  vec2 vel = texture2D(velocity, uv).xy;',
    '  float lenv = clamp(length(vel), 0.0, 1.0);',
    '  vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;',
    '  vec3 outRGB = mix(bgColor.rgb, c, lenv);',
    '  float outA = mix(bgColor.a, 0.85, lenv);',
    '  gl_FragColor = vec4(outRGB, outA);',
    '}'
  ].join('\n');

  var divergence_frag = [
    'precision highp float;',
    'uniform sampler2D velocity;',
    'uniform float dt;',
    'uniform vec2 px;',
    'varying vec2 uv;',
    'void main(){',
    '  float x0 = texture2D(velocity, uv - vec2(px.x, 0.0)).x;',
    '  float x1 = texture2D(velocity, uv + vec2(px.x, 0.0)).x;',
    '  float y0 = texture2D(velocity, uv - vec2(0.0, px.y)).y;',
    '  float y1 = texture2D(velocity, uv + vec2(0.0, px.y)).y;',
    '  float divergence = (x1 - x0 + y1 - y0) / 2.0;',
    '  gl_FragColor = vec4(divergence / dt);',
    '}'
  ].join('\n');

  var externalForce_frag = [
    'precision highp float;',
    'uniform vec2 force;',
    'uniform vec2 center;',
    'uniform vec2 scale;',
    'uniform vec2 px;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec2 circle = (vUv - 0.5) * 2.0;',
    '  float d = 1.0 - min(length(circle), 1.0);',
    '  d *= d;',
    '  gl_FragColor = vec4(force * d, 0.0, 1.0);',
    '}'
  ].join('\n');

  var poisson_frag = [
    'precision highp float;',
    'uniform sampler2D pressure;',
    'uniform sampler2D divergence;',
    'uniform vec2 px;',
    'varying vec2 uv;',
    'void main(){',
    '  float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;',
    '  float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;',
    '  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;',
    '  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;',
    '  float div = texture2D(divergence, uv).r;',
    '  float newP = (p0 + p1 + p2 + p3) / 4.0 - div;',
    '  gl_FragColor = vec4(newP);',
    '}'
  ].join('\n');

  var pressure_frag = [
    'precision highp float;',
    'uniform sampler2D pressure;',
    'uniform sampler2D velocity;',
    'uniform vec2 px;',
    'uniform float dt;',
    'varying vec2 uv;',
    'void main(){',
    '  float step = 1.0;',
    '  float p0 = texture2D(pressure, uv + vec2(px.x * step, 0.0)).r;',
    '  float p1 = texture2D(pressure, uv - vec2(px.x * step, 0.0)).r;',
    '  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * step)).r;',
    '  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * step)).r;',
    '  vec2 v = texture2D(velocity, uv).xy;',
    '  vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;',
    '  v = v - gradP * dt;',
    '  gl_FragColor = vec4(v, 0.0, 1.0);',
    '}'
  ].join('\n');

  var viscous_frag = [
    'precision highp float;',
    'uniform sampler2D velocity;',
    'uniform sampler2D velocity_new;',
    'uniform float v;',
    'uniform vec2 px;',
    'uniform float dt;',
    'varying vec2 uv;',
    'void main(){',
    '  vec2 old = texture2D(velocity, uv).xy;',
    '  vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;',
    '  vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;',
    '  vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;',
    '  vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;',
    '  vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);',
    '  newv /= 4.0 * (1.0 + v * dt);',
    '  gl_FragColor = vec4(newv, 0.0, 0.0);',
    '}'
  ].join('\n');

  function LiquidEther(container, options) {
    if (!container) return;
    options = options || {};

    var colors = options.colors || defaultColors;
    var mouseForce = options.mouseForce !== undefined ? options.mouseForce : 25;
    var cursorSize = options.cursorSize !== undefined ? options.cursorSize : 120;
    var isViscous = options.isViscous !== undefined ? options.isViscous : false;
    var viscous = options.viscous !== undefined ? options.viscous : 30;
    var iterationsViscous = options.iterationsViscous || 32;
    var iterationsPoisson = options.iterationsPoisson || 32;
    var dt = options.dt !== undefined ? options.dt : 0.014;
    var BFECC = options.BFECC !== undefined ? options.BFECC : true;
    var resolution = options.resolution !== undefined ? options.resolution : 0.6;
    var isBounce = options.isBounce !== undefined ? options.isBounce : false;
    var autoDemo = options.autoDemo !== undefined ? options.autoDemo : true;
    var autoSpeed = options.autoSpeed !== undefined ? options.autoSpeed : 0.55;
    var autoIntensity = options.autoIntensity !== undefined ? options.autoIntensity : 2.5;
    var takeoverDuration = options.takeoverDuration !== undefined ? options.takeoverDuration : 0.25;
    var autoResumeDelay = options.autoResumeDelay !== undefined ? options.autoResumeDelay : 1000;
    var autoRampDuration = options.autoRampDuration !== undefined ? options.autoRampDuration : 0.6;

    var paletteTex = makePaletteTexture(colors);
    var bgVec4 = options.bgColor
      ? new THREE.Vector4(options.bgColor[0], options.bgColor[1], options.bgColor[2], options.bgColor[3])
      : new THREE.Vector4(0, 0, 0, 0);

    // Common renderer setup
    var Common = {
      width: 0,
      height: 0,
      aspect: 1,
      pixelRatio: 1,
      container: container,
      renderer: null,
      clock: null,
      time: 0,
      delta: 0,
      init: function () {
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.resize();
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.autoClear = false;
        this.renderer.setClearColor(new THREE.Color(0x000000), 0);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height);
        var el = this.renderer.domElement;
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.display = 'block';
        el.style.position = 'absolute';
        el.style.top = '0';
        el.style.left = '0';
        el.style.pointerEvents = 'none';
        this.container.prepend(el);
        this.clock = new THREE.Clock();
        this.clock.start();
      },
      resize: function () {
        if (!this.container) return;
        var rect = this.container.getBoundingClientRect();
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        this.aspect = this.width / this.height;
        if (this.renderer) {
          this.renderer.setSize(this.width, this.height, false);
        }
      },
      update: function () {
        if (!this.clock) return;
        this.delta = this.clock.getDelta();
        this.time += this.delta;
      }
    };

    // Mouse & Touch Tracking with momentum
    var Mouse = {
      mouseMoved: false,
      coords: new THREE.Vector2(),
      coords_old: new THREE.Vector2(),
      diff: new THREE.Vector2(),
      timer: null,
      container: container,
      isHoverInside: false,
      hasUserControl: false,
      isAutoActive: false,
      autoIntensity: autoIntensity,
      takeoverActive: false,
      takeoverStartTime: 0,
      takeoverDuration: takeoverDuration,
      takeoverFrom: new THREE.Vector2(),
      takeoverTo: new THREE.Vector2(),
      onInteract: null,

      init: function () {
        var self = this;
        this._onMouseMove = function (e) { self.onDocumentMouseMove(e); };
        this._onTouchStart = function (e) { self.onDocumentTouchStart(e); };
        this._onTouchMove = function (e) { self.onDocumentTouchMove(e); };
        this._onTouchEnd = function () { self.isHoverInside = false; };
        this._onMouseLeave = function () { self.isHoverInside = false; };

        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('touchstart', this._onTouchStart, { passive: true });
        window.addEventListener('touchmove', this._onTouchMove, { passive: true });
        window.addEventListener('touchend', this._onTouchEnd);
        document.addEventListener('mouseleave', this._onMouseLeave);
      },
      dispose: function () {
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('touchstart', this._onTouchStart);
        window.removeEventListener('touchmove', this._onTouchMove);
        window.removeEventListener('touchend', this._onTouchEnd);
        document.removeEventListener('mouseleave', this._onMouseLeave);
      },
      isPointInside: function (clientX, clientY) {
        if (!this.container) return false;
        var rect = this.container.getBoundingClientRect();
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      },
      updateHoverState: function (clientX, clientY) {
        this.isHoverInside = this.isPointInside(clientX, clientY);
        return this.isHoverInside;
      },
      setCoords: function (x, y) {
        if (!this.container) return;
        if (this.timer) window.clearTimeout(this.timer);
        var rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        var nx = (x - rect.left) / rect.width;
        var ny = (y - rect.top) / rect.height;
        this.coords.set(nx * 2 - 1, -(ny * 2 - 1));
        this.mouseMoved = true;
        var self = this;
        this.timer = window.setTimeout(function () {
          self.mouseMoved = false;
        }, 100);
      },
      setNormalized: function (nx, ny) {
        this.coords.set(nx, ny);
        this.mouseMoved = true;
      },
      onDocumentMouseMove: function (e) {
        if (!this.updateHoverState(e.clientX, e.clientY)) return;
        if (this.onInteract) this.onInteract();
        if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
          if (!this.container) return;
          var rect = this.container.getBoundingClientRect();
          var nx = (e.clientX - rect.left) / rect.width;
          var ny = (e.clientY - rect.top) / rect.height;
          this.takeoverFrom.copy(this.coords);
          this.takeoverTo.set(nx * 2 - 1, -(ny * 2 - 1));
          this.takeoverStartTime = performance.now();
          this.takeoverActive = true;
          this.hasUserControl = true;
          this.isAutoActive = false;
          return;
        }
        this.setCoords(e.clientX, e.clientY);
        this.hasUserControl = true;
      },
      onDocumentTouchStart: function (e) {
        if (e.touches.length !== 1) return;
        var t = e.touches[0];
        if (!this.updateHoverState(t.clientX, t.clientY)) return;
        if (this.onInteract) this.onInteract();
        this.setCoords(t.clientX, t.clientY);
        this.hasUserControl = true;
      },
      onDocumentTouchMove: function (e) {
        if (e.touches.length !== 1) return;
        var t = e.touches[0];
        if (!this.updateHoverState(t.clientX, t.clientY)) return;
        if (this.onInteract) this.onInteract();
        this.setCoords(t.clientX, t.clientY);
      },
      update: function () {
        if (this.takeoverActive) {
          var t = (performance.now() - this.takeoverStartTime) / (this.takeoverDuration * 1000);
          if (t >= 1) {
            this.takeoverActive = false;
            this.coords.copy(this.takeoverTo);
            this.coords_old.copy(this.coords);
            this.diff.set(0, 0);
          } else {
            var k = t * t * (3 - 2 * t);
            this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, k);
          }
        }
        this.diff.subVectors(this.coords, this.coords_old);
        this.coords_old.copy(this.coords);
        if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
        if (this.isAutoActive && !this.takeoverActive) this.diff.multiplyScalar(this.autoIntensity);
      }
    };

    // Auto-Driver to wander smoothly when user is idle
    function AutoDriver(opts) {
      this.enabled = opts.enabled;
      this.speed = opts.speed;
      this.resumeDelay = opts.resumeDelay || 1500;
      this.rampDurationMs = (opts.rampDuration || 0) * 1000;
      this.active = false;
      this.current = new THREE.Vector2(0, 0);
      this.target = new THREE.Vector2();
      this.lastTime = performance.now();
      this.activationTime = 0;
      this.margin = 0.2;
      this._tmpDir = new THREE.Vector2();
      this.pickNewTarget();
    }

    AutoDriver.prototype.pickNewTarget = function () {
      var r = Math.random;
      this.target.set((r() * 2 - 1) * (1 - this.margin), (r() * 2 - 1) * (1 - this.margin));
    };

    AutoDriver.prototype.forceStop = function () {
      this.active = false;
      Mouse.isAutoActive = false;
    };

    AutoDriver.prototype.update = function (lastInteraction) {
      if (!this.enabled) return;
      var now = performance.now();
      var idle = now - lastInteraction;
      if (idle < this.resumeDelay || Mouse.isHoverInside) {
        if (this.active) this.forceStop();
        return;
      }
      if (!this.active) {
        this.active = true;
        this.current.copy(Mouse.coords);
        this.lastTime = now;
        this.activationTime = now;
      }
      if (!this.active) return;
      Mouse.isAutoActive = true;
      var dtSec = (now - this.lastTime) / 1000;
      this.lastTime = now;
      if (dtSec > 0.2) dtSec = 0.016;
      var dir = this._tmpDir.subVectors(this.target, this.current);
      var dist = dir.length();
      if (dist < 0.01) {
        this.pickNewTarget();
        return;
      }
      dir.normalize();
      var ramp = 1;
      if (this.rampDurationMs > 0) {
        var t = Math.min(1, (now - this.activationTime) / this.rampDurationMs);
        ramp = t * t * (3 - 2 * t);
      }
      var step = this.speed * dtSec * ramp;
      var move = Math.min(step, dist);
      this.current.addScaledVector(dir, move);
      Mouse.setNormalized(this.current.x, this.current.y);
    };

    // Generic Shader Pass
    function ShaderPass(props) {
      this.props = props || {};
      this.uniforms = this.props.material ? this.props.material.uniforms : null;
      this.scene = null;
      this.camera = null;
      this.material = null;
      this.geometry = null;
      this.plane = null;
    }

    ShaderPass.prototype.init = function () {
      this.scene = new THREE.Scene();
      this.camera = new THREE.Camera();
      if (this.uniforms) {
        this.material = new THREE.RawShaderMaterial(this.props.material);
        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
      }
    };

    ShaderPass.prototype.update = function () {
      if (!Common.renderer || !this.scene || !this.camera) return;
      Common.renderer.setRenderTarget(this.props.output || null);
      Common.renderer.render(this.scene, this.camera);
      Common.renderer.setRenderTarget(null);
    };

    // Advection Pass
    function Advection(simProps) {
      ShaderPass.call(this, {
        material: {
          vertexShader: face_vert,
          fragmentShader: advection_frag,
          uniforms: {
            boundarySpace: { value: simProps.cellScale },
            px: { value: simProps.cellScale },
            fboSize: { value: simProps.fboSize },
            velocity: { value: simProps.src.texture },
            dt: { value: simProps.dt },
            isBFECC: { value: true }
          }
        },
        output: simProps.dst
      });
      this.init();
      this.createBoundary();
    }
    Advection.prototype = Object.create(ShaderPass.prototype);
    Advection.prototype.constructor = Advection;

    Advection.prototype.createBoundary = function () {
      var boundaryG = new THREE.BufferGeometry();
      var vertices = new Float32Array([-1,-1,0, -1,1,0, -1,1,0, 1,1,0, 1,1,0, 1,-1,0, 1,-1,0, -1,-1,0]);
      boundaryG.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      var boundaryM = new THREE.RawShaderMaterial({
        vertexShader: line_vert,
        fragmentShader: advection_frag,
        uniforms: this.uniforms
      });
      this.line = new THREE.LineSegments(boundaryG, boundaryM);
      this.scene.add(this.line);
    };

    Advection.prototype.update = function (args) {
      if (!this.uniforms) return;
      this.uniforms.dt.value = args.dt;
      this.line.visible = args.isBounce;
      this.uniforms.isBFECC.value = args.BFECC;
      ShaderPass.prototype.update.call(this);
    };

    // External Force Pass (Mouse/Touch momentum)
    function ExternalForce(simProps) {
      ShaderPass.call(this, { output: simProps.dst });
      this.init(simProps);
    }
    ExternalForce.prototype = Object.create(ShaderPass.prototype);
    ExternalForce.prototype.constructor = ExternalForce;

    ExternalForce.prototype.init = function (simProps) {
      ShaderPass.prototype.init.call(this);
      var mouseG = new THREE.PlaneGeometry(1, 1);
      var mouseM = new THREE.RawShaderMaterial({
        vertexShader: mouse_vert,
        fragmentShader: externalForce_frag,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          px: { value: simProps.cellScale },
          force: { value: new THREE.Vector2(0, 0) },
          center: { value: new THREE.Vector2(0, 0) },
          scale: { value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size) }
        }
      });
      this.mouse = new THREE.Mesh(mouseG, mouseM);
      this.scene.add(this.mouse);
    };

    ExternalForce.prototype.update = function (args) {
      var uniforms = this.mouse.material.uniforms;
      uniforms.force.value.set((Mouse.diff.x / 2) * args.mouse_force, (Mouse.diff.y / 2) * args.mouse_force);
      uniforms.center.value.set(Mouse.coords.x, Mouse.coords.y);
      uniforms.scale.value.set(args.cursor_size, args.cursor_size);
      ShaderPass.prototype.update.call(this);
    };

    // Viscous Pass
    function Viscous(simProps) {
      ShaderPass.call(this, {
        material: {
          vertexShader: face_vert,
          fragmentShader: viscous_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            velocity: { value: simProps.src.texture },
            velocity_new: { value: simProps.dst_.texture },
            v: { value: simProps.viscous },
            px: { value: simProps.cellScale },
            dt: { value: simProps.dt }
          }
        },
        output: simProps.dst,
        output0: simProps.dst_,
        output1: simProps.dst
      });
      this.init();
    }
    Viscous.prototype = Object.create(ShaderPass.prototype);
    Viscous.prototype.constructor = Viscous;

    Viscous.prototype.update = function (args) {
      var iterations = args.iterations;
      for (var i = 0; i < iterations; i++) {
        var fbo_in = i % 2 === 0 ? this.props.output0 : this.props.output1;
        var fbo_out = i % 2 === 0 ? this.props.output1 : this.props.output0;
        this.uniforms.velocity_new.value = fbo_in.texture;
        this.props.output = fbo_out;
        this.uniforms.dt.value = args.dt;
        ShaderPass.prototype.update.call(this);
      }
      return iterations % 2 === 0 ? this.props.output0 : this.props.output1;
    };

    // Divergence Pass
    function Divergence(simProps) {
      ShaderPass.call(this, {
        material: {
          vertexShader: face_vert,
          fragmentShader: divergence_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            velocity: { value: simProps.src.texture },
            px: { value: simProps.cellScale },
            dt: { value: simProps.dt }
          }
        },
        output: simProps.dst
      });
      this.init();
    }
    Divergence.prototype = Object.create(ShaderPass.prototype);
    Divergence.prototype.constructor = Divergence;

    Divergence.prototype.update = function (args) {
      if (this.uniforms) this.uniforms.velocity.value = args.vel.texture;
      ShaderPass.prototype.update.call(this);
    };

    // Poisson Pass
    function Poisson(simProps) {
      ShaderPass.call(this, {
        material: {
          vertexShader: face_vert,
          fragmentShader: poisson_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            pressure: { value: simProps.dst_.texture },
            divergence: { value: simProps.src.texture },
            px: { value: simProps.cellScale }
          }
        },
        output: simProps.dst,
        output0: simProps.dst_,
        output1: simProps.dst
      });
      this.init();
    }
    Poisson.prototype = Object.create(ShaderPass.prototype);
    Poisson.prototype.constructor = Poisson;

    Poisson.prototype.update = function (args) {
      var iterations = args.iterations;
      for (var i = 0; i < iterations; i++) {
        var p_in = i % 2 === 0 ? this.props.output0 : this.props.output1;
        var p_out = i % 2 === 0 ? this.props.output1 : this.props.output0;
        this.uniforms.pressure.value = p_in.texture;
        this.props.output = p_out;
        ShaderPass.prototype.update.call(this);
      }
      return iterations % 2 === 0 ? this.props.output0 : this.props.output1;
    };

    // Pressure Pass
    function Pressure(simProps) {
      ShaderPass.call(this, {
        material: {
          vertexShader: face_vert,
          fragmentShader: pressure_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace },
            pressure: { value: simProps.src_p.texture },
            velocity: { value: simProps.src_v.texture },
            px: { value: simProps.cellScale },
            dt: { value: simProps.dt }
          }
        },
        output: simProps.dst
      });
      this.init();
    }
    Pressure.prototype = Object.create(ShaderPass.prototype);
    Pressure.prototype.constructor = Pressure;

    Pressure.prototype.update = function (args) {
      this.uniforms.velocity.value = args.vel.texture;
      this.uniforms.pressure.value = args.pressure.texture;
      ShaderPass.prototype.update.call(this);
    };

    // Simulation Engine
    function Simulation(options) {
      this.options = {
        iterations_poisson: iterationsPoisson,
        iterations_viscous: iterationsViscous,
        mouse_force: mouseForce,
        resolution: resolution,
        cursor_size: cursorSize,
        viscous: viscous,
        isBounce: isBounce,
        dt: dt,
        isViscous: isViscous,
        BFECC: BFECC
      };
      this.fbos = {
        vel_0: null, vel_1: null, vel_viscous0: null, vel_viscous1: null,
        div: null, pressure_0: null, pressure_1: null
      };
      this.fboSize = new THREE.Vector2();
      this.cellScale = new THREE.Vector2();
      this.boundarySpace = new THREE.Vector2();
      this.init();
    }

    Simulation.prototype.getFloatType = function () {
      return /(iPad|iPhone|iPod)/i.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType;
    };

    Simulation.prototype.createAllFBO = function () {
      var type = this.getFloatType();
      var opts = {
        type: type,
        depthBuffer: false,
        stencilBuffer: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping
      };
      for (var key in this.fbos) {
        this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, opts);
      }
    };

    Simulation.prototype.calcSize = function () {
      var w = Math.max(1, Math.round(this.options.resolution * Common.width));
      var h = Math.max(1, Math.round(this.options.resolution * Common.height));
      this.cellScale.set(1 / w, 1 / h);
      this.fboSize.set(w, h);
    };

    Simulation.prototype.createShaderPass = function () {
      this.advection = new Advection({ cellScale: this.cellScale, fboSize: this.fboSize, dt: this.options.dt, src: this.fbos.vel_0, dst: this.fbos.vel_1 });
      this.externalForce = new ExternalForce({ cellScale: this.cellScale, cursor_size: this.options.cursor_size, dst: this.fbos.vel_1 });
      this.viscous = new Viscous({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, viscous: this.options.viscous, src: this.fbos.vel_1, dst: this.fbos.vel_viscous1, dst_: this.fbos.vel_viscous0, dt: this.options.dt });
      this.divergence = new Divergence({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src: this.fbos.vel_viscous0, dst: this.fbos.div, dt: this.options.dt });
      this.poisson = new Poisson({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src: this.fbos.div, dst: this.fbos.pressure_1, dst_: this.fbos.pressure_0 });
      this.pressure = new Pressure({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src_p: this.fbos.pressure_0, src_v: this.fbos.vel_viscous0, dst: this.fbos.vel_0, dt: this.options.dt });
    };

    Simulation.prototype.init = function () {
      this.calcSize();
      this.createAllFBO();
      this.createShaderPass();
    };

    Simulation.prototype.resize = function () {
      this.calcSize();
      for (var key in this.fbos) {
        if (this.fbos[key]) this.fbos[key].setSize(this.fboSize.x, this.fboSize.y);
      }
    };

    Simulation.prototype.update = function () {
      this.boundarySpace.copy(this.options.isBounce ? new THREE.Vector2(0, 0) : this.cellScale);
      this.advection.update({ dt: this.options.dt, isBounce: this.options.isBounce, BFECC: this.options.BFECC });
      this.externalForce.update({ cursor_size: this.options.cursor_size, mouse_force: this.options.mouse_force, cellScale: this.cellScale });
      var vel = this.fbos.vel_1;
      if (this.options.isViscous) vel = this.viscous.update({ iterations: this.options.iterations_viscous, dt: this.options.dt });
      this.divergence.update({ vel: vel });
      var pressure = this.poisson.update({ iterations: this.options.iterations_poisson });
      this.pressure.update({ vel: vel, pressure: pressure });
    };

    // Output Render Pass
    function Output(sim) {
      this.simulation = sim;
      this.scene = new THREE.Scene();
      this.camera = new THREE.Camera();
      this.output = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.RawShaderMaterial({
          vertexShader: face_vert,
          fragmentShader: color_frag,
          transparent: true,
          depthWrite: false,
          uniforms: {
            velocity: { value: this.simulation.fbos.vel_0.texture },
            boundarySpace: { value: new THREE.Vector2() },
            palette: { value: paletteTex },
            bgColor: { value: bgVec4 }
          }
        })
      );
      this.scene.add(this.output);
    }

    Output.prototype.resize = function () {
      this.simulation.resize();
    };

    Output.prototype.render = function () {
      if (Common.renderer) {
        Common.renderer.setRenderTarget(null);
        Common.renderer.render(this.scene, this.camera);
      }
    };

    Output.prototype.update = function () {
      this.simulation.update();
      this.render();
    };

    // Initialize Common renderer first so dimensions are ready for Simulation
    Common.init();

    // WebGL Orchestrator
    var sim = new Simulation();
    var output = new Output(sim);
    var autoDriver = new AutoDriver({
      enabled: autoDemo,
      speed: autoSpeed,
      resumeDelay: autoResumeDelay,
      rampDuration: autoRampDuration
    });

    var lastUserInteraction = performance.now();
    var running = false;
    var rafId = null;

    Mouse.init();
    Mouse.onInteract = function () {
      lastUserInteraction = performance.now();
      if (autoDriver) autoDriver.forceStop();
    };

    function renderLoop() {
      if (!running) return;
      if (autoDriver) autoDriver.update(lastUserInteraction);
      Mouse.update();
      Common.update();
      output.update();
      rafId = requestAnimationFrame(renderLoop);
    }

    function start() {
      if (!running) {
        running = true;
        renderLoop();
      }
    }

    function pause() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function onResize() {
      Common.resize();
      output.resize();
    }

    window.addEventListener('resize', onResize);

    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function () {
        onResize();
      });
      ro.observe(container);
    }

    // Pause when tab is hidden or element is off-screen
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause();
      else start();
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !document.hidden) {
          start();
        } else {
          pause();
        }
      }, { threshold: 0.05 });
      io.observe(container);
    } else {
      start();
    }

    return {
      start: start,
      pause: pause,
      resize: onResize,
      dispose: function () {
        pause();
        window.removeEventListener('resize', onResize);
        Mouse.dispose();
        if (Common.renderer && Common.renderer.domElement && Common.renderer.domElement.parentNode) {
          Common.renderer.domElement.parentNode.removeChild(Common.renderer.domElement);
          Common.renderer.dispose();
        }
      }
    };
  }

  window.LiquidEther = LiquidEther;
})(window);
