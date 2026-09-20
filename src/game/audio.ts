export class AudioBus {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  muted = false;
  unlocked = false;

  unlock() {
    if (this.unlocked && this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC({ latencyHint: "interactive" });
    this.master = this.ctx.createGain();
    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = 0.22;
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.sfx.connect(this.master);
    this.master.connect(this.ctx.destination);
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.unlocked = true;
  }

  setMuted(v: boolean) {
    this.muted = v;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(v ? 0 : 0.8, this.ctx.currentTime, 0.02);
    }
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain = 0.12, slide = 0) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.sfx);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  private noise(dur: number, gain = 0.1, hp = 400) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const n = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfx);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  shoot() {
    this.tone(420 + Math.random() * 80, 0.07, "square", 0.05);
    this.noise(0.04, 0.05, 900);
  }

  missile() {
    this.tone(180, 0.28, "sawtooth", 0.07, 420);
  }

  hit() {
    this.tone(140 + Math.random() * 40, 0.08, "triangle", 0.08, -80);
    this.noise(0.06, 0.08, 200);
  }

  explode() {
    this.noise(0.28, 0.16, 120);
    this.tone(90, 0.32, "sine", 0.12, -50);
  }

  boost() {
    this.tone(220, 0.2, "sawtooth", 0.06, 280);
  }

  capture() {
    this.tone(330, 0.18, "sine", 0.08);
    this.tone(495, 0.22, "sine", 0.05);
  }

  buy() {
    this.tone(520, 0.1, "square", 0.05);
    this.tone(780, 0.14, "square", 0.04);
  }

  deny() {
    this.tone(110, 0.12, "square", 0.06, -20);
  }

  pickup() {
    this.tone(660, 0.1, "sine", 0.06, 120);
  }

  alarm() {
    this.tone(240, 0.16, "square", 0.05);
  }
}
