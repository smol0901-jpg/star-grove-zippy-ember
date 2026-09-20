export interface Actions {
  thrust: number;
  steer: number;
  fire: boolean;
  missile: boolean;
  boost: boolean;
  justMissile: boolean;
  justFire: boolean;
  justBoost: boolean;
}

const GAME_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "ShiftLeft",
  "ShiftRight",
  "KeyF",
  "KeyE",
  "KeyB",
  "Escape",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
]);

function radialDeadzone(x: number, y: number, dz = 0.15) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export class Input {
  keys = new Set<string>();
  override: Set<string> | null = null;
  steerOverride: number | null = null;
  touchSteer = 0;
  touchThrust = 0;
  touchFire = false;
  touchMissile = false;
  touchBoost = false;
  stickActive = false;
  pointerId: number | null = null;
  prevFire = false;
  prevMissile = false;
  prevBoost = false;
  just = { fire: false, missile: false, boost: false, shop: false, pause: false, cmd: "" as string };
  edgeKeys = new Set<string>();
  mutedButtons = false;

  constructor() {
    this.onDown = this.onDown.bind(this);
    this.onUp = this.onUp.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  attach() {
    window.addEventListener("keydown", this.onDown);
    window.addEventListener("keyup", this.onUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onBlur);
  }

  detach() {
    window.removeEventListener("keydown", this.onDown);
    window.removeEventListener("keyup", this.onUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onBlur);
  }

  onDown(e: KeyboardEvent) {
    if (e.repeat) {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      return;
    }
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    this.keys.add(e.code);
    this.edgeKeys.add(e.code);
  }

  onUp(e: KeyboardEvent) {
    this.keys.delete(e.code);
  }

  onBlur() {
    if (this.override) return;
    this.keys.clear();
    this.touchFire = false;
    this.touchMissile = false;
    this.touchBoost = false;
  }

  setKeys(codes: string[]) {
    if (codes.length === 0) {
      this.override = null;
      this.keys.clear();
      return;
    }
    this.override = new Set(codes);
  }

  setSteer(v: number) {
    this.steerOverride = v;
  }

  consumeEdges() {
    const shop = this.edgeKeys.has("KeyE") || this.edgeKeys.has("KeyB");
    const pause = this.edgeKeys.has("Escape");
    let cmd = "";
    if (this.edgeKeys.has("Digit1")) cmd = "follow";
    else if (this.edgeKeys.has("Digit2")) cmd = "defend";
    else if (this.edgeKeys.has("Digit3")) cmd = "hunt";
    else if (this.edgeKeys.has("Digit4")) cmd = "capture";
    else if (this.edgeKeys.has("Digit5")) cmd = "hold";
    this.edgeKeys.clear();
    return { shop, pause, cmd };
  }

  sample(): Actions {
    const src = this.override ?? this.keys;
    let steer = 0;
    let thrust = 0;
    if (src.has("KeyA") || src.has("ArrowLeft")) steer += 1;
    if (src.has("KeyD") || src.has("ArrowRight")) steer -= 1;
    if (src.has("KeyW") || src.has("ArrowUp")) thrust += 1;
    if (src.has("KeyS") || src.has("ArrowDown")) thrust -= 1;

    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
    if (pads) {
      for (const p of pads) {
        if (!p || p.mapping !== "standard") continue;
        const st = radialDeadzone(p.axes[0] ?? 0, p.axes[1] ?? 0);
        steer += -st.x;
        thrust += -st.y;
        if (p.buttons[0]?.pressed) this.touchFire = true;
        if (p.buttons[5]?.pressed || p.buttons[7]?.pressed) this.touchMissile = true;
        if (p.buttons[1]?.pressed) this.touchBoost = true;
      }
    }

    steer += this.touchSteer;
    thrust += this.touchThrust;
    if (this.steerOverride != null) steer = this.steerOverride;

    steer = Math.max(-1, Math.min(1, steer));
    thrust = Math.max(-1, Math.min(1, thrust));

    const fire = src.has("Space") || this.touchFire;
    const missile = src.has("KeyF") || this.touchMissile;
    const boost = src.has("ShiftLeft") || src.has("ShiftRight") || this.touchBoost;

    const justFire = fire && !this.prevFire;
    const justMissile = missile && !this.prevMissile;
    const justBoost = boost && !this.prevBoost;
    this.prevFire = fire;
    this.prevMissile = missile;
    this.prevBoost = boost;

    return { thrust, steer, fire, missile, boost, justFire, justMissile, justBoost };
  }
}
