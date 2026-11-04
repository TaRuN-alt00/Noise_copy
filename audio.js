/**
 * NOISE VORTEX PRO - PROCEDURAL WEB AUDIO SYNTHESIZER & ANC SIMULATOR
 * Real-time sound synthesis, 3D spatial panner, sub-bass generator,
 * and live ANC waveform visualization on canvas.
 */

class NoiseAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.soundFxEnabled = false;
    this.currentPlayingPreset = null;
    this.ancSimActive = false;
    this.ancNoiseSource = null;
    this.ancGainNode = null;
    this.ancMode = 'anc'; // 'off', 'anc', 'transparency'

    this.waveformCanvas = document.getElementById('waveform-canvas');
    this.waveformCtx = this.waveformCanvas ? this.waveformCanvas.getContext('2d') : null;
    this.analyser = null;

    this.initWaveform();
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playUiClick() {
    if (!this.soundFxEnabled) return;
    try {
      this.ensureAudioContext();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {
      // Audio context policy
    }
  }

  playSubBassDemo() {
    this.ensureAudioContext();
    this.stopCurrentDemo();

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(85, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(38, this.audioCtx.currentTime + 0.8);
    osc.frequency.setValueAtTime(42, this.audioCtx.currentTime + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, this.audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 2.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 2.6);
    this.currentPlayingPreset = 'bass';

    if (window.headphoneApp) {
      window.headphoneApp.pulseSonicRings();
    }
  }

  playSpatialDemo() {
    this.ensureAudioContext();
    this.stopCurrentDemo();

    const osc = this.audioCtx.createOscillator();
    const panner = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(660, this.audioCtx.currentTime + 1.0);
    osc.frequency.linearRampToValueAtTime(330, this.audioCtx.currentTime + 2.0);

    gain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 3.0);

    if (panner) {
      // Oscillate spatial position from left (-1) to right (+1)
      panner.pan.setValueAtTime(-1, this.audioCtx.currentTime);
      panner.pan.linearRampToValueAtTime(1, this.audioCtx.currentTime + 1.5);
      panner.pan.linearRampToValueAtTime(0, this.audioCtx.currentTime + 3.0);

      osc.connect(panner);
      panner.connect(gain);
    } else {
      osc.connect(gain);
    }

    gain.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 3.1);
    this.currentPlayingPreset = 'spatial';

    if (window.headphoneApp) {
      window.headphoneApp.pulseSonicRings();
    }
  }

  playTrebleDemo() {
    this.ensureAudioContext();
    this.stopCurrentDemo();

    const now = this.audioCtx.currentTime;
    const frequencies = [2400, 3200, 4800, 6400, 8000];

    frequencies.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0.08, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);

      osc.connect(gain);
      gain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.45);
    });

    this.currentPlayingPreset = 'treble';
  }

  stopCurrentDemo() {
    this.currentPlayingPreset = null;
  }

  // -------------------------------------------------------------
  // Active ANC Simulator
  // -------------------------------------------------------------
  toggleAncNoiseSimulation() {
    this.ensureAudioContext();

    if (this.ancSimActive) {
      this.stopAncNoise();
      return false;
    } else {
      this.startAncNoise();
      return true;
    }
  }

  startAncNoise() {
    this.ensureAudioContext();
    this.ancSimActive = true;

    // Create pink/brown noise for airplane cabin simulation
    const bufferSize = this.audioCtx.sampleRate * 2;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    this.ancNoiseSource = this.audioCtx.createBufferSource();
    this.ancNoiseSource.buffer = noiseBuffer;
    this.ancNoiseSource.loop = true;

    this.ancGainNode = this.audioCtx.createGain();
    this.applyAncMode(this.ancMode);

    this.ancNoiseSource.connect(this.ancGainNode);
    this.ancGainNode.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    this.ancNoiseSource.start();
  }

  stopAncNoise() {
    if (this.ancNoiseSource) {
      try {
        this.ancNoiseSource.stop();
        this.ancNoiseSource.disconnect();
      } catch (e) {}
      this.ancNoiseSource = null;
    }
    this.ancSimActive = false;
  }

  applyAncMode(mode) {
    this.ancMode = mode;
    if (!this.ancGainNode || !this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    if (mode === 'anc') {
      // 48dB Active Cancellation -> Almost dead silence (0.005 gain)
      this.ancGainNode.gain.cancelScheduledValues(now);
      this.ancGainNode.gain.linearRampToValueAtTime(0.004, now + 0.3);
    } else if (mode === 'off') {
      // Normal rumble pass-through
      this.ancGainNode.gain.cancelScheduledValues(now);
      this.ancGainNode.gain.linearRampToValueAtTime(0.25, now + 0.3);
    } else if (mode === 'transparency') {
      // Boosted high frequencies
      this.ancGainNode.gain.cancelScheduledValues(now);
      this.ancGainNode.gain.linearRampToValueAtTime(0.12, now + 0.3);
    }
  }

  // -------------------------------------------------------------
  // Live Canvas Waveform Visualization
  // -------------------------------------------------------------
  initWaveform() {
    if (!this.waveformCanvas || !this.waveformCtx) return;

    let wavePhase = 0;

    const draw = () => {
      requestAnimationFrame(draw);

      const width = this.waveformCanvas.width;
      const height = this.waveformCanvas.height;
      const ctx = this.waveformCtx;

      ctx.clearRect(0, 0, width, height);

      // Background grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Determine waveform amplitude based on ANC mode & simulation state
      let amp = 0.5;
      let waveColor = '#ff5e1e';
      let speed = 0.08;

      if (this.ancMode === 'anc') {
        amp = 0.03; // Almost completely flat cancelled line!
        waveColor = '#00f0ff';
        speed = 0.02;
      } else if (this.ancMode === 'transparency') {
        amp = 0.25;
        waveColor = '#4ade80';
        speed = 0.06;
      } else {
        amp = 0.65; // High ambient roar waves
        waveColor = '#ff3b00';
        speed = 0.12;
      }

      wavePhase += speed;

      // Draw Noise Anti-Wave (Cyan)
      if (this.ancMode === 'anc') {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.04 + wavePhase) * (height * 0.2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw Inverted Canceling Wave (Orange)
        ctx.strokeStyle = 'rgba(255, 94, 30, 0.35)';
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const y = height / 2 - Math.sin(x * 0.04 + wavePhase) * (height * 0.2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw Resulting Output Wave
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      for (let x = 0; x < width; x++) {
        const noisePerturbation = Math.sin(x * 0.05 + wavePhase) * Math.cos(x * 0.02 - wavePhase);
        const y = height / 2 + noisePerturbation * (height * amp * 0.5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    draw();
  }
}

// Global audio instance
window.noiseAudio = new NoiseAudioEngine();
