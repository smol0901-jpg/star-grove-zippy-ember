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
  engine: THREE.MeshStandardMaterial;
  engineAlly: THREE.MeshStandardMaterial;
  engineEnemy: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  boltP: THREE.MeshBasicMaterial;
  boltE: THREE.MeshBasicMaterial;
  missile: THREE.MeshStandardMaterial;
  blob: THREE.MeshBasicMaterial;
  ringN: THREE.MeshBasicMaterial;
  ringP: THREE.MeshBasicMaterial;
  ringE: THREE.MeshBasicMaterial;
  particle: THREE.MeshBasicMaterial;
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
    player: std(0xb9c4ce, 0x1c3038, 0.35),
    ally: std(0x8aa494, 0x16301c, 0.3),
    enemy: std(0x8a6a68, 0x301414, 0.28),
    elite: std(0xa45c58, 0x401010, 0.45),
    guard: std(0x6e6462, 0x201010, 0.2),
    dark: std(0x1a1e26),
    glass: std(0x8eb0bc, 0x4c7a88, 0.55, { roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.85 }),
    engine: std(0xdfe8ee, 0xc5d4de, 2.4),
    engineAlly: std(0xcfe0d4, 0x8fbf9a, 2.2),
    engineEnemy: std(0xefd0c8, 0xc97878, 2.2),
    metal: std(0x3a424c, 0x000000, 0, { metalness: 0.8, roughness: 0.28 }),
    boltP: new THREE.MeshBasicMaterial({ color: 0xc5e4ee, transparent: true, opacity: 0.95 }),
    boltE: new THREE.MeshBasicMaterial({ color: 0xe8a8a0, transparent: true, opacity: 0.95 }),
    missile: std(0xd5dde4, 0x9eb8c4, 1.1),
    blob: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }),
    ringN: new THREE.MeshBasicMaterial({ color: 0x6a7380, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
    ringP: new THREE.MeshBasicMaterial({ color: 0x8fbf9a, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    ringE: new THREE.MeshBasicMaterial({ color: 0xc97878, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    particle: new THREE.MeshBasicMaterial({ color: 0xdfe6ee, transparent: true, opacity: 0.9, depthWrite: false }),
  };
}

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = false;
  m.receiveShadow = false;
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

  if (kind === "player") {
    g.add(box(0.55, 0.28, 2.6, hull, 0, 0.08, 0.1));
    g.add(box(1.85, 0.08, 0.7, hull, 0, 0.02, -0.15));
    g.add(box(0.22, 0.12, 0.9, mats.metal, 0.7, 0.08, 0.4));
    g.add(box(0.22, 0.12, 0.9, mats.metal, -0.7, 0.08, 0.4));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 6), hull);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.08, 1.55);
    g.add(nose);
    g.add(box(0.36, 0.18, 0.42, mats.glass, 0, 0.22, 0.35));
    g.add(box(0.22, 0.16, 0.28, eng, 0.22, 0, -1.3));
    g.add(box(0.22, 0.16, 0.28, eng, -0.22, 0, -1.3));
  } else if (kind === "escort") {
    g.add(box(0.4, 0.2, 1.7, hull));
    g.add(box(1.3, 0.06, 0.45, hull, 0, 0, -0.1));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 5), hull);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 1.05;
    g.add(nose);
    g.add(box(0.16, 0.12, 0.22, eng, 0, 0, -0.9));
  } else if (kind === "interceptor") {
    g.add(box(0.32, 0.16, 1.9, hull));
    g.add(box(1.7, 0.05, 0.35, hull, 0, 0, 0.1));
    g.add(box(0.14, 0.1, 0.2, eng, 0.18, 0, -0.95));
    g.add(box(0.14, 0.1, 0.2, eng, -0.18, 0, -0.95));
  } else if (kind === "bomber") {
    g.add(box(0.7, 0.32, 1.8, hull));
    g.add(box(1.5, 0.1, 0.8, hull, 0, -0.05, -0.2));
    g.add(box(0.3, 0.2, 0.3, mats.dark, 0, 0.12, 0.5));
    g.add(box(0.22, 0.16, 0.26, eng, 0.28, 0, -0.95));
    g.add(box(0.22, 0.16, 0.26, eng, -0.28, 0, -0.95));
  } else if (kind === "hunter" || kind === "elite") {
    const s = kind === "elite" ? 1.25 : 1;
    g.add(box(0.5 * s, 0.22 * s, 2.0 * s, hull));
    g.add(box(1.6 * s, 0.08 * s, 0.5 * s, hull, 0, 0, 0.2));
    g.add(box(0.08 * s, 0.5 * s, 0.5 * s, hull, 0.55 * s, 0.15 * s, 0));
    g.add(box(0.08 * s, 0.5 * s, 0.5 * s, hull, -0.55 * s, 0.15 * s, 0));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22 * s, 0.7 * s, 4), hull);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 1.25 * s;
    g.add(nose);
    g.add(box(0.18 * s, 0.14 * s, 0.24 * s, eng, 0.2 * s, 0, -1.05 * s));
    g.add(box(0.18 * s, 0.14 * s, 0.24 * s, eng, -0.2 * s, 0, -1.05 * s));
  } else {
    g.add(box(0.7, 0.35, 1.1, hull));
    g.add(box(1.1, 0.12, 0.4, hull, 0, 0.05, 0));
    g.add(box(0.2, 0.16, 0.22, eng, 0, 0, -0.6));
  }

  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = false;
      m.receiveShadow = false;
    }
  });
  if (kind === "player") g.scale.setScalar(1.28);
  return g;
}

export function makePlanetTexture(seed: number, base: string, accent: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 128);
  let s = seed | 0;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.12 + rnd() * 0.28;
    const x = rnd() * 256;
    const y = rnd() * 128;
    const r = 6 + rnd() * 28;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.4 + rnd() * 0.6), rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#0a0c10";
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    ctx.arc(rnd() * 256, rnd() * 128, 2 + rnd() * 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function makeStarfield(count = 900) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 180 + Math.random() * 520;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.55;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    const b = 0.45 + Math.random() * 0.55;
    col[i * 3] = b * 0.9;
    col[i * 3 + 1] = b * 0.95;
    col[i * 3 + 2] = b;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.9,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}
