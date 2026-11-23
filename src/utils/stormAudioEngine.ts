export type StormPhase =
  | 'calm'
  | 'warning'
  | 'formation'
  | 'approach'
  | 'impact'
  | 'aftermath'
  | 'ending';

class StormAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isEnabled = false;
  private lastShatterAt = -1;

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

    // 4-second stereo pink/brown noise buffer
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const out = noiseBuffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.96300 * b1 + w * 0.2965164;
        b2 = 0.57000 * b2 + w * 1.0526913;
        out[i] = (b0 + b1 + b2 + w * 0.1848) * 0.14;
        b3 = w * 0.115926;
        void b3;
      }
    }

    // Wind layer
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = noiseBuffer;
    windSrc.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 340;
    windFilter.Q.value = 2.0;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.12;
    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    windSrc.start();
    this.windFilter = windFilter;
    this.windGain = windGain;

    // Sub-bass Tornado Rumble layer
    const rumbleSrc = ctx.createBufferSource();
    rumbleSrc.buffer = noiseBuffer;
    rumbleSrc.loop = true;
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 95;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0;
    rumbleSrc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(master);
    rumbleSrc.start();
    this.rumbleFilter = rumbleFilter;
    this.rumbleGain = rumbleGain;

    // Distant Civil Storm Siren (dual detuned sawtooth/triangle through lowpass)
    const sirenFilter = ctx.createBiquadFilter();
    sirenFilter.type = 'lowpass';
    sirenFilter.frequency.value = 900;
    const sirenGain = ctx.createGain();
    sirenGain.gain.value = 0;
    sirenFilter.connect(sirenGain);
    sirenGain.connect(master);

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = 392;
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 395;
    osc1.connect(sirenFilter);
    osc2.connect(sirenFilter);
    osc1.start();
    osc2.start();

    this.sirenOsc1 = osc1;
    this.sirenOsc2 = osc2;
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
        this.masterGain.gain.setTargetAtTime(0.7, this.ctx.currentTime, 0.2);
      }
    } else if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    }
  }

  public updateTimeline(t: number, phase: StormPhase, isPlaying: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (!this.isEnabled || !isPlaying) {
      this.masterGain.gain.setTargetAtTime(0, now, 0.15);
      return;
    }

    this.masterGain.gain.setTargetAtTime(0.72, now, 0.18);

    // Escalation factor 0..1 across calm -> impact
    let windVol = 0.14;
    let windFreq = 420;
    let rumbleVol = 0.02;
    let sirenVol = 0;

    if (phase === 'calm') {
      windVol = 0.14;
      windFreq = 520;
      rumbleVol = 0.02;
    } else if (phase === 'warning') {
      const p = (t - 3) / 3;
      windVol = 0.18 + p * 0.22;
      windFreq = 480 + p * 260;
      rumbleVol = 0.08 + p * 0.18;
      sirenVol = 0.045 * Math.sin(p * Math.PI);
    } else if (phase === 'formation') {
      const p = (t - 6) / 4;
      windVol = 0.4 + p * 0.22;
      windFreq = 680 + p * 220;
      rumbleVol = 0.26 + p * 0.28;
      sirenVol = 0.055 * (0.5 + 0.5 * Math.sin(t * 1.4));
    } else if (phase === 'approach') {
      const p = (t - 10) / 6;
      windVol = 0.62 + p * 0.28;
      windFreq = 860 + p * 450;
      rumbleVol = 0.54 + p * 0.36;
      sirenVol = 0.03 * (1 - p);
    } else if (phase === 'impact') {
      windVol = 0.92;
      windFreq = 1280;
      rumbleVol = 0.95;
      sirenVol = 0;
    } else {
      // aftermath / ending
      windVol = 0.08;
      windFreq = 320;
      rumbleVol = 0.01;
      sirenVol = 0;
    }

    this.windGain?.gain.setTargetAtTime(windVol, now, 0.15);
    this.windFilter?.frequency.setTargetAtTime(windFreq, now, 0.15);
    this.rumbleGain?.gain.setTargetAtTime(rumbleVol, now, 0.15);
    this.rumbleFilter?.frequency.setTargetAtTime(phase === 'impact' ? 160 : 95, now, 0.2);

    if (this.sirenOsc1 && this.sirenOsc2 && this.sirenGain) {
      const wail = 360 + Math.sin(t * 1.1) * 95;
      this.sirenOsc1.frequency.setTargetAtTime(wail, now, 0.1);
      this.sirenOsc2.frequency.setTargetAtTime(wail * 1.008, now, 0.1);
      this.sirenGain.gain.setTargetAtTime(sirenVol, now, 0.12);
    }

    // Trigger glass shatter burst around impact (t ~ 18.2s)
    if (phase === 'impact' && t >= 18.1 && t <= 18.6 && Math.abs(t - this.lastShatterAt) > 3) {
      this.lastShatterAt = t;
      this.triggerGlassShatter();
    }
  }

  public triggerGlassShatter() {
    if (!this.isEnabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // High-frequency noise burst + crystalline shard pings
    const dur = 0.65;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2600;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(hp);
    hp.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);

    // 5 high metallic shard tinkles
    for (let k = 0; k < 5; k++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 2400 + Math.random() * 3400;
      const start = now + k * 0.045;
      g.gain.setValueAtTime(0.07, start);
      g.gain.exponentialRampToValueAtTime(0.0005, start + 0.22);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.24);
    }
  }

  public resetTriggers() {
    this.lastShatterAt = -1;
  }
}

export const stormAudioEngine = new StormAudioEngine();
