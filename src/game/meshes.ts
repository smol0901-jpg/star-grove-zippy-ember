import * as THREE from "three";
import type { ShipKind } from "./types";

export interface MatLib {
  player: THREE.MeshStandardMaterial;
  ally: THREE.MeshStandardMaterial;
  enemy: THREE.MeshStandardMaterial;
  elite: THREE.MeshStandardMaterial;
  guard: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  glassAlly: THREE.MeshStandardMaterial;
  engine: THREE.MeshStandardMaterial;
  engineAlly: THREE.MeshStandardMaterial;
  engineEnemy: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  boltP: THREE.MeshBasicMaterial;
  boltE: THREE.MeshBasicMaterial;
  missile: THREE.MeshStandardMaterial;
  blob: THREE.MeshBasicMaterial;
  ringN: THREE.MeshBasicMaterial;
  ringP: THREE.MeshBasicMaterial;
  ringE: THREE.MeshBasicMaterial;
  particle: THREE.MeshBasicMaterial;
  fuel: THREE.MeshStandardMaterial;
  energy: THREE.MeshStandardMaterial;
  chevron: THREE.MeshBasicMaterial;
  nav: THREE.LineBasicMaterial;
}

export function makeMaterials(): MatLib {
  const std = (color: number, emissive = 0x000000, ei = 0, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.62,
      roughness: 0.38,
      emissive,
      emissiveIntensity: ei,
      ...extra,
    });
  return {
    player: std(0xd4dde6, 0x243848, 0.42),
    ally: std(0x8fb89a, 0x1a3a24, 0.38),
    enemy: std(0xb07068, 0x3a1414, 0.32),
    elite: std(0xc45c54, 0x4a1010, 0.5),
    guard: std(0x7a6864, 0x2a1410, 0.22),
    dark: std(0x161a22),
    glass: std(0xa8d4e4, 0x5a9aaa, 0.7, { roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.88 }),
    glassAlly: std(0x9ad4a8, 0x3a8a4a, 0.55, { roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.85 }),
    engine: std(0xe8f0f6, 0xc8dce8, 3.2),
    engineAlly: std(0xd4f0dc, 0x88d498, 2.8),
    engineEnemy: std(0xf0c8c0, 0xe07070, 2.6),
    metal: std(0x3e4854, 0x000000, 0, { metalness: 0.84, roughness: 0.24 }),
    trim: std(0x8a9aaa, 0x1a2830, 0.2, { metalness: 0.7, roughness: 0.3 }),
    boltP: new THREE.MeshBasicMaterial({ color: 0xc8eef8, transparent: true, opacity: 0.95 }),
    boltE: new THREE.MeshBasicMaterial({ color: 0xf0a098, transparent: true, opacity: 0.95 }),
    missile: std(0xd8e2ea, 0x9ec4d4, 1.3),
    blob: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
    ringN: new THREE.MeshBasicMaterial({ color: 0x7a8490, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
    ringP: new THREE.MeshBasicMaterial({ color: 0x7ec898, transparent: true, opacity: 0.65, side: THREE.DoubleSide }),
    ringE: new THREE.MeshBasicMaterial({ color: 0xd07070, transparent: true, opacity: 0.65, side: THREE.DoubleSide }),
    particle: new THREE.MeshBasicMaterial({ color: 0xdfe6ee, transparent: true, opacity: 0.9, depthWrite: false }),
    fuel: std(0xd4b48a, 0xc49a5a, 1.4),
    energy: std(0x8ec4d4, 0x5aa8c0, 1.6),
    chevron: new THREE.MeshBasicMaterial({ color: 0xb8d0dc, transparent: true, opacity: 0.55, depthWrite: false }),
    nav: new THREE.LineBasicMaterial({ color: 0x9ec0cc, transparent: true, opacity: 0.7 }),
  };
}

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

export function makeShip(kind: ShipKind, mats: MatLib): THREE.Group {
  const g = new THREE.Group();
  const hull =
    kind === "player"
      ? mats.player
      : kind === "escort" || kind === "interceptor" || kind === "bomber"
        ? mats.ally
        : kind === "elite"
          ? mats.elite
          : kind === "guard"
            ? mats.guard
            : mats.enemy;
  const eng =
    kind === "player"
      ? mats.engine
      : kind === "escort" || kind === "interceptor" || kind === "bomber"
        ? mats.engineAlly
        : mats.engineEnemy;
  const glass = kind === "player" ? mats.glass : kind === "escort" || kind === "interceptor" || kind === "bomber" ? mats.glassAlly : mats.glass;

  if (kind === "player") {
    g.add(box(0.62, 0.32, 2.9, hull, 0, 0.1, 0.05));
    g.add(box(0.38, 0.18, 1.1, mats.dark, 0, 0.22, -0.4));
    g.add(box(2.15, 0.07, 0.82, hull, 0, 0.04, -0.05));
    g.add(box(0.7, 0.05, 1.4, mats.trim, 0, 0.26, 0.2));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.05, 7), hull);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.1, 1.75);
    g.add(nose);
    g.add(box(0.42, 0.2, 0.55, glass, 0, 0.28, 0.55));
    g.add(box(0.16, 0.1, 1.0, mats.metal, 0.78, 0.12, 0.55));
    g.add(box(0.16, 0.1, 1.0, mats.metal, -0.78, 0.12, 0.55));
    g.add(box(0.12, 0.08, 0.18, mats.engine, 0.78, 0.18, 1.0));
    g.add(box(0.12, 0.08, 0.18, mats.engine, -0.78, 0.18, 1.0));
    const bellL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.38, 8), eng);
    bellL.rotation.x = Math.PI / 2;
    bellL.position.set(0.26, 0.02, -1.55);
    g.add(bellL);
    const bellR = bellL.clone();
    bellR.position.x = -0.26;
    g.add(bellR);
    g.add(box(0.08, 0.42, 0.08, mats.trim, 0.2, 0.42, -0.6));
    g.scale.setScalar(1.32);
  } else if (kind === "escort") {
    g.add(box(0.42, 0.22, 1.85, hull));
    g.add(box(1.45, 0.06, 0.5, hull, 0, 0.02, 0));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.62, 6), hull);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 1.12;
    g.add(nose);
    g.add(box(0.22, 0.12, 0.28, glass, 0, 0.16, 0.25));
    g.add(box(0.18, 0.14, 0.24, eng, 0, 0, -0.95));
  } else if (kind === "interceptor") {
    g.add(box(0.3, 0.16, 2.05, hull));
    g.add(box(1.95, 0.045, 0.32, hull, 0, 0, 0.15));
    g.add(box(0.16, 0.1, 0.2, glass, 0, 0.12, 0.4));
    g.add(box(0.14, 0.1, 0.22, eng, 0.2, 0, -1.0));
    g.add(box(0.14, 0.1, 0.22, eng, -0.2, 0, -1.0));
  } else if (kind === "bomber") {
    g.add(box(0.78, 0.36, 1.95, hull));
    g.add(box(1.65, 0.1, 0.9, hull, 0, -0.04, -0.15));
    g.add(box(0.36, 0.22, 0.4, mats.dark, 0, 0.16, 0.45));
    g.add(box(0.2, 0.12, 0.24, glass, 0, 0.28, 0.5));
    g.add(box(0.24, 0.18, 0.28, eng, 0.32, 0, -1.0));
    g.add(box(0.24, 0.18, 0.28, eng, -0.32, 0, -1.0));
  } else if (kind === "hunter" || kind === "elite") {
    const s = kind === "elite" ? 1.28 : 1;
    g.add(box(0.52 * s, 0.24 * s, 2.15 * s, hull));
    g.add(box(1.75 * s, 0.07 * s, 0.52 * s, hull, 0, 0, 0.18));
    g.add(box(0.08 * s, 0.55 * s, 0.55 * s, hull, 0.6 * s, 0.18 * s, 0));
    g.add(box(0.08 * s, 0.55 * s, 0.55 * s, hull, -0.6 * s, 0.18 * s, 0));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.24 * s, 0.78 * s, 4), hull);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 1.32 * s;
    g.add(nose);
    g.add(box(0.18 * s, 0.14 * s, 0.26 * s, eng, 0.22 * s, 0, -1.12 * s));
    g.add(box(0.18 * s, 0.14 * s, 0.26 * s, eng, -0.22 * s, 0, -1.12 * s));
  } else {
    g.add(box(0.78, 0.38, 1.15, hull));
    g.add(box(1.2, 0.12, 0.42, hull, 0, 0.06, 0));
    g.add(box(0.28, 0.2, 0.28, mats.dark, 0, 0.22, 0.2));
    g.add(box(0.22, 0.16, 0.24, eng, 0, 0, -0.62));
  }

  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = false;
      m.receiveShadow = false;
    }
  });
  return g;
}

