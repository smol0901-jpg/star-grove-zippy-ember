const IN = 18;
const HID = 16;
const OUT = 8;
const BRAIN_KEY = "aegis-brain-v1";

function tanh(x: number) {
  return Math.tanh(x);
}

function dtanh(y: number) {
  return 1 - y * y;
}

function randn() {
  return (Math.random() * 2 - 1) * 0.22;
}

export class Brain {
  w1 = new Float32Array(IN * HID);
  b1 = new Float32Array(HID);
  w2 = new Float32Array(HID * OUT);
  b2 = new Float32Array(OUT);
  epoch = 0;
  avgReward = 0;

  constructor() {
    for (let i = 0; i < this.w1.length; i++) this.w1[i] = randn();
    for (let i = 0; i < this.w2.length; i++) this.w2[i] = randn();
  }

  forward(x: number[], hid = new Float32Array(HID), out = new Float32Array(OUT)) {
    for (let j = 0; j < HID; j++) {
      let s = this.b1[j]!;
      for (let i = 0; i < IN; i++) s += x[i]! * this.w1[i * HID + j]!;
      hid[j] = tanh(s);
    }
    for (let k = 0; k < OUT; k++) {
      let s = this.b2[k]!;
      for (let j = 0; j < HID; j++) s += hid[j]! * this.w2[j * OUT + k]!;
      out[k] = tanh(s);
    }
    return { hid, out };
  }

  /** Reward-weighted imitation of a teacher action vector in [-1,1]. */
  train(x: number[], target: number[], reward: number, lr = 0.012) {
    const { hid, out } = this.forward(x);
    const scale = Math.max(-1.2, Math.min(1.2, reward));
    const dOut = new Float32Array(OUT);
    for (let k = 0; k < OUT; k++) {
      const err = (target[k]! - out[k]!) * scale;
      dOut[k] = err * dtanh(out[k]!);
    }
    const dHid = new Float32Array(HID);
    for (let j = 0; j < HID; j++) {
      let s = 0;
      for (let k = 0; k < OUT; k++) {
        s += dOut[k]! * this.w2[j * OUT + k]!;
        this.w2[j * OUT + k]! += lr * hid[j]! * dOut[k]!;
      }
      this.b2;
      dHid[j] = s * dtanh(hid[j]!);
    }
    for (let k = 0; k < OUT; k++) this.b2[k]! += lr * dOut[k]!;
    for (let i = 0; i < IN; i++) {
      for (let j = 0; j < HID; j++) {
        this.w1[i * HID + j]! += lr * x[i]! * dHid[j]!;
      }
    }
    for (let j = 0; j < HID; j++) this.b1[j]! += lr * dHid[j]!;
    this.epoch += 1;
    this.avgReward = this.avgReward * 0.995 + reward * 0.005;
  }

  save() {
    try {
      localStorage.setItem(
        BRAIN_KEY,
        JSON.stringify({
          w1: Array.from(this.w1),
          b1: Array.from(this.b1),
          w2: Array.from(this.w2),
          b2: Array.from(this.b2),
          epoch: this.epoch,
          avgReward: this.avgReward,
        }),
      );
    } catch {
      /* ignore */
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(BRAIN_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw) as {
        w1: number[];
        b1: number[];
        w2: number[];
        b2: number[];
        epoch: number;
        avgReward: number;
      };
      if (s.w1?.length !== this.w1.length || s.w2?.length !== this.w2.length) return false;
      this.w1.set(s.w1);
      this.b1.set(s.b1);
      this.w2.set(s.w2);
      this.b2.set(s.b2);
      this.epoch = s.epoch ?? 0;
      this.avgReward = s.avgReward ?? 0;
      return true;
    } catch {
      return false;
    }
  }
}

export const BRAIN_IN = IN;
export const BRAIN_OUT = OUT;
