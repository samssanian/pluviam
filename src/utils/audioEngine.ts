import { SoundProfile } from '../types/rain';

class RainAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private isEnabled = false;
  private currentProfile: SoundProfile = 'steady-rain';
  private currentIntensity = 0.65;
  private currentWind = 0.25;
  private dripInterval: number | null = null;

  private ensureContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    // Master Gain
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.masterGain = master;

    // Generate 4 seconds of rich pink-ish noise buffer
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const output = noiseBuffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
    }

    // Rain Noise Layer
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1100;
    rainFilter.Q.value = 0.55;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.4;

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(master);
    rainSource.start();

    this.rainFilter = rainFilter;
    this.rainGain = rainGain;

    // Wind Whoosh Layer
    const windSource = ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 320;
    windFilter.Q.value = 2.4;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.12;

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    windSource.start();

    this.windFilter = windFilter;
    this.windGain = windGain;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0.65, this.ctx.currentTime, 0.25);
      }
      this.startDripLoop();
    } else {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      }
      this.stopDripLoop();
    }
    this.applyParameters();
  }

  public update(profile: SoundProfile, intensity: number, wind: number, isPlaying: boolean) {
    this.currentProfile = profile;
    this.currentIntensity = intensity;
    this.currentWind = wind;

    if (!this.ctx || !this.masterGain) return;
    const targetMaster = this.isEnabled && isPlaying ? 0.65 : 0;
    this.masterGain.gain.setTargetAtTime(targetMaster, this.ctx.currentTime, 0.2);
    this.applyParameters();
  }

  private applyParameters() {
    if (!this.ctx || !this.rainFilter || !this.rainGain || !this.windFilter || !this.windGain) return;
    const now = this.ctx.currentTime;

    let freq = 1100;
    let q = 0.55;
    let rainVol = 0.35 * (0.3 + this.currentIntensity * 0.9);

    switch (this.currentProfile) {
      case 'soft-mist':
        freq = 2200;
        q = 0.7;
        rainVol *= 0.45;
        break;
      case 'light-patter':
        freq = 1650;
        q = 0.65;
        rainVol *= 0.62;
        break;
      case 'steady-rain':
        freq = 1200;
        q = 0.5;
        rainVol *= 0.85;
        break;
      case 'heavy-downpour':
        freq = 820;
        q = 0.38;
        rainVol *= 1.25;
        break;
      case 'thunder-storm':
        freq = 720;
        q = 0.35;
        rainVol *= 1.3;
        break;
      case 'hail-clatter':
        freq = 2400;
        q = 0.9;
        rainVol *= 1.0;
        break;
      case 'rooftop-drip':
        freq = 1400;
        q = 0.8;
        rainVol *= 0.5;
        break;
      case 'wind-howl':
        freq = 950;
        q = 0.45;
        rainVol *= 0.95;
        break;
      case 'crystalline':
        freq = 2600;
        q = 1.1;
        rainVol *= 0.65;
        break;
    }

    this.rainFilter.frequency.setTargetAtTime(freq, now, 0.3);
    this.rainFilter.Q.setTargetAtTime(q, now, 0.3);
    this.rainGain.gain.setTargetAtTime(Math.min(0.95, rainVol), now, 0.3);

    const windAbs = Math.abs(this.currentWind);
    const windFreq = 220 + windAbs * 520;
    const windVol = (this.currentProfile === 'wind-howl' ? 0.28 : 0.14) * (0.15 + windAbs * 1.15);
    this.windFilter.frequency.setTargetAtTime(windFreq, now, 0.35);
    this.windGain.gain.setTargetAtTime(Math.min(0.65, windVol), now, 0.35);
  }

  public triggerThunder(strength = 0.8) {
    if (!this.isEnabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Low rumble oscillator + filtered noise burst
    const duration = 2.4 + strength * 1.6;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.04 * white) / 1.04;
      data[i] = lastOut * 3.5;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(190, now);
    filter.frequency.exponentialRampToValueAtTime(58, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.55 * strength, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  private playDripPing() {
    if (!this.isEnabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = this.currentProfile === 'crystalline' ? 1400 : 720;
    const freq = baseFreq + Math.random() * 680;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + 0.065);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  private startDripLoop() {
    if (this.dripInterval !== null) return;
    this.dripInterval = window.setInterval(() => {
      if (!this.isEnabled) return;
      if (
        this.currentProfile === 'rooftop-drip' ||
        this.currentProfile === 'crystalline' ||
        this.currentProfile === 'light-patter'
      ) {
        if (Math.random() < 0.6) {
          this.playDripPing();
        }
      }
    }, 340);
  }

  private stopDripLoop() {
    if (this.dripInterval !== null) {
      clearInterval(this.dripInterval);
      this.dripInterval = null;
    }
  }
}

export const audioEngine = new RainAudioEngine();