function rnd(seed: { n: number }) {
  seed.n = (seed.n * 16807) % 2147483647;
  return (seed.n - 1) / 2147483646;
}

export function makePlanetTexture(seed: number, base: string, accent: string, polar = "#e8eef2") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const s = { n: (seed | 0) + 1 };
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, polar);
  g.addColorStop(0.18, base);
  g.addColorStop(0.82, base);
  g.addColorStop(1, polar);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.1 + rnd(s) * 0.35;
    const x = rnd(s) * 512;
    const y = 30 + rnd(s) * 196;
    const rx = 8 + rnd(s) * 48;
    const ry = rx * (0.35 + rnd(s) * 0.7);
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rnd(s) * 3.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#0c1016";
  for (let i = 0; i < 28; i++) {
    ctx.beginPath();
    ctx.arc(rnd(s) * 512, 40 + rnd(s) * 176, 3 + rnd(s) * 11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 512, 22);
  ctx.fillRect(0, 234, 512, 22);
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function makeNebulaTexture(c0: string, c1: string, seed: number) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const s = { n: seed };
  ctx.clearRect(0, 0, 512, 256);
  for (let i = 0; i < 24; i++) {
    const x = rnd(s) * 512;
    const y = rnd(s) * 256;
    const r = 40 + rnd(s) * 110;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, i % 2 ? c0 : c1);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.12 + rnd(s) * 0.18;
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 256);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeLabelSprite(text: string, color = "#d5e0ea") {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = "600 22px Oxanium, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(7,9,13,0.55)";
  ctx.fillRect(18, 16, 220, 32);
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(18, 4.5, 1);
  return spr;
}

export function makeStarfield(count = 1600) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 400 + Math.random() * 2200;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.45;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    const cool = Math.random();
    const b = 0.5 + Math.random() * 0.5;
    col[i * 3] = b * (cool > 0.7 ? 1 : 0.82);
    col[i * 3 + 1] = b * 0.92;
    col[i * 3 + 2] = b;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.35,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

export function makeChevronRow(mats: MatLib) {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 3), mats.chevron);
    m.rotation.x = Math.PI / 2;
    m.position.z = -4 - i * 2.4;
    m.scale.setScalar(1 - i * 0.08);
    g.add(m);
  }
  return g;
}
