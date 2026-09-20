import * as THREE from "three";
import { AudioBus } from "./audio";
import { Input } from "./input";
import { makeMaterials, makePlanetTexture, makeShip, makeStarfield, type MatLib } from "./meshes";
import { pushHud } from "./store";
import {
  COMMAND_LABEL,
  KIND_LABEL,
  PRICES,
  type Command,
  type Faction,
  type HudSnapshot,
  type MiniMark,
  type Phase,
  type ShipKind,
  type ShopId,
  type Toast,
} from "./types";

const STEP = 1 / 60;
const WORLD = 210;
const SAVE_KEY = "aegis-hold-v1";

function angNorm(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function turnToward(yaw: number, want: number, rate: number, dt: number) {
  const d = angNorm(want - yaw);
  const m = rate * dt;
  if (d > m) return yaw + m;
  if (d < -m) return yaw - m;
  return yaw + d;
}

function yawTo(dx: number, dz: number) {
  return Math.atan2(-dx, -dz);
}

type Bolt = {
  live: boolean;
  x: number;
  z: number;
  y: number;
  vx: number;
  vz: number;
  life: number;
  dmg: number;
  faction: Faction;
  mesh: THREE.Mesh;
};

type Missile = {
  live: boolean;
  x: number;
  z: number;
  y: number;
  yaw: number;
  speed: number;
  life: number;
  dmg: number;
  faction: Faction;
  target: number;
  mesh: THREE.Group;
};

type Puff = {
  live: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  size: number;
  mesh: THREE.Mesh;
};

type Pickup = {
  live: boolean;
  x: number;
  z: number;
  kind: "repair" | "ammo" | "cash";
  life: number;
  mesh: THREE.Mesh;
};

type Ship = {
  id: number;
  kind: ShipKind;
  faction: Faction;
  x: number;
  z: number;
  y: number;
  yaw: number;
  speed: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldWait: number;
  radius: number;
  fireCd: number;
  missileCd: number;
  command: Command;
  targetId: number;
  patrolId: number;
  holdX: number;
  holdZ: number;
  flash: number;
  iFrame: number;
  bank: number;
  alive: boolean;
  mesh: THREE.Group;
  blob: THREE.Mesh;
};

type Planet = {
  id: number;
  name: string;
  x: number;
  z: number;
  r: number;
  owner: Faction;
  capture: number;
  income: number;
  mesh: THREE.Group;
  ring: THREE.Mesh;
  station: THREE.Mesh;
};

type Rock = {
  x: number;
  z: number;
  r: number;
  hp: number;
  spin: number;
};

const PLANET_DEF: { name: string; r: number; income: number; base: string; accent: string }[] = [
  { name: "АСТРЕЯ", r: 16, income: 9, base: "#6d7a86", accent: "#b7c4ce" },
  { name: "РИГЕЛЬ", r: 13, income: 6, base: "#5c6b62", accent: "#9aada0" },
  { name: "НОВА", r: 15, income: 8, base: "#6a6460", accent: "#c4b4a8" },
  { name: "ИКАР", r: 11, income: 5, base: "#4e5864", accent: "#8aa0b4" },
  { name: "ГЕЛИОС", r: 18, income: 11, base: "#7a7068", accent: "#d2c6b8" },
  { name: "КЕФ", r: 12, income: 6, base: "#585e6a", accent: "#9aa8b8" },
];

export class Game {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  input = new Input();
  audio = new AudioBus();
  mats: MatLib;
  ships: Ship[] = [];
  planets: Planet[] = [];
  bolts: Bolt[] = [];
  missiles: Missile[] = [];
  puffs: Puff[] = [];
  pickups: Pickup[] = [];
  rocks: Rock[] = [];
  rockMesh: THREE.InstancedMesh;
  dummy = new THREE.Object3D();
  nextId = 1;
  toastId = 1;
  toasts: Toast[] = [];
  phase: Phase = "menu";
  credits = 220;
  score = 0;
  kills = 0;
  time = 0;
  wave = 1;
  waveT = 0;
  command: Command = "follow";
  missilesAmmo = 8;
  maxMissiles = 8;
  boost = 1;
  hullLevel = 1;
  cannonLevel = 1;
  trauma = 0;
  hudAcc = 0;
  acc = 0;
  raf = 0;
  last = 0;
  running = false;
  muted = false;
  highScore = 0;
  reduced = false;
  cam = new THREE.Vector3(0, 28, 42);
  look = new THREE.Vector3();
  tmp = new THREE.Vector3();
  tmp2 = new THREE.Vector3();
  grid: THREE.GridHelper;
  disposed = false;
  lockName = "";
  lockDist = 0;
  capturing = "";
  captureProgress = 0;
  nearBase = false;
  incomeAcc = 0;
  maxAllies = 6;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090d);
    this.scene.fog = new THREE.FogExp2(0x07090d, 0.011);
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 900);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.mats = makeMaterials();

    const hemi = new THREE.HemisphereLight(0xc4d0dc, 0x141820, 1.2);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xeef2f6, 1.35);
    key.position.set(40, 70, 18);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x7ea8b8, 0.35);
    rim.position.set(-30, 20, -40);
    this.scene.add(rim);

    this.grid = new THREE.GridHelper(WORLD * 2.2, 28, 0x1c2430, 0x141920);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.35;
    this.scene.add(this.grid);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD * 2.4, WORLD * 2.4),
      new THREE.MeshStandardMaterial({ color: 0x0c1016, metalness: 0.1, roughness: 0.92 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.04;
    this.scene.add(floor);

    this.scene.add(makeStarfield(1100));

    const rockGeo = new THREE.IcosahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x3a414c, roughness: 0.82, metalness: 0.2, flatShading: true });
    this.rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, 36);
    this.scene.add(this.rockMesh);

    this.buildPools();
    this.buildPlanets();
    this.scatterRocks();
    this.spawnPlayer(true);
    this.resize();
    this.input.attach();
    window.addEventListener("resize", this.onResize);

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as { highScore?: number };
        this.highScore = s.highScore ?? 0;
      }
    } catch {
      /* ignore */
    }

    this.wireProbe();
    this.publish();
  }

  onResize = () => this.resize();

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  buildPools() {
    const boltGeo = new THREE.BoxGeometry(0.12, 0.12, 1.1);
    for (let i = 0; i < 90; i++) {
      const mesh = new THREE.Mesh(boltGeo, this.mats.boltP);
      mesh.visible = false;
      this.scene.add(mesh);
      this.bolts.push({ live: false, x: 0, z: 0, y: 1, vx: 0, vz: 0, life: 0, dmg: 0, faction: "player", mesh });
    }
    for (let i = 0; i < 18; i++) {
      const mesh = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.9, 5), this.mats.missile);
      body.rotation.x = Math.PI / 2;
      mesh.add(body);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.22), this.mats.metal);
      fin.position.z = -0.2;
      mesh.add(fin);
      mesh.visible = false;
      this.scene.add(mesh);
      this.missiles.push({ live: false, x: 0, z: 0, y: 1.2, yaw: 0, speed: 0, life: 0, dmg: 0, faction: "player", target: -1, mesh });
    }
    const pGeo = new THREE.SphereGeometry(1, 6, 4);
    for (let i = 0; i < 70; i++) {
      const mesh = new THREE.Mesh(pGeo, this.mats.particle.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.puffs.push({ live: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 1, mesh });
    }
    const pkGeo = new THREE.OctahedronGeometry(0.55, 0);
    for (let i = 0; i < 12; i++) {
      const mesh = new THREE.Mesh(pkGeo, this.mats.glass);
      mesh.visible = false;
      this.scene.add(mesh);
      this.pickups.push({ live: false, x: 0, z: 0, kind: "cash", life: 0, mesh });
    }
  }

  buildPlanets() {
    const hex = PLANET_DEF.length;
    for (let i = 0; i < hex; i++) {
      const def = PLANET_DEF[i]!;
      const a = (i / hex) * Math.PI * 2 - Math.PI / 2;
      const dist = 88 + (i % 2) * 18;
      const x = Math.cos(a) * dist;
      const z = Math.sin(a) * dist;
      const g = new THREE.Group();
      const tex = makePlanetTexture(110 + i * 97, def.base, def.accent);
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0.12 });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(def.r, 28, 18), mat);
      sphere.position.y = def.r * 0.35;
      g.add(sphere);
      if (i % 2 === 0) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(def.r * 1.25, def.r * 1.55, 36),
          new THREE.MeshStandardMaterial({ color: 0x8a949e, side: THREE.DoubleSide, transparent: true, opacity: 0.35, roughness: 0.6 }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = def.r * 0.35;
        g.add(ring);
      }
      const station = new THREE.Mesh(
        new THREE.TorusGeometry(def.r * 0.55, 0.35, 6, 18),
        this.mats.metal,
      );
      station.rotation.x = Math.PI / 2;
      station.position.y = 1.2;
      g.add(station);
      const cap = new THREE.Mesh(new THREE.RingGeometry(def.r + 6, def.r + 7.2, 48), this.mats.ringN);
      cap.rotation.x = Math.PI / 2;
      cap.position.y = 0.08;
      g.add(cap);
      g.position.set(x, 0, z);
      this.scene.add(g);
      let owner: Faction = "enemy";
      if (i === 0) owner = "player";
      else if (i === 1 || i === 5) owner = "neutral";
      this.planets.push({
        id: i,
        name: def.name,
        x,
        z,
        r: def.r,
        owner,
        capture: owner === "neutral" ? 0 : owner === "player" ? 1 : -1,
        income: def.income,
        mesh: g,
        ring: cap,
        station,
      });
      this.tintPlanet(this.planets[i]!);
    }
  }

  tintPlanet(p: Planet) {
    p.ring.material =
      p.owner === "player" ? this.mats.ringP : p.owner === "enemy" ? this.mats.ringE : this.mats.ringN;
  }

  scatterRocks() {
    this.rocks = [];
    for (let i = 0; i < 36; i++) {
      let x = 0;
      let z = 0;
      let ok = false;
      for (let t = 0; t < 12 && !ok; t++) {
        x = (Math.random() * 2 - 1) * (WORLD - 20);
        z = (Math.random() * 2 - 1) * (WORLD - 20);
        ok = this.planets.every((p) => Math.hypot(p.x - x, p.z - z) > p.r + 14) && Math.hypot(x, z) > 22;
      }
      const r = 1.2 + Math.random() * 2.4;
      this.rocks.push({ x, z, r, hp: 28 + r * 10, spin: (Math.random() - 0.5) * 0.4 });
      this.dummy.position.set(x, r * 0.6, z);
      this.dummy.rotation.set(Math.random(), Math.random(), Math.random());
      this.dummy.scale.setScalar(r);
      this.dummy.updateMatrix();
      this.rockMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.rockMesh.instanceMatrix.needsUpdate = true;
  }

  spawnPlayer(keepCredits: boolean) {
    for (const s of this.ships) this.retire(s);
    this.ships = [];
    const player = this.makeShip("player", "player", 0, 36, 0);
    player.maxHp = 260 + this.hullLevel * 40;
    player.hp = player.maxHp;
    player.maxShield = 160 + this.hullLevel * 20;
    player.shield = player.maxShield;
    player.radius = 1.6;
    this.ships.push(player);
    if (!keepCredits) {
      this.credits = 220;
      this.hullLevel = 1;
      this.cannonLevel = 1;
    }
    this.missilesAmmo = this.maxMissiles;
    this.boost = 1;
    this.command = "follow";
    this.kills = 0;
    this.score = 0;
    this.time = 0;
    this.wave = 1;
    this.waveT = 0;
    this.incomeAcc = 0;
    for (const b of this.bolts) this.killBolt(b);
    for (const m of this.missiles) this.killMissile(m);
    for (const p of this.pickups) {
      p.live = false;
      p.mesh.visible = false;
    }
  }

  makeShip(kind: ShipKind, faction: Faction, x: number, z: number, yaw: number): Ship {
    const mesh = makeShip(kind, this.mats);
    this.scene.add(mesh);
    const blob = new THREE.Mesh(new THREE.CircleGeometry(1.4, 12), this.mats.blob);
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.05;
    this.scene.add(blob);
    const stats = this.kindStats(kind);
    const s: Ship = {
      id: this.nextId++,
      kind,
      faction,
      x,
      z,
      y: 1.15,
      yaw,
      speed: 0,
      hp: stats.hp,
      maxHp: stats.hp,
      shield: stats.shield,
      maxShield: stats.shield,
      shieldWait: 0,
      radius: stats.r,
      fireCd: 0.4 + Math.random() * 0.4,
      missileCd: 2 + Math.random(),
      command: "follow",
      targetId: -1,
      patrolId: (Math.random() * this.planets.length) | 0,
      holdX: x,
      holdZ: z,
      flash: 0,
      iFrame: 0,
      bank: 0,
      alive: true,
      mesh,
      blob,
    };
    return s;
  }

  kindStats(kind: ShipKind) {
    switch (kind) {
      case "player":
        return { hp: 280, shield: 180, r: 1.6, max: 42, turn: 2.5 };
      case "escort":
        return { hp: 90, shield: 40, r: 1.15, max: 34, turn: 2.6 };
      case "interceptor":
        return { hp: 70, shield: 24, r: 1.05, max: 44, turn: 3.1 };
      case "bomber":
        return { hp: 120, shield: 30, r: 1.4, max: 28, turn: 1.8 };
      case "hunter":
        return { hp: 80, shield: 20, r: 1.2, max: 32, turn: 2.2 };
      case "elite":
        return { hp: 160, shield: 50, r: 1.55, max: 30, turn: 1.9 };
      default:
        return { hp: 100, shield: 40, r: 1.3, max: 18, turn: 1.6 };
    }
  }

  retire(s: Ship) {
    s.alive = false;
    s.mesh.visible = false;
    s.blob.visible = false;
    this.scene.remove(s.mesh);
    this.scene.remove(s.blob);
  }

  player(): Ship | undefined {
    return this.ships.find((s) => s.kind === "player" && s.alive);
  }

  beginRun() {
    this.audio.unlock();
    this.spawnPlayer(false);
    for (const p of this.planets) {
      if (p.id === 0) {
        p.owner = "player";
        p.capture = 1;
      } else if (p.id === 1 || p.id === 5) {
        p.owner = "neutral";
        p.capture = 0;
      } else {
        p.owner = "enemy";
        p.capture = -1;
      }
      this.tintPlanet(p);
    }
    this.scatterRocks();
    this.seedFoes();
    const me = this.player();
    if (me) {
      const ally = this.makeShip("escort", "player", me.x + 4, me.z + 2, me.yaw);
      ally.command = "follow";
      this.ships.push(ally);
    }
    this.phase = "play";
    this.toast("ЭСКАДРА В СИСТЕМЕ", "info");
    this.toast("1–4 ПРИКАЗЫ  ·  E АНГАР", "info");
    this.publish();
  }

  seedFoes() {
    for (const p of this.planets) {
      if (p.owner !== "enemy") continue;
      const n = p.id === 4 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const h = this.makeShip("hunter", "enemy", p.x + Math.cos(a) * (p.r + 10), p.z + Math.sin(a) * (p.r + 10), a);
        h.patrolId = p.id;
        this.ships.push(h);
      }
      const g = this.makeShip("guard", "enemy", p.x + p.r + 8, p.z, 0);
      g.patrolId = p.id;
      g.command = "defend";
      this.ships.push(g);
    }
    const elite = this.makeShip("elite", "enemy", -70, -80, 0.4);
    elite.patrolId = 4;
    this.ships.push(elite);
  }

  setPaused(v: boolean) {
    if (this.phase === "dead" || this.phase === "menu") return;
    if (v) this.phase = "pause";
    else this.phase = "play";
    this.publish();
  }

  setShop(v: boolean) {
    if (this.phase === "dead" || this.phase === "menu") return;
    this.phase = v ? "shop" : "play";
    this.publish();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.audio.setMuted(this.muted);
    this.publish();
  }

  setGlobalCommand(cmd: Command) {
    this.command = cmd;
    for (const s of this.ships) {
      if (s.alive && s.faction === "player" && s.kind !== "player") s.command = cmd;
    }
    this.toast(`ЭСКАДРА: ${COMMAND_LABEL[cmd]}`, "good");
  }

  setAllyCommand(id: number, cmd: Command) {
    const s = this.ships.find((x) => x.id === id);
    if (!s || s.faction !== "player") return;
    s.command = cmd;
    this.toast(`${KIND_LABEL[s.kind]}: ${COMMAND_LABEL[cmd]}`, "info");
  }

  allyCount() {
    return this.ships.filter((s) => s.alive && s.faction === "player" && s.kind !== "player").length;
  }

  buy(id: ShopId) {
    if (this.phase !== "shop" && this.phase !== "play" && this.phase !== "pause") return;
    const price = PRICES[id];
    const me = this.player();
    if (!me) return;
    if (this.credits < price) {
      this.audio.deny();
      this.toast("НЕ ХВАТАЕТ КРЕДИТОВ", "bad");
      return;
    }
    if ((id === "escort" || id === "interceptor" || id === "bomber") && this.allyCount() >= this.maxAllies) {
      this.audio.deny();
      this.toast("АНГАР ПОЛОН", "bad");
      return;
    }
    this.credits -= price;
    if (id === "escort" || id === "interceptor" || id === "bomber") {
      const a = Math.random() * Math.PI * 2;
      const s = this.makeShip(id, "player", me.x + Math.cos(a) * 5, me.z + Math.sin(a) * 5, me.yaw);
      s.command = this.command;
      this.ships.push(s);
      this.audio.buy();
      this.toast(`${KIND_LABEL[id]} ПРИНЯЛ КОМАНДУ`, "good");
    } else if (id === "missiles") {
      this.missilesAmmo = Math.min(this.maxMissiles, this.missilesAmmo + 4);
      this.audio.buy();
      this.toast("КАССЕТА РАКЕТ", "good");
    } else if (id === "repair") {
      me.hp = Math.min(me.maxHp, me.hp + 90);
      this.audio.buy();
      this.toast("КОРПУС ЗАЛАЗАН", "good");
    } else if (id === "overcharge") {
      me.shield = me.maxShield;
      me.iFrame = Math.max(me.iFrame, 0.6);
      this.audio.buy();
      this.toast("ЩИТ ПЕРЕЗАРЯЖЕН", "good");
    } else if (id === "hullUp") {
      this.hullLevel += 1;
      me.maxHp += 40;
      me.hp += 40;
      me.maxShield += 20;
      me.shield += 20;
      this.audio.buy();
      this.toast("БРОНЯ УСИЛЕНА", "good");
    } else if (id === "cannonUp") {
      this.cannonLevel += 1;
      this.audio.buy();
      this.toast("ОРУДИЯ КАЛИБРОВАНЫ", "good");
    }
    this.publish();
  }

  toast(text: string, kind: Toast["kind"]) {
    this.toasts.push({ id: this.toastId++, text, kind });
    if (this.toasts.length > 4) this.toasts.shift();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running || this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      let dt = (now - this.last) / 1000;
      this.last = now;
      dt = Math.min(dt, 0.1);
      this.acc += dt;
      let steps = 0;
      while (this.acc >= STEP && steps < 5) {
        this.step(STEP);
        this.acc -= STEP;
        steps++;
      }
      this.render(dt);
      this.hudAcc += dt;
      if (this.hudAcc > 0.08) {
        this.hudAcc = 0;
        this.publish();
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  step(dt: number) {
    const edges = this.input.consumeEdges();
    if (this.phase === "play") {
      if (edges.pause) this.setPaused(true);
      if (edges.shop) this.setShop(true);
      if (edges.cmd) this.setGlobalCommand(edges.cmd as Command);
    } else if (this.phase === "pause") {
      if (edges.pause) this.setPaused(false);
      if (edges.shop) this.setShop(true);
    } else if (this.phase === "shop") {
      if (edges.shop || edges.pause) this.setShop(false);
    }
    if (this.phase !== "play") return;

    this.time += dt;
    this.waveT += dt;
    this.incomeAcc += dt;
    this.trauma = Math.max(0, this.trauma - dt * 1.6);

    if (this.waveT > 42) {
      this.waveT = 0;
      this.wave += 1;
      this.spawnWave();
    }
    if (this.incomeAcc > 1) {
      this.incomeAcc = 0;
      let inc = 0;
      for (const p of this.planets) if (p.owner === "player") inc += p.income;
      this.credits += inc;
      this.score += inc;
    }

    const acts = this.input.sample();
    const me = this.player();
    if (!me) return;
    this.controlPlayer(me, acts, dt);
    this.updateShips(dt);
    this.updateBolts(dt);
    this.updateMissiles(dt);
    this.updatePuffs(dt);
    this.updatePickups(dt, me);
    this.updateCapture(dt, me);
    this.keepBounds();
    this.refillAtBase(me, dt);
    this.acquireLock(me);
    this.cullDead();
  }

  controlPlayer(me: Ship, acts: ReturnType<Input["sample"]>, dt: number) {
    const stats = this.kindStats("player");
    me.yaw += acts.steer * stats.turn * dt;
    const want = acts.thrust * stats.max * (acts.boost && this.boost > 0.08 ? 1.55 : 1);
    me.speed += (want - me.speed) * (1 - Math.exp(-4.2 * dt));
    const fx = -Math.sin(me.yaw);
    const fz = -Math.cos(me.yaw);
    me.x += fx * me.speed * dt;
    me.z += fz * me.speed * dt;
    me.bank += (acts.steer * 0.55 - me.bank) * (1 - Math.exp(-8 * dt));
    if (acts.boost && this.boost > 0.1) {
      this.boost = Math.max(0, this.boost - dt * 0.55);
      me.iFrame = Math.max(me.iFrame, 0.12);
      if (acts.justBoost) {
        this.audio.boost();
        me.iFrame = 0.55;
        this.burst(me.x, me.y, me.z, 0xc5d4de, 10, 8);
      }
    } else {
      this.boost = Math.min(1, this.boost + dt * 0.18);
    }
    if (acts.fire && me.fireCd <= 0) this.fireBolt(me);
    if (acts.justMissile) this.fireMissile(me);
  }

  updateShips(dt: number) {
    const me = this.player();
    for (const s of this.ships) {
      if (!s.alive) continue;
      s.fireCd = Math.max(0, s.fireCd - dt);
      s.missileCd = Math.max(0, s.missileCd - dt);
      s.flash = Math.max(0, s.flash - dt * 6);
      s.iFrame = Math.max(0, s.iFrame - dt);
      s.shieldWait = Math.max(0, s.shieldWait - dt);
      if (s.shieldWait <= 0 && s.shield < s.maxShield) s.shield = Math.min(s.maxShield, s.shield + dt * (s.kind === "player" ? 26 : 8));
      if (s.kind !== "player") this.think(s, dt, me);
      this.collideWorld(s);
      this.syncShip(s);
    }
    this.shipBumps();
  }

  think(s: Ship, dt: number, me: Ship | undefined) {
    const stats = this.kindStats(s.kind);
    let tx = s.x;
    let tz = s.z;
    let wantSpeed = stats.max * 0.7;
    let shoot = false;
    let missile = false;
    const hostile = s.faction === "enemy";

    if (hostile) {
      const threat = this.closest(s, "player");
      const distT = threat ? Math.hypot(threat.x - s.x, threat.z - s.z) : 999;
      if (s.kind === "guard") {
        const home = this.planets[s.patrolId] ?? this.planets[0]!;
        const a = this.time * 0.35 + s.id;
        tx = home.x + Math.cos(a) * (home.r + 11);
        tz = home.z + Math.sin(a) * (home.r + 11);
        wantSpeed = stats.max;
        if (threat && distT < 55) {
          tx = threat.x;
          tz = threat.z;
          shoot = distT < 38;
        }
      } else {
        if (threat && distT < (s.kind === "elite" ? 90 : 62)) {
          tx = threat.x;
          tz = threat.z;
          wantSpeed = stats.max;
          shoot = distT < 42;
          missile = s.kind === "elite" && distT < 55 && s.missileCd <= 0;
        } else {
          const p = this.planets[s.patrolId] ?? this.pickPlayerPlanet() ?? this.planets[0]!;
          tx = p.x;
          tz = p.z;
          if (Math.hypot(s.x - p.x, s.z - p.z) < p.r + 14) {
            s.patrolId = this.nextPatrol(s);
          }
        }
      }
    } else {
      const cmd = s.command;
      const foe = this.closest(s, "enemy");
      const fd = foe ? Math.hypot(foe.x - s.x, foe.z - s.z) : 999;
      if (cmd === "follow" && me) {
        const fx = -Math.sin(me.yaw);
        const fz = -Math.cos(me.yaw);
        const side = s.id % 2 === 0 ? 1 : -1;
        tx = me.x - fx * 7 + -fz * side * 4.5;
        tz = me.z - fz * 7 + fx * side * 4.5;
        wantSpeed = Math.max(stats.max * 0.4, me.speed * 1.05);
        if (foe && fd < 48) {
          tx = foe.x;
          tz = foe.z;
          shoot = fd < 36;
        }
      } else if (cmd === "defend") {
        const home = this.ownedPlanet() ?? this.planets[0]!;
        const a = this.time * 0.5 + s.id;
        tx = home.x + Math.cos(a) * (home.r + 12);
        tz = home.z + Math.sin(a) * (home.r + 12);
        if (foe && fd < 50) {
          tx = foe.x;
          tz = foe.z;
          shoot = fd < 38;
        }
      } else if (cmd === "hunt") {
        if (foe) {
          tx = foe.x;
          tz = foe.z;
          wantSpeed = stats.max;
          shoot = fd < 40;
          missile = s.kind === "interceptor" && fd < 48 && s.missileCd <= 0;
        } else {
          const p = this.planets.find((pl) => pl.owner === "enemy") ?? this.planets[2]!;
          tx = p.x;
          tz = p.z;
        }
      } else if (cmd === "capture") {
        const p = this.planets.find((pl) => pl.owner !== "player") ?? this.planets[0]!;
        tx = p.x;
        tz = p.z;
        wantSpeed = stats.max * 0.85;
        if (foe && fd < 32) {
          shoot = true;
          tx = foe.x;
          tz = foe.z;
        }
      } else {
        tx = s.holdX;
        tz = s.holdZ;
        wantSpeed = 8;
        if (foe && fd < 40) {
          shoot = fd < 34;
        }
      }
    }

    const wantYaw = yawTo(tx - s.x, tz - s.z);
    s.yaw = turnToward(s.yaw, wantYaw, stats.turn, dt);
    const dist = Math.hypot(tx - s.x, tz - s.z);
    const arrive = Math.max(0.2, Math.min(1, dist / 18));
    s.speed += (wantSpeed * arrive - s.speed) * (1 - Math.exp(-3.2 * dt));
    const fx = -Math.sin(s.yaw);
    const fz = -Math.cos(s.yaw);
    s.x += fx * s.speed * dt;
    s.z += fz * s.speed * dt;
    const steerVis = Math.max(-1, Math.min(1, angNorm(wantYaw - s.yaw) * 1.4));
    s.bank += (steerVis * 0.45 - s.bank) * (1 - Math.exp(-6 * dt));
    if (shoot && s.fireCd <= 0) this.fireBolt(s);
    if (missile) this.fireMissile(s);
  }

  nextPatrol(s: Ship) {
    if (Math.random() < 0.45) {
      const owned = this.planets.filter((p) => p.owner === "player");
      if (owned.length) return owned[(Math.random() * owned.length) | 0]!.id;
    }
    return (s.patrolId + 1 + ((Math.random() * 3) | 0)) % this.planets.length;
  }

  pickPlayerPlanet() {
    const list = this.planets.filter((p) => p.owner === "player");
    return list.length ? list[(Math.random() * list.length) | 0] : null;
  }

  ownedPlanet() {
    return this.planets.find((p) => p.owner === "player") ?? null;
  }

  closest(from: Ship, faction: Faction) {
    let best: Ship | null = null;
    let bestD = 1e9;
    for (const s of this.ships) {
      if (!s.alive || s.faction !== faction || s.id === from.id) continue;
      const d = (s.x - from.x) ** 2 + (s.z - from.z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  collideWorld(s: Ship) {
    for (const p of this.planets) {
      const d = Math.hypot(s.x - p.x, s.z - p.z);
      const min = p.r + s.radius * 0.4;
      if (d < min && d > 0.001) {
        const k = (min - d) / d;
        s.x += (s.x - p.x) * k;
        s.z += (s.z - p.z) * k;
        s.speed *= 0.7;
      }
    }
    for (let i = 0; i < this.rocks.length; i++) {
      const r = this.rocks[i]!;
      if (r.hp <= 0) continue;
      const d = Math.hypot(s.x - r.x, s.z - r.z);
      if (d < r.r + s.radius) {
        const k = (r.r + s.radius - d) / Math.max(0.001, d);
        s.x += (s.x - r.x) * k;
        s.z += (s.z - r.z) * k;
        s.speed *= 0.65;
        if (s.kind === "player") this.hurt(s, 4 * STEP * 18, false);
      }
    }
    s.x = Math.max(-WORLD, Math.min(WORLD, s.x));
    s.z = Math.max(-WORLD, Math.min(WORLD, s.z));
  }

  shipBumps() {
    for (let i = 0; i < this.ships.length; i++) {
      const a = this.ships[i]!;
      if (!a.alive) continue;
      for (let j = i + 1; j < this.ships.length; j++) {
        const b = this.ships[j]!;
        if (!b.alive) continue;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const d2 = dx * dx + dz * dz;
        const min = a.radius + b.radius;
        if (d2 < min * min && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const push = ((min - d) / d) * 0.5;
          a.x -= dx * push;
          a.z -= dz * push;
          b.x += dx * push;
          b.z += dz * push;
        }
      }
    }
  }

  fireBolt(s: Ship) {
    const stats = this.kindStats(s.kind);
    s.fireCd = s.kind === "player" ? Math.max(0.09, 0.16 - this.cannonLevel * 0.018) : s.kind === "interceptor" ? 0.18 : s.kind === "guard" ? 0.42 : 0.28;
    const bolt = this.bolts.find((b) => !b.live);
    if (!bolt) return;
    const fx = -Math.sin(s.yaw);
    const fz = -Math.cos(s.yaw);
    const spd = 78 + (s.kind === "player" ? 10 : 0);
    bolt.live = true;
    bolt.x = s.x + fx * (s.radius + 0.8);
    bolt.z = s.z + fz * (s.radius + 0.8);
    bolt.y = s.y;
    bolt.vx = fx * spd;
    bolt.vz = fz * spd;
    bolt.life = 1.15;
    bolt.dmg = s.kind === "player" ? 14 + this.cannonLevel * 3 : s.kind === "elite" ? 16 : s.kind === "bomber" ? 18 : 10;
    bolt.faction = s.faction;
    bolt.mesh.material = s.faction === "player" ? this.mats.boltP : this.mats.boltE;
    bolt.mesh.visible = true;
    if (s.kind === "player") this.audio.shoot();
  }

  fireMissile(s: Ship) {
    if (s.kind === "player") {
      if (this.missilesAmmo <= 0) {
        this.audio.deny();
        this.toast("РАКЕТЫ ПУСТЫ", "bad");
        return;
      }
      this.missilesAmmo -= 1;
    } else if (s.missileCd > 0) return;
    s.missileCd = s.kind === "player" ? 1.1 : 4.5;
    const m = this.missiles.find((x) => !x.live);
    if (!m) return;
    const foe = this.lockTarget(s) ?? this.closest(s, s.faction === "player" ? "enemy" : "player");
    m.live = true;
    m.x = s.x;
    m.z = s.z;
    m.y = s.y + 0.2;
    m.yaw = s.yaw;
    m.speed = 38;
    m.life = 3.6;
    m.dmg = s.kind === "player" ? 42 : 28;
    m.faction = s.faction;
    m.target = foe?.id ?? -1;
    m.mesh.visible = true;
    this.audio.missile();
  }

  lockTarget(s: Ship) {
    const fx = -Math.sin(s.yaw);
    const fz = -Math.cos(s.yaw);
    let best: Ship | null = null;
    let bestS = 0;
    for (const o of this.ships) {
      if (!o.alive || o.faction === s.faction) continue;
      const dx = o.x - s.x;
      const dz = o.z - s.z;
      const d = Math.hypot(dx, dz);
      if (d > 95 || d < 2) continue;
      const dot = (dx * fx + dz * fz) / d;
      if (dot < 0.45) continue;
      const score = dot * 40 + (95 - d);
      if (score > bestS) {
        bestS = score;
        best = o;
      }
    }
    return best;
  }

  acquireLock(me: Ship) {
    const t = this.lockTarget(me);
    if (t) {
      this.lockName = KIND_LABEL[t.kind];
      this.lockDist = Math.hypot(t.x - me.x, t.z - me.z);
    } else {
      this.lockName = "";
      this.lockDist = 0;
    }
  }

  updateBolts(dt: number) {
    for (const b of this.bolts) {
      if (!b.live) continue;
      b.life -= dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      if (b.life <= 0 || Math.abs(b.x) > WORLD + 8 || Math.abs(b.z) > WORLD + 8) {
        this.killBolt(b);
        continue;
      }
      let hit = false;
      for (const s of this.ships) {
        if (!s.alive || s.faction === b.faction) continue;
        const dx = s.x - b.x;
        const dz = s.z - b.z;
        if (dx * dx + dz * dz < (s.radius + 0.45) ** 2) {
          this.hurt(s, b.dmg, true);
          this.burst(b.x, b.y, b.z, b.faction === "player" ? 0xc5e4ee : 0xe8a8a0, 6, 7);
          this.killBolt(b);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      for (let i = 0; i < this.rocks.length; i++) {
        const r = this.rocks[i]!;
        if (r.hp <= 0) continue;
        if ((r.x - b.x) ** 2 + (r.z - b.z) ** 2 < (r.r + 0.4) ** 2) {
          r.hp -= b.dmg;
          this.killBolt(b);
          if (r.hp <= 0) this.breakRock(i);
          break;
        }
      }
      b.mesh.position.set(b.x, b.y, b.z);
      b.mesh.lookAt(b.x + b.vx, b.y, b.z + b.vz);
    }
  }

  updateMissiles(dt: number) {
    for (const m of this.missiles) {
      if (!m.live) continue;
      m.life -= dt;
      const tgt = this.ships.find((s) => s.id === m.target && s.alive);
      if (tgt) {
        const want = yawTo(tgt.x - m.x, tgt.z - m.z);
        m.yaw = turnToward(m.yaw, want, 3.4, dt);
      } else {
        const nt = this.closest({ x: m.x, z: m.z, id: -1, faction: m.faction } as Ship, m.faction === "player" ? "enemy" : "player");
        if (nt) m.target = nt.id;
      }
      m.speed = Math.min(64, m.speed + dt * 28);
      const fx = -Math.sin(m.yaw);
      const fz = -Math.cos(m.yaw);
      m.x += fx * m.speed * dt;
      m.z += fz * m.speed * dt;
      this.puff(m.x - fx * 0.6, m.y, m.z - fz * 0.6, 0.4, 0xa8c0cc);
      if (m.life <= 0) {
        this.explode(m.x, m.y, m.z, m.faction, m.dmg * 0.4, 4);
        this.killMissile(m);
        continue;
      }
      let boom = false;
      for (const s of this.ships) {
        if (!s.alive || s.faction === m.faction) continue;
        if ((s.x - m.x) ** 2 + (s.z - m.z) ** 2 < (s.radius + 1.1) ** 2) {
          this.explode(m.x, m.y, m.z, m.faction, m.dmg, 5.5);
          this.killMissile(m);
          boom = true;
          break;
        }
      }
      if (boom) continue;
      m.mesh.position.set(m.x, m.y, m.z);
      this.tmp.set(m.x + fx, m.y, m.z + fz);
      m.mesh.lookAt(this.tmp);
    }
  }

  explode(x: number, y: number, z: number, faction: Faction, dmg: number, radius: number) {
    this.burst(x, y, z, 0xdfe6ee, 16, 14);
    this.audio.explode();
    this.trauma = Math.min(1, this.trauma + 0.35);
    for (const s of this.ships) {
      if (!s.alive || s.faction === faction) continue;
      const d = Math.hypot(s.x - x, s.z - z);
      if (d < radius + s.radius) this.hurt(s, dmg * (1 - d / (radius + 4)), true);
    }
  }

  hurt(s: Ship, dmg: number, fromWeapon: boolean) {
    if (!s.alive || s.iFrame > 0) return;
    s.shieldWait = s.kind === "player" ? 2.6 : 3.4;
    let left = dmg;
    if (s.shield > 0) {
      const take = Math.min(s.shield, left);
      s.shield -= take;
      left -= take;
    }
    if (left > 0) s.hp -= left;
    s.flash = 1;
    if (fromWeapon && s.kind === "player") {
      this.trauma = Math.min(1, this.trauma + 0.18);
      this.audio.hit();
    }
    if (s.hp <= 0) this.killShip(s);
  }

  killShip(s: Ship) {
    if (!s.alive) return;
    s.alive = false;
    s.mesh.visible = false;
    s.blob.visible = false;
    this.burst(s.x, s.y, s.z, s.faction === "enemy" ? 0xe8a8a0 : 0xc5e4ee, 20, 16);
    this.audio.explode();
    this.trauma = Math.min(1, this.trauma + (s.kind === "player" ? 0.7 : 0.28));
    if (s.kind === "player") {
      this.phase = "dead";
      this.score += this.kills * 20 + this.planets.filter((p) => p.owner === "player").length * 80;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        try {
          localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, highScore: this.highScore }));
        } catch {
          /* ignore */
        }
      }
      this.toast("КОРАБЛЬ СБИТ", "bad");
      return;
    }
    if (s.faction === "enemy") {
      this.kills += 1;
      this.score += s.kind === "elite" ? 80 : s.kind === "guard" ? 35 : 22;
      this.credits += s.kind === "elite" ? 40 : 14;
      if (Math.random() < 0.55) this.drop(s.x, s.z, Math.random() < 0.33 ? "repair" : Math.random() < 0.5 ? "ammo" : "cash");
    }
  }

  drop(x: number, z: number, kind: Pickup["kind"]) {
    const p = this.pickups.find((i) => !i.live);
    if (!p) return;
    p.live = true;
    p.x = x;
    p.z = z;
    p.kind = kind;
    p.life = 18;
    p.mesh.visible = true;
    p.mesh.material =
      kind === "repair" ? this.mats.engineAlly : kind === "ammo" ? this.mats.engine : this.mats.glass;
  }

  updatePickups(dt: number, me: Ship) {
    for (const p of this.pickups) {
      if (!p.live) continue;
      p.life -= dt;
      p.mesh.position.set(p.x, 1.1 + Math.sin(this.time * 3 + p.x) * 0.25, p.z);
      p.mesh.rotation.y += dt * 1.6;
      if (p.life <= 0) {
        p.live = false;
        p.mesh.visible = false;
        continue;
      }
      if (Math.hypot(p.x - me.x, p.z - me.z) < 3.2) {
        if (p.kind === "repair") me.hp = Math.min(me.maxHp, me.hp + 55);
        else if (p.kind === "ammo") this.missilesAmmo = Math.min(this.maxMissiles, this.missilesAmmo + 2);
        else this.credits += 30;
        this.audio.pickup();
        this.toast(p.kind === "repair" ? "РЕМКОМПЛЕКТ" : p.kind === "ammo" ? "РАКЕТЫ +" : "+30 КР", "good");
        p.live = false;
        p.mesh.visible = false;
      }
    }
  }

  updateCapture(dt: number, me: Ship) {
    this.capturing = "";
    this.captureProgress = 0;
    this.nearBase = false;
    for (const p of this.planets) {
      const dMe = Math.hypot(me.x - p.x, me.z - p.z);
      if (p.owner === "player" && dMe < p.r + 22) this.nearBase = true;
      let presP = 0;
      let presE = 0;
      if (dMe < p.r + 16) presP += 1.4;
      for (const s of this.ships) {
        if (!s.alive) continue;
        const d = Math.hypot(s.x - p.x, s.z - p.z);
        if (d > p.r + 16) continue;
        if (s.faction === "player" && s.kind !== "player") presP += s.kind === "bomber" ? 1.3 : 0.8;
        if (s.faction === "enemy") presE += s.kind === "elite" ? 1.2 : 0.7;
      }
      const delta = (presP - presE) * dt * 0.22;
      if (Math.abs(delta) > 0.0001) p.capture = Math.max(-1, Math.min(1, p.capture + delta));
      const prev = p.owner;
      if (p.capture > 0.72) p.owner = "player";
      else if (p.capture < -0.72) p.owner = "enemy";
      else if (Math.abs(p.capture) < 0.18) p.owner = "neutral";
      if (prev !== p.owner) {
        this.tintPlanet(p);
        this.audio.capture();
        if (p.owner === "player") {
          this.toast(`${p.name} НАША`, "good");
          this.credits += 40;
          this.score += 60;
        } else if (p.owner === "enemy") {
          this.toast(`${p.name} ПЕРЕХВАЧЕНА`, "bad");
          this.audio.alarm();
        } else this.toast(`${p.name} СПОРНА`, "info");
        if (this.planets.every((pl) => pl.owner === "player")) {
          this.toast("СИСТЕМА ПОД КОНТРОЛЕМ", "good");
          this.score += 250;
          this.wave += 1;
          this.spawnWave(true);
        }
      }
      if (dMe < p.r + 16 && p.owner !== "player") {
        this.capturing = p.name;
        this.captureProgress = (p.capture + 1) / 2;
      }
    }
  }

  missileRefill = 0;

  refillAtBase(me: Ship, dt: number) {
    if (!this.nearBase) return;
    me.hp = Math.min(me.maxHp, me.hp + 9 * dt);
    this.missileRefill += dt;
    if (this.missileRefill > 3.2) {
      this.missileRefill = 0;
      this.missilesAmmo = Math.min(this.maxMissiles, this.missilesAmmo + 1);
    }
  }

  spawnWave(big = false) {
    const n = Math.min(8, (big ? 4 : 2) + this.wave);
    this.toast(big ? "КОНТРУДАР ОХОТНИКОВ" : `ВОЛНА ${this.wave}`, "bad");
    for (let i = 0; i < n; i++) {
      const edge = Math.floor(Math.random() * 4);
      const x = edge === 0 ? -WORLD + 8 : edge === 1 ? WORLD - 8 : (Math.random() * 2 - 1) * WORLD;
      const z = edge === 2 ? -WORLD + 8 : edge === 3 ? WORLD - 8 : (Math.random() * 2 - 1) * WORLD;
      const kind: ShipKind = big && i === 0 ? "elite" : "hunter";
      const h = this.makeShip(kind, "enemy", x, z, yawTo(-x, -z));
      h.patrolId = (Math.random() * this.planets.length) | 0;
      this.ships.push(h);
    }
  }

  breakRock(i: number) {
    const r = this.rocks[i]!;
    r.hp = 0;
    this.dummy.scale.setScalar(0);
    this.dummy.position.set(0, -20, 0);
    this.dummy.updateMatrix();
    this.rockMesh.setMatrixAt(i, this.dummy.matrix);
    this.rockMesh.instanceMatrix.needsUpdate = true;
    this.burst(r.x, 1, r.z, 0x9aa4b0, 8, 6);
    this.credits += 6;
    if (Math.random() < 0.25) this.drop(r.x, r.z, "cash");
  }

  keepBounds() {
    /* ships already clamped */
  }

  cullDead() {
    if (this.ships.length > 48) {
      this.ships = this.ships.filter((s) => {
        if (s.alive) return true;
        this.scene.remove(s.mesh);
        this.scene.remove(s.blob);
        return false;
      });
    }
  }

  puff(x: number, y: number, z: number, size: number, _c: number) {
    const p = this.puffs.find((i) => !i.live);
    if (!p) return;
    p.live = true;
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = (Math.random() - 0.5) * 2;
    p.vy = 0.6;
    p.vz = (Math.random() - 0.5) * 2;
    p.life = 0.28;
    p.max = 0.28;
    p.size = size;
    p.mesh.visible = true;
  }

  burst(x: number, y: number, z: number, color: number, n: number, spd: number) {
    for (let i = 0; i < n; i++) {
      const p = this.puffs.find((q) => !q.live);
      if (!p) break;
      p.live = true;
      p.x = x;
      p.y = y;
      p.z = z;
      const a = Math.random() * Math.PI * 2;
      p.vx = Math.cos(a) * Math.random() * spd;
      p.vy = (Math.random() - 0.2) * spd * 0.5;
      p.vz = Math.sin(a) * Math.random() * spd;
      p.life = 0.35 + Math.random() * 0.4;
      p.max = p.life;
      p.size = 0.18 + Math.random() * 0.35;
      (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
      p.mesh.visible = true;
    }
  }

  updatePuffs(dt: number) {
    for (const p of this.puffs) {
      if (!p.live) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.life <= 0) {
        p.live = false;
        p.mesh.visible = false;
        continue;
      }
      const k = p.life / p.max;
      p.mesh.position.set(p.x, p.y, p.z);
      p.mesh.scale.setScalar(p.size * (0.4 + (1 - k) * 1.4));
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = k;
    }
  }

  killBolt(b: Bolt) {
    b.live = false;
    b.mesh.visible = false;
  }

  killMissile(m: Missile) {
    m.live = false;
    m.mesh.visible = false;
  }

  syncShip(s: Ship) {
    const fx = -Math.sin(s.yaw);
    const fz = -Math.cos(s.yaw);
    s.mesh.position.set(s.x, s.y, s.z);
    this.tmp.set(s.x + fx, s.y, s.z + fz);
    s.mesh.lookAt(this.tmp);
    s.mesh.rotateZ(s.bank);
    s.blob.position.set(s.x, 0.05, s.z);
    s.blob.scale.setScalar(s.radius * 0.85);
  }

  render(dt: number) {
    const me = this.player();
    if (this.phase === "menu" || !me) {
      const t = performance.now() / 1000;
      this.camera.position.set(Math.cos(t * 0.12) * 70, 28, Math.sin(t * 0.12) * 70);
      this.look.set(this.planets[0]?.x ?? 0, 4, this.planets[0]?.z ?? 0);
      this.camera.lookAt(this.look);
    } else {
      const fx = -Math.sin(me.yaw);
      const fz = -Math.cos(me.yaw);
      const follow = 11.5 + Math.min(7, me.speed * 0.1);
      const height = 5.6 + Math.min(3.2, me.speed * 0.04);
      this.tmp.set(me.x - fx * follow, me.y + height, me.z - fz * follow);
      const k = 1 - Math.exp(-4.2 * dt);
      this.cam.lerp(this.tmp, k);
      this.look.set(me.x + fx * 10, me.y + 0.4, me.z + fz * 10);
      const shake = this.reduced ? 0 : this.trauma * this.trauma;
      this.camera.position.set(
        this.cam.x + (Math.random() - 0.5) * shake * 1.4,
        this.cam.y + (Math.random() - 0.5) * shake * 0.8,
        this.cam.z + (Math.random() - 0.5) * shake * 1.4,
      );
      this.camera.lookAt(this.look);
    }
    for (const p of this.planets) {
      p.mesh.children[0]!.rotation.y += dt * 0.08;
      p.station.rotation.z += dt * 0.4;
    }
    this.renderer.render(this.scene, this.camera);
  }

  canBuyMap(): HudSnapshot["canBuy"] {
    const n = this.allyCount();
    const me = this.player();
    const c = this.credits;
    return {
      escort: c >= PRICES.escort && n < this.maxAllies,
      interceptor: c >= PRICES.interceptor && n < this.maxAllies,
      bomber: c >= PRICES.bomber && n < this.maxAllies,
      missiles: c >= PRICES.missiles && this.missilesAmmo < this.maxMissiles,
      repair: c >= PRICES.repair && !!me && me.hp < me.maxHp - 1,
      overcharge: c >= PRICES.overcharge && !!me && me.shield < me.maxShield - 1,
      hullUp: c >= PRICES.hullUp && this.hullLevel < 6,
      cannonUp: c >= PRICES.cannonUp && this.cannonLevel < 6,
    };
  }

  publish() {
    const me = this.player();
    const mini: MiniMark[] = [];
    for (const p of this.planets) mini.push({ x: p.x / WORLD, z: p.z / WORLD, kind: "planet", owner: p.owner });
    for (const s of this.ships) {
      if (!s.alive) continue;
      mini.push({
        x: s.x / WORLD,
        z: s.z / WORLD,
        kind: s.kind === "player" ? "me" : s.faction === "player" ? "ally" : "enemy",
        yaw: s.yaw,
      });
    }
    const snap: HudSnapshot = {
      phase: this.phase,
      hull: me?.hp ?? 0,
      maxHull: me?.maxHp ?? 1,
      shield: me?.shield ?? 0,
      maxShield: me?.maxShield ?? 1,
      missiles: this.missilesAmmo,
      maxMissiles: this.maxMissiles,
      credits: this.credits | 0,
      score: this.score | 0,
      kills: this.kills,
      time: this.time,
      wave: this.wave,
      boost: this.boost,
      lockName: this.lockName,
      lockDist: this.lockDist,
      command: this.command,
      planetsOwned: this.planets.filter((p) => p.owner === "player").length,
      planetsTotal: this.planets.length,
      nearBase: this.nearBase,
      capturing: this.capturing,
      captureProgress: this.captureProgress,
      toasts: this.toasts.slice(-3),
      planets: this.planets.map((p) => ({ id: p.id, name: p.name, owner: p.owner, capture: p.capture, income: p.income })),
      allies: this.ships
        .filter((s) => s.alive && s.faction === "player" && s.kind !== "player")
        .map((s) => ({ id: s.id, kind: s.kind, hp: s.hp, maxHp: s.maxHp, command: s.command })),
      mini,
      meYaw: me?.yaw ?? 0,
      shopHint: this.nearBase ? "РЕМОНТ У БАЗЫ" : "",
      highScore: this.highScore,
      muted: this.muted,
      canBuy: this.canBuyMap(),
      prices: { ...PRICES },
      hullLevel: this.hullLevel,
      cannonLevel: this.cannonLevel,
    };
    pushHud(snap);
  }

  wireProbe() {
    const g = this;
    window.__controlsTest = {
      getYaw: () => g.player()?.yaw ?? 0,
      getSpeed: () => Math.abs(g.player()?.speed ?? 0),
      setSteer: (v: number) => g.input.setSteer(v),
      setKeys: (codes: string[]) => {
        if (g.phase === "menu" || g.phase === "dead") g.beginRun();
        if (g.phase === "pause" || g.phase === "shop") g.phase = "play";
        g.input.setKeys(codes);
      },
    };
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.input.detach();
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    delete window.__controlsTest;
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setSteer?: (v: number) => void;
      setKeys?: (codes: string[]) => void;
    };
  }
}
