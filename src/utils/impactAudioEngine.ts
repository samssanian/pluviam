import { DisasterScene } from '../data/disasterScenes';

class ImpactAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private floodFilter: BiquadFilterNode | null = null;
  private floodGain: GainNode | null = null;
  private fogGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isEnabled = false;
  private lastThunderAt = 0;
  private lastSparkAt = 0;
  private sirenPhase = 0;

  private ensureContext() {
    if (this.ctx) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.masterGain = master;

    // 4s pink/brown noise buffer
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const out = noiseBuffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.96300 * b1 + w * 0.2965164;
        b2 = 0.57000 * b2 + w * 1.0526913;
        out[i] = (b0 + b1 + b2 + w * 0.1848) * 0.15;
      }
    }

    // Rain layer
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = noiseBuffer;
    rainSrc.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1100;
    rainFilter.Q.value = 0.7;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.25;
    rainSrc.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(master);
    rainSrc.start();
    this.rainFilter = rainFilter;
    this.rainGain = rainGain;

    // Rushing floodwater low rumble layer
    const floodSrc = ctx.createBufferSource();
    floodSrc.buffer = noiseBuffer;
    floodSrc.loop = true;
    const floodFilter = ctx.createBiquadFilter();
    floodFilter.type = 'lowpass';
    floodFilter.frequency.value = 220;
    const floodGain = ctx.createGain();
    floodGain.gain.value = 0.12;
    floodSrc.connect(floodFilter);
    floodFilter.connect(floodGain);
    floodGain.connect(master);
    floodSrc.start();
    this.floodFilter = floodFilter;
    this.floodGain = floodGain;

    // Mosquito fogging / pressurized spray hiss layer
    const fogSrc = ctx.createBufferSource();
    fogSrc.buffer = noiseBuffer;
    fogSrc.loop = true;
    const fogFilter = ctx.createBiquadFilter();
    fogFilter.type = 'highpass';
    fogFilter.frequency.value = 2800;
    const fogGain = ctx.createGain();
    fogGain.gain.value = 0;
    fogSrc.connect(fogFilter);
    fogFilter.connect(fogGain);
    fogGain.connect(master);
    fogSrc.start();
    this.fogGain = fogGain;

    // Emergency / Ambulance siren oscillator (low volume muffled in rain)
    const sirenFilter = ctx.createBiquadFilter();
    sirenFilter.type = 'lowpass';
    sirenFilter.frequency.value = 950;
    const sirenGain = ctx.createGain();
    sirenGain.gain.value = 0;
    const sirenOsc = ctx.createOscillator();
    sirenOsc.type = 'triangle';
    sirenOsc.frequency.value = 540;
    sirenOsc.connect(sirenFilter);
    sirenFilter.connect(sirenGain);
    sirenGain.connect(master);
    sirenOsc.start();
    this.sirenOsc = sirenOsc;
    this.sirenGain = sirenGain;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0.32, this.ctx.currentTime, 0.25);
      }
    } else if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.18);
    }
  }

  public triggerThunder(strength = 0.7) {
    if (!this.isEnabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    if (now - this.lastThunderAt < 2.2) return;
    this.lastThunderAt = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 1.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 140;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35 * strength, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.9);
  }

  public triggerSpark() {
    if (!this.isEnabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    if (now - this.lastSparkAt < 0.75) return;
    this.lastSparkAt = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1600 + Math.random() * 1400, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.09);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public updateScene(
    scene: DisasterScene,
    intensity: number, // 0..1
    wind: number, // 0..1
    isPlaying: boolean
  ) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (!this.isEnabled || !isPlaying) {
      this.masterGain.gain.setTargetAtTime(0, now, 0.15);
      return;
    }

    this.masterGain.gain.setTargetAtTime(0.32, now, 0.25);

    const isQuietEnding = Boolean(scene.hasSunrise || scene.hasCandles || scene.id === 'aftermath-lantern');
    const rainTarget = isQuietEnding ? 0.08 : 0.15 + intensity * 0.35;
    const floodTarget = 0.05 + scene.waterDepth * 0.45;
    const fogTarget = scene.hasFogging ? 0.16 : 0;

    if (this.rainGain && this.rainFilter) {
      this.rainGain.gain.setTargetAtTime(rainTarget, now, 0.25);
      this.rainFilter.frequency.setTargetAtTime(850 + intensity * 900 + wind * 400, now, 0.25);
    }

    if (this.floodGain && this.floodFilter) {
      this.floodGain.gain.setTargetAtTime(floodTarget, now, 0.3);
      this.floodFilter.frequency.setTargetAtTime(160 + scene.waterDepth * 190, now, 0.3);
    }

    if (this.fogGain) {
      this.fogGain.gain.setTargetAtTime(fogTarget, now, 0.2);
    }

    if (this.sirenGain && this.sirenOsc) {
      if (scene.hasSiren) {
        this.sirenPhase = (this.sirenPhase + 0.12) % (Math.PI * 2);
        const freq = 520 + Math.sin(this.sirenPhase) * 190;
        this.sirenOsc.frequency.setTargetAtTime(freq, now, 0.08);
        this.sirenGain.gain.setTargetAtTime(0.055, now, 0.2);
      } else {
        this.sirenGain.gain.setTargetAtTime(0, now, 0.2);
      }
    }

    if (scene.hasSparks && Math.random() < 0.08) {
      this.triggerSpark();
    }
    if ((scene.severity === 'Catastrophic' || scene.severity === 'Severe') && !isQuietEnding && Math.random() < 0.025) {
      this.triggerThunder(intensity);
    }
  }
}

export const impactAudioEngine = new ImpactAudioEngine();
