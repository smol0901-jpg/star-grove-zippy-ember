import { i as __toESM } from "../_runtime.mjs";
import { L as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Shield, c as Flag, l as Crosshair, n as VolumeX, o as Rocket, r as Volume2, s as Pause, t as Wrench } from "../_libs/lucide-react.mjs";
import { A as SphereGeometry, C as PlaneGeometry, D as RingGeometry, E as RepeatWrapping, M as Vector3, O as SRGBColorSpace, S as PerspectiveCamera, T as PointsMaterial, _ as Mesh, a as CanvasTexture, b as Object3D, c as ConeGeometry, d as FogExp2, f as GridHelper, g as InstancedMesh, h as IcosahedronGeometry, i as BufferGeometry, j as TorusGeometry, k as Scene, l as CylinderGeometry, m as HemisphereLight, n as BoxGeometry, o as CircleGeometry, p as Group, r as BufferAttribute, s as Color, t as WebGLRenderer, u as DirectionalLight, v as MeshBasicMaterial, w as Points, x as OctahedronGeometry, y as MeshStandardMaterial } from "../_libs/three.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CM_MyKLR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AudioBus = class {
	ctx = null;
	master = null;
	sfx = null;
	muted = false;
	unlocked = false;
	unlock() {
		if (this.unlocked && this.ctx) {
			if (this.ctx.state === "suspended") this.ctx.resume();
			return;
		}
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return;
		this.ctx = new AC({ latencyHint: "interactive" });
		this.master = this.ctx.createGain();
		this.sfx = this.ctx.createGain();
		this.sfx.gain.value = .22;
		this.master.gain.value = this.muted ? 0 : .8;
		this.sfx.connect(this.master);
		this.master.connect(this.ctx.destination);
		if (this.ctx.state === "suspended") this.ctx.resume();
		this.unlocked = true;
	}
	setMuted(v) {
		this.muted = v;
		if (this.master && this.ctx) this.master.gain.setTargetAtTime(v ? 0 : .8, this.ctx.currentTime, .02);
	}
	tone(freq, dur, type, gain = .12, slide = 0) {
		if (!this.ctx || !this.sfx || this.muted) return;
		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const g = this.ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, t);
		if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
		g.gain.setValueAtTime(gain, t);
		g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
		osc.connect(g);
		g.connect(this.sfx);
		osc.start(t);
		osc.stop(t + dur + .02);
		osc.onended = () => {
			osc.disconnect();
			g.disconnect();
		};
	}
	noise(dur, gain = .1, hp = 400) {
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
		g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
		src.connect(filter);
		filter.connect(g);
		g.connect(this.sfx);
		src.start(t);
		src.stop(t + dur + .02);
	}
	shoot() {
		this.tone(420 + Math.random() * 80, .07, "square", .05);
		this.noise(.04, .05, 900);
	}
	missile() {
		this.tone(180, .28, "sawtooth", .07, 420);
	}
	hit() {
		this.tone(140 + Math.random() * 40, .08, "triangle", .08, -80);
		this.noise(.06, .08, 200);
	}
	explode() {
		this.noise(.28, .16, 120);
		this.tone(90, .32, "sine", .12, -50);
	}
	boost() {
		this.tone(220, .2, "sawtooth", .06, 280);
	}
	capture() {
		this.tone(330, .18, "sine", .08);
		this.tone(495, .22, "sine", .05);
	}
	buy() {
		this.tone(520, .1, "square", .05);
		this.tone(780, .14, "square", .04);
	}
	deny() {
		this.tone(110, .12, "square", .06, -20);
	}
	pickup() {
		this.tone(660, .1, "sine", .06, 120);
	}
	alarm() {
		this.tone(240, .16, "square", .05);
	}
};
var GAME_KEYS = /* @__PURE__ */ new Set([
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
	"Digit5"
]);
function radialDeadzone(x, y, dz = .15) {
	const m = Math.hypot(x, y);
	if (m < dz) return {
		x: 0,
		y: 0
	};
	const scale = (m - dz) / (1 - dz) / m;
	return {
		x: x * scale,
		y: y * scale
	};
}
var Input = class {
	keys = /* @__PURE__ */ new Set();
	override = null;
	steerOverride = null;
	touchSteer = 0;
	touchThrust = 0;
	touchFire = false;
	touchMissile = false;
	touchBoost = false;
	stickActive = false;
	pointerId = null;
	prevFire = false;
	prevMissile = false;
	prevBoost = false;
	just = {
		fire: false,
		missile: false,
		boost: false,
		shop: false,
		pause: false,
		cmd: ""
	};
	edgeKeys = /* @__PURE__ */ new Set();
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
	onDown(e) {
		if (e.repeat) {
			if (GAME_KEYS.has(e.code)) e.preventDefault();
			return;
		}
		if (GAME_KEYS.has(e.code)) e.preventDefault();
		this.keys.add(e.code);
		this.edgeKeys.add(e.code);
	}
	onUp(e) {
		this.keys.delete(e.code);
	}
	onBlur() {
		if (this.override) return;
		this.keys.clear();
		this.touchFire = false;
		this.touchMissile = false;
		this.touchBoost = false;
	}
	setKeys(codes) {
		if (codes.length === 0) {
			this.override = null;
			this.keys.clear();
			return;
		}
		this.override = new Set(codes);
	}
	setSteer(v) {
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
		return {
			shop,
			pause,
			cmd
		};
	}
	sample() {
		const src = this.override ?? this.keys;
		let steer = 0;
		let thrust = 0;
		if (src.has("KeyA") || src.has("ArrowLeft")) steer += 1;
		if (src.has("KeyD") || src.has("ArrowRight")) steer -= 1;
		if (src.has("KeyW") || src.has("ArrowUp")) thrust += 1;
		if (src.has("KeyS") || src.has("ArrowDown")) thrust -= 1;
		const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
		if (pads) for (const p of pads) {
			if (!p || p.mapping !== "standard") continue;
			const st = radialDeadzone(p.axes[0] ?? 0, p.axes[1] ?? 0);
			steer += -st.x;
			thrust += -st.y;
			if (p.buttons[0]?.pressed) this.touchFire = true;
			if (p.buttons[5]?.pressed || p.buttons[7]?.pressed) this.touchMissile = true;
			if (p.buttons[1]?.pressed) this.touchBoost = true;
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
		return {
			thrust,
			steer,
			fire,
			missile,
			boost,
			justFire,
			justMissile,
			justBoost
		};
	}
};
function makeMaterials() {
	const std = (color, emissive = 0, ei = 0, extra = {}) => new MeshStandardMaterial({
		color,
		metalness: .62,
		roughness: .38,
		emissive,
		emissiveIntensity: ei,
		...extra
	});
	return {
		player: std(12174542, 1847352, .35),
		ally: std(9086100, 1454108, .3),
		enemy: std(9071208, 3150868, .28),
		elite: std(10771544, 4198416, .45),
		guard: std(7234658, 2101264, .2),
		dark: std(1711654),
		glass: std(9351356, 5012104, .55, {
			roughness: .12,
			metalness: .2,
			transparent: true,
			opacity: .85
		}),
		engine: std(14674158, 12965086, 2.4),
		engineAlly: std(13623508, 9420698, 2.2),
		engineEnemy: std(15716552, 13203576, 2.2),
		metal: std(3818060, 0, 0, {
			metalness: .8,
			roughness: .28
		}),
		boltP: new MeshBasicMaterial({
			color: 12969198,
			transparent: true,
			opacity: .95
		}),
		boltE: new MeshBasicMaterial({
			color: 15247520,
			transparent: true,
			opacity: .95
		}),
		missile: std(14015972, 10401988, 1.1),
		blob: new MeshBasicMaterial({
			color: 0,
			transparent: true,
			opacity: .28,
			depthWrite: false
		}),
		ringN: new MeshBasicMaterial({
			color: 6976384,
			transparent: true,
			opacity: .45,
			side: 2
		}),
		ringP: new MeshBasicMaterial({
			color: 9420698,
			transparent: true,
			opacity: .55,
			side: 2
		}),
		ringE: new MeshBasicMaterial({
			color: 13203576,
			transparent: true,
			opacity: .55,
			side: 2
		}),
		particle: new MeshBasicMaterial({
			color: 14673646,
			transparent: true,
			opacity: .9,
			depthWrite: false
		})
	};
}
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
	const m = new Mesh(new BoxGeometry(w, h, d), mat);
	m.position.set(x, y, z);
	m.castShadow = false;
	m.receiveShadow = false;
	return m;
}
function makeShip(kind, mats) {
	const g = new Group();
	const hull = kind === "player" ? mats.player : kind === "escort" || kind === "interceptor" || kind === "bomber" ? mats.ally : kind === "elite" ? mats.elite : kind === "guard" ? mats.guard : mats.enemy;
	const eng = kind === "player" ? mats.engine : kind === "escort" || kind === "interceptor" || kind === "bomber" ? mats.engineAlly : mats.engineEnemy;
	if (kind === "player") {
		g.add(box(.55, .28, 2.6, hull, 0, .08, .1));
		g.add(box(1.85, .08, .7, hull, 0, .02, -.15));
		g.add(box(.22, .12, .9, mats.metal, .7, .08, .4));
		g.add(box(.22, .12, .9, mats.metal, -.7, .08, .4));
		const nose = new Mesh(new ConeGeometry(.28, .9, 6), hull);
		nose.rotation.x = Math.PI / 2;
		nose.position.set(0, .08, 1.55);
		g.add(nose);
		g.add(box(.36, .18, .42, mats.glass, 0, .22, .35));
		g.add(box(.22, .16, .28, eng, .22, 0, -1.3));
		g.add(box(.22, .16, .28, eng, -.22, 0, -1.3));
	} else if (kind === "escort") {
		g.add(box(.4, .2, 1.7, hull));
		g.add(box(1.3, .06, .45, hull, 0, 0, -.1));
		const nose = new Mesh(new ConeGeometry(.2, .55, 5), hull);
		nose.rotation.x = Math.PI / 2;
		nose.position.z = 1.05;
		g.add(nose);
		g.add(box(.16, .12, .22, eng, 0, 0, -.9));
	} else if (kind === "interceptor") {
		g.add(box(.32, .16, 1.9, hull));
		g.add(box(1.7, .05, .35, hull, 0, 0, .1));
		g.add(box(.14, .1, .2, eng, .18, 0, -.95));
		g.add(box(.14, .1, .2, eng, -.18, 0, -.95));
	} else if (kind === "bomber") {
		g.add(box(.7, .32, 1.8, hull));
		g.add(box(1.5, .1, .8, hull, 0, -.05, -.2));
		g.add(box(.3, .2, .3, mats.dark, 0, .12, .5));
		g.add(box(.22, .16, .26, eng, .28, 0, -.95));
		g.add(box(.22, .16, .26, eng, -.28, 0, -.95));
	} else if (kind === "hunter" || kind === "elite") {
		const s = kind === "elite" ? 1.25 : 1;
		g.add(box(.5 * s, .22 * s, 2 * s, hull));
		g.add(box(1.6 * s, .08 * s, .5 * s, hull, 0, 0, .2));
		g.add(box(.08 * s, .5 * s, .5 * s, hull, .55 * s, .15 * s, 0));
		g.add(box(.08 * s, .5 * s, .5 * s, hull, -.55 * s, .15 * s, 0));
		const nose = new Mesh(new ConeGeometry(.22 * s, .7 * s, 4), hull);
		nose.rotation.x = Math.PI / 2;
		nose.position.z = 1.25 * s;
		g.add(nose);
		g.add(box(.18 * s, .14 * s, .24 * s, eng, .2 * s, 0, -1.05 * s));
		g.add(box(.18 * s, .14 * s, .24 * s, eng, -.2 * s, 0, -1.05 * s));
	} else {
		g.add(box(.7, .35, 1.1, hull));
		g.add(box(1.1, .12, .4, hull, 0, .05, 0));
		g.add(box(.2, .16, .22, eng, 0, 0, -.6));
	}
	g.traverse((o) => {
		const m = o;
		if (m.isMesh) {
			m.castShadow = false;
			m.receiveShadow = false;
		}
	});
	if (kind === "player") g.scale.setScalar(1.28);
	return g;
}
function makePlanetTexture(seed, base, accent) {
	const c = document.createElement("canvas");
	c.width = 256;
	c.height = 128;
	const ctx = c.getContext("2d");
	ctx.fillStyle = base;
	ctx.fillRect(0, 0, 256, 128);
	let s = seed | 0;
	const rnd = () => {
		s = s * 16807 % 2147483647;
		return (s - 1) / 2147483646;
	};
	for (let i = 0; i < 70; i++) {
		ctx.fillStyle = accent;
		ctx.globalAlpha = .12 + rnd() * .28;
		const x = rnd() * 256;
		const y = rnd() * 128;
		const r = 6 + rnd() * 28;
		ctx.beginPath();
		ctx.ellipse(x, y, r, r * (.4 + rnd() * .6), rnd() * 3, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = .35;
	ctx.fillStyle = "#0a0c10";
	for (let i = 0; i < 18; i++) {
		ctx.beginPath();
		ctx.arc(rnd() * 256, rnd() * 128, 2 + rnd() * 7, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
	const tex = new CanvasTexture(c);
	tex.colorSpace = SRGBColorSpace;
	tex.wrapS = RepeatWrapping;
	tex.needsUpdate = true;
	return tex;
}
function makeStarfield(count = 900) {
	const geo = new BufferGeometry();
	const pos = new Float32Array(count * 3);
	const col = new Float32Array(count * 3);
	for (let i = 0; i < count; i++) {
		const r = 180 + Math.random() * 520;
		const th = Math.random() * Math.PI * 2;
		const ph = Math.acos(2 * Math.random() - 1);
		pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
		pos[i * 3 + 1] = r * Math.cos(ph) * .55;
		pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
		const b = .45 + Math.random() * .55;
		col[i * 3] = b * .9;
		col[i * 3 + 1] = b * .95;
		col[i * 3 + 2] = b;
	}
	geo.setAttribute("position", new BufferAttribute(pos, 3));
	geo.setAttribute("color", new BufferAttribute(col, 3));
	const mat = new PointsMaterial({
		size: .9,
		vertexColors: true,
		transparent: true,
		opacity: .85,
		depthWrite: false,
		sizeAttenuation: true
	});
	return new Points(geo, mat);
}
var PRICES = {
	escort: 180,
	interceptor: 240,
	bomber: 320,
	missiles: 70,
	repair: 55,
	overcharge: 90,
	hullUp: 420,
	cannonUp: 380
};
var COMMAND_LABEL = {
	follow: "СЛЕДОВАТЬ",
	defend: "ДЕРЖАТЬ",
	hunt: "ОХОТА",
	capture: "ЗАХВАТ",
	hold: "СТОЯТЬ"
};
var KIND_LABEL = {
	player: "ВЕКТОР",
	escort: "ЭСКОРТ",
	interceptor: "ПЕРЕХВАТ",
	bomber: "ШТУРМ",
	hunter: "ОХОТНИК",
	elite: "ЭЛИТА",
	guard: "СТРАЖ"
};
var initialHud = {
	phase: "menu",
	hull: 280,
	maxHull: 280,
	shield: 180,
	maxShield: 180,
	missiles: 8,
	maxMissiles: 8,
	credits: 0,
	score: 0,
	kills: 0,
	time: 0,
	wave: 1,
	boost: 1,
	lockName: "",
	lockDist: 0,
	command: "follow",
	planetsOwned: 0,
	planetsTotal: 6,
	nearBase: false,
	capturing: "",
	captureProgress: 0,
	toasts: [],
	planets: [],
	allies: [],
	mini: [],
	meYaw: 0,
	shopHint: "",
	highScore: 0,
	muted: false,
	canBuy: {
		escort: false,
		interceptor: false,
		bomber: false,
		missiles: false,
		repair: false,
		overcharge: false,
		hullUp: false,
		cannonUp: false
	},
	prices: { ...PRICES },
	hullLevel: 1,
	cannonLevel: 1
};
var api = null;
var useHud = create()((set) => ({
	...initialHud,
	bind: (next) => {
		api = next;
	},
	start: () => api?.beginRun(),
	pause: () => api?.setPaused(true),
	resume: () => api?.setPaused(false),
	openShop: (open) => api?.setShop(open),
	buyItem: (id) => api?.buy(id),
	issueCommand: (cmd) => {
		api?.setGlobalCommand(cmd);
		set({
			command: cmd,
			shopHint: COMMAND_LABEL[cmd]
		});
	},
	allyCommand: (id, cmd) => api?.setAllyCommand(id, cmd),
	mute: () => api?.toggleMute(),
	retry: () => api?.beginRun()
}));
function pushHud(snap) {
	useHud.setState(snap);
}
var STEP = 1 / 60;
var WORLD = 210;
var SAVE_KEY = "aegis-hold-v1";
function angNorm(a) {
	while (a > Math.PI) a -= Math.PI * 2;
	while (a < -Math.PI) a += Math.PI * 2;
	return a;
}
function turnToward(yaw, want, rate, dt) {
	const d = angNorm(want - yaw);
	const m = rate * dt;
	if (d > m) return yaw + m;
	if (d < -m) return yaw - m;
	return yaw + d;
}
function yawTo(dx, dz) {
	return Math.atan2(-dx, -dz);
}
var PLANET_DEF = [
	{
		name: "АСТРЕЯ",
		r: 16,
		income: 9,
		base: "#6d7a86",
		accent: "#b7c4ce"
	},
	{
		name: "РИГЕЛЬ",
		r: 13,
		income: 6,
		base: "#5c6b62",
		accent: "#9aada0"
	},
	{
		name: "НОВА",
		r: 15,
		income: 8,
		base: "#6a6460",
		accent: "#c4b4a8"
	},
	{
		name: "ИКАР",
		r: 11,
		income: 5,
		base: "#4e5864",
		accent: "#8aa0b4"
	},
	{
		name: "ГЕЛИОС",
		r: 18,
		income: 11,
		base: "#7a7068",
		accent: "#d2c6b8"
	},
	{
		name: "КЕФ",
		r: 12,
		income: 6,
		base: "#585e6a",
		accent: "#9aa8b8"
	}
];
var Game = class {
	canvas;
	renderer;
	scene;
	camera;
	input = new Input();
	audio = new AudioBus();
	mats;
	ships = [];
	planets = [];
	bolts = [];
	missiles = [];
	puffs = [];
	pickups = [];
	rocks = [];
	rockMesh;
	dummy = new Object3D();
	nextId = 1;
	toastId = 1;
	toasts = [];
	phase = "menu";
	credits = 220;
	score = 0;
	kills = 0;
	time = 0;
	wave = 1;
	waveT = 0;
	command = "follow";
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
	cam = new Vector3(0, 28, 42);
	look = new Vector3();
	tmp = new Vector3();
	tmp2 = new Vector3();
	grid;
	disposed = false;
	lockName = "";
	lockDist = 0;
	capturing = "";
	captureProgress = 0;
	nearBase = false;
	incomeAcc = 0;
	maxAllies = 6;
	constructor(canvas) {
		this.canvas = canvas;
		this.reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
		this.scene = new Scene();
		this.scene.background = new Color(461069);
		this.scene.fog = new FogExp2(461069, .011);
		this.camera = new PerspectiveCamera(58, 1, .1, 900);
		this.renderer = new WebGLRenderer({
			canvas,
			antialias: true,
			alpha: false,
			powerPreference: "high-performance"
		});
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		this.renderer.toneMapping = 4;
		this.renderer.toneMappingExposure = 1.05;
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.mats = makeMaterials();
		const hemi = new HemisphereLight(12898524, 1316896, 1.2);
		this.scene.add(hemi);
		const key = new DirectionalLight(15659766, 1.35);
		key.position.set(40, 70, 18);
		this.scene.add(key);
		const rim = new DirectionalLight(8300728, .35);
		rim.position.set(-30, 20, -40);
		this.scene.add(rim);
		this.grid = new GridHelper(WORLD * 2.2, 28, 1844272, 1317152);
		this.grid.material.transparent = true;
		this.grid.material.opacity = .35;
		this.scene.add(this.grid);
		const floor = new Mesh(new PlaneGeometry(WORLD * 2.4, WORLD * 2.4), new MeshStandardMaterial({
			color: 790550,
			metalness: .1,
			roughness: .92
		}));
		floor.rotation.x = -Math.PI / 2;
		floor.position.y = -.04;
		this.scene.add(floor);
		this.scene.add(makeStarfield(1100));
		const rockGeo = new IcosahedronGeometry(1, 0);
		const rockMat = new MeshStandardMaterial({
			color: 3817804,
			roughness: .82,
			metalness: .2,
			flatShading: true
		});
		this.rockMesh = new InstancedMesh(rockGeo, rockMat, 36);
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
				const s = JSON.parse(raw);
				this.highScore = s.highScore ?? 0;
			}
		} catch {}
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
		const boltGeo = new BoxGeometry(.12, .12, 1.1);
		for (let i = 0; i < 90; i++) {
			const mesh = new Mesh(boltGeo, this.mats.boltP);
			mesh.visible = false;
			this.scene.add(mesh);
			this.bolts.push({
				live: false,
				x: 0,
				z: 0,
				y: 1,
				vx: 0,
				vz: 0,
				life: 0,
				dmg: 0,
				faction: "player",
				mesh
			});
		}
		for (let i = 0; i < 18; i++) {
			const mesh = new Group();
			const body = new Mesh(new CylinderGeometry(.08, .12, .9, 5), this.mats.missile);
			body.rotation.x = Math.PI / 2;
			mesh.add(body);
			const fin = new Mesh(new BoxGeometry(.42, .04, .22), this.mats.metal);
			fin.position.z = -.2;
			mesh.add(fin);
			mesh.visible = false;
			this.scene.add(mesh);
			this.missiles.push({
				live: false,
				x: 0,
				z: 0,
				y: 1.2,
				yaw: 0,
				speed: 0,
				life: 0,
				dmg: 0,
				faction: "player",
				target: -1,
				mesh
			});
		}
		const pGeo = new SphereGeometry(1, 6, 4);
		for (let i = 0; i < 70; i++) {
			const mesh = new Mesh(pGeo, this.mats.particle.clone());
			mesh.visible = false;
			this.scene.add(mesh);
			this.puffs.push({
				live: false,
				x: 0,
				y: 0,
				z: 0,
				vx: 0,
				vy: 0,
				vz: 0,
				life: 0,
				max: 1,
				size: 1,
				mesh
			});
		}
		const pkGeo = new OctahedronGeometry(.55, 0);
		for (let i = 0; i < 12; i++) {
			const mesh = new Mesh(pkGeo, this.mats.glass);
			mesh.visible = false;
			this.scene.add(mesh);
			this.pickups.push({
				live: false,
				x: 0,
				z: 0,
				kind: "cash",
				life: 0,
				mesh
			});
		}
	}
	buildPlanets() {
		const hex = PLANET_DEF.length;
		for (let i = 0; i < hex; i++) {
			const def = PLANET_DEF[i];
			const a = i / hex * Math.PI * 2 - Math.PI / 2;
			const dist = 88 + i % 2 * 18;
			const x = Math.cos(a) * dist;
			const z = Math.sin(a) * dist;
			const g = new Group();
			const tex = makePlanetTexture(110 + i * 97, def.base, def.accent);
			const mat = new MeshStandardMaterial({
				map: tex,
				roughness: .72,
				metalness: .12
			});
			const sphere = new Mesh(new SphereGeometry(def.r, 28, 18), mat);
			sphere.position.y = def.r * .35;
			g.add(sphere);
			if (i % 2 === 0) {
				const ring = new Mesh(new RingGeometry(def.r * 1.25, def.r * 1.55, 36), new MeshStandardMaterial({
					color: 9082014,
					side: 2,
					transparent: true,
					opacity: .35,
					roughness: .6
				}));
				ring.rotation.x = Math.PI / 2;
				ring.position.y = def.r * .35;
				g.add(ring);
			}
			const station = new Mesh(new TorusGeometry(def.r * .55, .35, 6, 18), this.mats.metal);
			station.rotation.x = Math.PI / 2;
			station.position.y = 1.2;
			g.add(station);
			const cap = new Mesh(new RingGeometry(def.r + 6, def.r + 7.2, 48), this.mats.ringN);
			cap.rotation.x = Math.PI / 2;
			cap.position.y = .08;
			g.add(cap);
			g.position.set(x, 0, z);
			this.scene.add(g);
			let owner = "enemy";
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
				station
			});
			this.tintPlanet(this.planets[i]);
		}
	}
	tintPlanet(p) {
		p.ring.material = p.owner === "player" ? this.mats.ringP : p.owner === "enemy" ? this.mats.ringE : this.mats.ringN;
	}
	scatterRocks() {
		this.rocks = [];
		for (let i = 0; i < 36; i++) {
			let x = 0;
			let z = 0;
			let ok = false;
			for (let t = 0; t < 12 && !ok; t++) {
				x = (Math.random() * 2 - 1) * 190;
				z = (Math.random() * 2 - 1) * 190;
				ok = this.planets.every((p) => Math.hypot(p.x - x, p.z - z) > p.r + 14) && Math.hypot(x, z) > 22;
			}
			const r = 1.2 + Math.random() * 2.4;
			this.rocks.push({
				x,
				z,
				r,
				hp: 28 + r * 10,
				spin: (Math.random() - .5) * .4
			});
			this.dummy.position.set(x, r * .6, z);
			this.dummy.rotation.set(Math.random(), Math.random(), Math.random());
			this.dummy.scale.setScalar(r);
			this.dummy.updateMatrix();
			this.rockMesh.setMatrixAt(i, this.dummy.matrix);
		}
		this.rockMesh.instanceMatrix.needsUpdate = true;
	}
	spawnPlayer(keepCredits) {
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
	makeShip(kind, faction, x, z, yaw) {
		const mesh = makeShip(kind, this.mats);
		this.scene.add(mesh);
		const blob = new Mesh(new CircleGeometry(1.4, 12), this.mats.blob);
		blob.rotation.x = -Math.PI / 2;
		blob.position.y = .05;
		this.scene.add(blob);
		const stats = this.kindStats(kind);
		return {
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
			fireCd: .4 + Math.random() * .4,
			missileCd: 2 + Math.random(),
			command: "follow",
			targetId: -1,
			patrolId: Math.random() * this.planets.length | 0,
			holdX: x,
			holdZ: z,
			flash: 0,
			iFrame: 0,
			bank: 0,
			alive: true,
			mesh,
			blob
		};
	}
	kindStats(kind) {
		switch (kind) {
			case "player": return {
				hp: 280,
				shield: 180,
				r: 1.6,
				max: 42,
				turn: 2.5
			};
			case "escort": return {
				hp: 90,
				shield: 40,
				r: 1.15,
				max: 34,
				turn: 2.6
			};
			case "interceptor": return {
				hp: 70,
				shield: 24,
				r: 1.05,
				max: 44,
				turn: 3.1
			};
			case "bomber": return {
				hp: 120,
				shield: 30,
				r: 1.4,
				max: 28,
				turn: 1.8
			};
			case "hunter": return {
				hp: 80,
				shield: 20,
				r: 1.2,
				max: 32,
				turn: 2.2
			};
			case "elite": return {
				hp: 160,
				shield: 50,
				r: 1.55,
				max: 30,
				turn: 1.9
			};
			default: return {
				hp: 100,
				shield: 40,
				r: 1.3,
				max: 18,
				turn: 1.6
			};
		}
	}
	retire(s) {
		s.alive = false;
		s.mesh.visible = false;
		s.blob.visible = false;
		this.scene.remove(s.mesh);
		this.scene.remove(s.blob);
	}
	player() {
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
		const elite = this.makeShip("elite", "enemy", -70, -80, .4);
		elite.patrolId = 4;
		this.ships.push(elite);
	}
	setPaused(v) {
		if (this.phase === "dead" || this.phase === "menu") return;
		if (v) this.phase = "pause";
		else this.phase = "play";
		this.publish();
	}
	setShop(v) {
		if (this.phase === "dead" || this.phase === "menu") return;
		this.phase = v ? "shop" : "play";
		this.publish();
	}
	toggleMute() {
		this.muted = !this.muted;
		this.audio.setMuted(this.muted);
		this.publish();
	}
	setGlobalCommand(cmd) {
		this.command = cmd;
		for (const s of this.ships) if (s.alive && s.faction === "player" && s.kind !== "player") s.command = cmd;
		this.toast(`ЭСКАДРА: ${COMMAND_LABEL[cmd]}`, "good");
	}
	setAllyCommand(id, cmd) {
		const s = this.ships.find((x) => x.id === id);
		if (!s || s.faction !== "player") return;
		s.command = cmd;
		this.toast(`${KIND_LABEL[s.kind]}: ${COMMAND_LABEL[cmd]}`, "info");
	}
	allyCount() {
		return this.ships.filter((s) => s.alive && s.faction === "player" && s.kind !== "player").length;
	}
	buy(id) {
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
			me.iFrame = Math.max(me.iFrame, .6);
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
	toast(text, kind) {
		this.toasts.push({
			id: this.toastId++,
			text,
			kind
		});
		if (this.toasts.length > 4) this.toasts.shift();
	}
	start() {
		if (this.running) return;
		this.running = true;
		this.last = performance.now();
		const loop = (now) => {
			if (!this.running || this.disposed) return;
			this.raf = requestAnimationFrame(loop);
			let dt = (now - this.last) / 1e3;
			this.last = now;
			dt = Math.min(dt, .1);
			this.acc += dt;
			let steps = 0;
			while (this.acc >= STEP && steps < 5) {
				this.step(STEP);
				this.acc -= STEP;
				steps++;
			}
			this.render(dt);
			this.hudAcc += dt;
			if (this.hudAcc > .08) {
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
	step(dt) {
		const edges = this.input.consumeEdges();
		if (this.phase === "play") {
			if (edges.pause) this.setPaused(true);
			if (edges.shop) this.setShop(true);
			if (edges.cmd) this.setGlobalCommand(edges.cmd);
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
	controlPlayer(me, acts, dt) {
		const stats = this.kindStats("player");
		me.yaw += acts.steer * stats.turn * dt;
		const want = acts.thrust * stats.max * (acts.boost && this.boost > .08 ? 1.55 : 1);
		me.speed += (want - me.speed) * (1 - Math.exp(-4.2 * dt));
		const fx = -Math.sin(me.yaw);
		const fz = -Math.cos(me.yaw);
		me.x += fx * me.speed * dt;
		me.z += fz * me.speed * dt;
		me.bank += (acts.steer * .55 - me.bank) * (1 - Math.exp(-8 * dt));
		if (acts.boost && this.boost > .1) {
			this.boost = Math.max(0, this.boost - dt * .55);
			me.iFrame = Math.max(me.iFrame, .12);
			if (acts.justBoost) {
				this.audio.boost();
				me.iFrame = .55;
				this.burst(me.x, me.y, me.z, 12965086, 10, 8);
			}
		} else this.boost = Math.min(1, this.boost + dt * .18);
		if (acts.fire && me.fireCd <= 0) this.fireBolt(me);
		if (acts.justMissile) this.fireMissile(me);
	}
	updateShips(dt) {
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
	think(s, dt, me) {
		const stats = this.kindStats(s.kind);
		let tx = s.x;
		let tz = s.z;
		let wantSpeed = stats.max * .7;
		let shoot = false;
		let missile = false;
		if (s.faction === "enemy") {
			const threat = this.closest(s, "player");
			const distT = threat ? Math.hypot(threat.x - s.x, threat.z - s.z) : 999;
			if (s.kind === "guard") {
				const home = this.planets[s.patrolId] ?? this.planets[0];
				const a = this.time * .35 + s.id;
				tx = home.x + Math.cos(a) * (home.r + 11);
				tz = home.z + Math.sin(a) * (home.r + 11);
				wantSpeed = stats.max;
				if (threat && distT < 55) {
					tx = threat.x;
					tz = threat.z;
					shoot = distT < 38;
				}
			} else if (threat && distT < (s.kind === "elite" ? 90 : 62)) {
				tx = threat.x;
				tz = threat.z;
				wantSpeed = stats.max;
				shoot = distT < 42;
				missile = s.kind === "elite" && distT < 55 && s.missileCd <= 0;
			} else {
				const p = this.planets[s.patrolId] ?? this.pickPlayerPlanet() ?? this.planets[0];
				tx = p.x;
				tz = p.z;
				if (Math.hypot(s.x - p.x, s.z - p.z) < p.r + 14) s.patrolId = this.nextPatrol(s);
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
				wantSpeed = Math.max(stats.max * .4, me.speed * 1.05);
				if (foe && fd < 48) {
					tx = foe.x;
					tz = foe.z;
					shoot = fd < 36;
				}
			} else if (cmd === "defend") {
				const home = this.ownedPlanet() ?? this.planets[0];
				const a = this.time * .5 + s.id;
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
					const p = this.planets.find((pl) => pl.owner === "enemy") ?? this.planets[2];
					tx = p.x;
					tz = p.z;
				}
			} else if (cmd === "capture") {
				const p = this.planets.find((pl) => pl.owner !== "player") ?? this.planets[0];
				tx = p.x;
				tz = p.z;
				wantSpeed = stats.max * .85;
				if (foe && fd < 32) {
					shoot = true;
					tx = foe.x;
					tz = foe.z;
				}
			} else {
				tx = s.holdX;
				tz = s.holdZ;
				wantSpeed = 8;
				if (foe && fd < 40) shoot = fd < 34;
			}
		}
		const wantYaw = yawTo(tx - s.x, tz - s.z);
		s.yaw = turnToward(s.yaw, wantYaw, stats.turn, dt);
		const dist = Math.hypot(tx - s.x, tz - s.z);
		const arrive = Math.max(.2, Math.min(1, dist / 18));
		s.speed += (wantSpeed * arrive - s.speed) * (1 - Math.exp(-3.2 * dt));
		const fx = -Math.sin(s.yaw);
		const fz = -Math.cos(s.yaw);
		s.x += fx * s.speed * dt;
		s.z += fz * s.speed * dt;
		const steerVis = Math.max(-1, Math.min(1, angNorm(wantYaw - s.yaw) * 1.4));
		s.bank += (steerVis * .45 - s.bank) * (1 - Math.exp(-6 * dt));
		if (shoot && s.fireCd <= 0) this.fireBolt(s);
		if (missile) this.fireMissile(s);
	}
	nextPatrol(s) {
		if (Math.random() < .45) {
			const owned = this.planets.filter((p) => p.owner === "player");
			if (owned.length) return owned[Math.random() * owned.length | 0].id;
		}
		return (s.patrolId + 1 + (Math.random() * 3 | 0)) % this.planets.length;
	}
	pickPlayerPlanet() {
		const list = this.planets.filter((p) => p.owner === "player");
		return list.length ? list[Math.random() * list.length | 0] : null;
	}
	ownedPlanet() {
		return this.planets.find((p) => p.owner === "player") ?? null;
	}
	closest(from, faction) {
		let best = null;
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
	collideWorld(s) {
		for (const p of this.planets) {
			const d = Math.hypot(s.x - p.x, s.z - p.z);
			const min = p.r + s.radius * .4;
			if (d < min && d > .001) {
				const k = (min - d) / d;
				s.x += (s.x - p.x) * k;
				s.z += (s.z - p.z) * k;
				s.speed *= .7;
			}
		}
		for (let i = 0; i < this.rocks.length; i++) {
			const r = this.rocks[i];
			if (r.hp <= 0) continue;
			const d = Math.hypot(s.x - r.x, s.z - r.z);
			if (d < r.r + s.radius) {
				const k = (r.r + s.radius - d) / Math.max(.001, d);
				s.x += (s.x - r.x) * k;
				s.z += (s.z - r.z) * k;
				s.speed *= .65;
				if (s.kind === "player") this.hurt(s, 4 * STEP * 18, false);
			}
		}
		s.x = Math.max(-210, Math.min(WORLD, s.x));
		s.z = Math.max(-210, Math.min(WORLD, s.z));
	}
	shipBumps() {
		for (let i = 0; i < this.ships.length; i++) {
			const a = this.ships[i];
			if (!a.alive) continue;
			for (let j = i + 1; j < this.ships.length; j++) {
				const b = this.ships[j];
				if (!b.alive) continue;
				const dx = b.x - a.x;
				const dz = b.z - a.z;
				const d2 = dx * dx + dz * dz;
				const min = a.radius + b.radius;
				if (d2 < min * min && d2 > 1e-4) {
					const d = Math.sqrt(d2);
					const push = (min - d) / d * .5;
					a.x -= dx * push;
					a.z -= dz * push;
					b.x += dx * push;
					b.z += dz * push;
				}
			}
		}
	}
	fireBolt(s) {
		this.kindStats(s.kind);
		s.fireCd = s.kind === "player" ? Math.max(.09, .16 - this.cannonLevel * .018) : s.kind === "interceptor" ? .18 : s.kind === "guard" ? .42 : .28;
		const bolt = this.bolts.find((b) => !b.live);
		if (!bolt) return;
		const fx = -Math.sin(s.yaw);
		const fz = -Math.cos(s.yaw);
		const spd = 78 + (s.kind === "player" ? 10 : 0);
		bolt.live = true;
		bolt.x = s.x + fx * (s.radius + .8);
		bolt.z = s.z + fz * (s.radius + .8);
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
	fireMissile(s) {
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
		m.y = s.y + .2;
		m.yaw = s.yaw;
		m.speed = 38;
		m.life = 3.6;
		m.dmg = s.kind === "player" ? 42 : 28;
		m.faction = s.faction;
		m.target = foe?.id ?? -1;
		m.mesh.visible = true;
		this.audio.missile();
	}
	lockTarget(s) {
		const fx = -Math.sin(s.yaw);
		const fz = -Math.cos(s.yaw);
		let best = null;
		let bestS = 0;
		for (const o of this.ships) {
			if (!o.alive || o.faction === s.faction) continue;
			const dx = o.x - s.x;
			const dz = o.z - s.z;
			const d = Math.hypot(dx, dz);
			if (d > 95 || d < 2) continue;
			const dot = (dx * fx + dz * fz) / d;
			if (dot < .45) continue;
			const score = dot * 40 + (95 - d);
			if (score > bestS) {
				bestS = score;
				best = o;
			}
		}
		return best;
	}
	acquireLock(me) {
		const t = this.lockTarget(me);
		if (t) {
			this.lockName = KIND_LABEL[t.kind];
			this.lockDist = Math.hypot(t.x - me.x, t.z - me.z);
		} else {
			this.lockName = "";
			this.lockDist = 0;
		}
	}
	updateBolts(dt) {
		for (const b of this.bolts) {
			if (!b.live) continue;
			b.life -= dt;
			b.x += b.vx * dt;
			b.z += b.vz * dt;
			if (b.life <= 0 || Math.abs(b.x) > 218 || Math.abs(b.z) > 218) {
				this.killBolt(b);
				continue;
			}
			let hit = false;
			for (const s of this.ships) {
				if (!s.alive || s.faction === b.faction) continue;
				const dx = s.x - b.x;
				const dz = s.z - b.z;
				if (dx * dx + dz * dz < (s.radius + .45) ** 2) {
					this.hurt(s, b.dmg, true);
					this.burst(b.x, b.y, b.z, b.faction === "player" ? 12969198 : 15247520, 6, 7);
					this.killBolt(b);
					hit = true;
					break;
				}
			}
			if (hit) continue;
			for (let i = 0; i < this.rocks.length; i++) {
				const r = this.rocks[i];
				if (r.hp <= 0) continue;
				if ((r.x - b.x) ** 2 + (r.z - b.z) ** 2 < (r.r + .4) ** 2) {
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
	updateMissiles(dt) {
		for (const m of this.missiles) {
			if (!m.live) continue;
			m.life -= dt;
			const tgt = this.ships.find((s) => s.id === m.target && s.alive);
			if (tgt) {
				const want = yawTo(tgt.x - m.x, tgt.z - m.z);
				m.yaw = turnToward(m.yaw, want, 3.4, dt);
			} else {
				const nt = this.closest({
					x: m.x,
					z: m.z,
					id: -1,
					faction: m.faction
				}, m.faction === "player" ? "enemy" : "player");
				if (nt) m.target = nt.id;
			}
			m.speed = Math.min(64, m.speed + dt * 28);
			const fx = -Math.sin(m.yaw);
			const fz = -Math.cos(m.yaw);
			m.x += fx * m.speed * dt;
			m.z += fz * m.speed * dt;
			this.puff(m.x - fx * .6, m.y, m.z - fz * .6, .4, 11059404);
			if (m.life <= 0) {
				this.explode(m.x, m.y, m.z, m.faction, m.dmg * .4, 4);
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
	explode(x, y, z, faction, dmg, radius) {
		this.burst(x, y, z, 14673646, 16, 14);
		this.audio.explode();
		this.trauma = Math.min(1, this.trauma + .35);
		for (const s of this.ships) {
			if (!s.alive || s.faction === faction) continue;
			const d = Math.hypot(s.x - x, s.z - z);
			if (d < radius + s.radius) this.hurt(s, dmg * (1 - d / (radius + 4)), true);
		}
	}
	hurt(s, dmg, fromWeapon) {
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
			this.trauma = Math.min(1, this.trauma + .18);
			this.audio.hit();
		}
		if (s.hp <= 0) this.killShip(s);
	}
	killShip(s) {
		if (!s.alive) return;
		s.alive = false;
		s.mesh.visible = false;
		s.blob.visible = false;
		this.burst(s.x, s.y, s.z, s.faction === "enemy" ? 15247520 : 12969198, 20, 16);
		this.audio.explode();
		this.trauma = Math.min(1, this.trauma + (s.kind === "player" ? .7 : .28));
		if (s.kind === "player") {
			this.phase = "dead";
			this.score += this.kills * 20 + this.planets.filter((p) => p.owner === "player").length * 80;
			if (this.score > this.highScore) {
				this.highScore = this.score;
				try {
					localStorage.setItem(SAVE_KEY, JSON.stringify({
						version: 1,
						highScore: this.highScore
					}));
				} catch {}
			}
			this.toast("КОРАБЛЬ СБИТ", "bad");
			return;
		}
		if (s.faction === "enemy") {
			this.kills += 1;
			this.score += s.kind === "elite" ? 80 : s.kind === "guard" ? 35 : 22;
			this.credits += s.kind === "elite" ? 40 : 14;
			if (Math.random() < .55) this.drop(s.x, s.z, Math.random() < .33 ? "repair" : Math.random() < .5 ? "ammo" : "cash");
		}
	}
	drop(x, z, kind) {
		const p = this.pickups.find((i) => !i.live);
		if (!p) return;
		p.live = true;
		p.x = x;
		p.z = z;
		p.kind = kind;
		p.life = 18;
		p.mesh.visible = true;
		p.mesh.material = kind === "repair" ? this.mats.engineAlly : kind === "ammo" ? this.mats.engine : this.mats.glass;
	}
	updatePickups(dt, me) {
		for (const p of this.pickups) {
			if (!p.live) continue;
			p.life -= dt;
			p.mesh.position.set(p.x, 1.1 + Math.sin(this.time * 3 + p.x) * .25, p.z);
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
	updateCapture(dt, me) {
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
				if (Math.hypot(s.x - p.x, s.z - p.z) > p.r + 16) continue;
				if (s.faction === "player" && s.kind !== "player") presP += s.kind === "bomber" ? 1.3 : .8;
				if (s.faction === "enemy") presE += s.kind === "elite" ? 1.2 : .7;
			}
			const delta = (presP - presE) * dt * .22;
			if (Math.abs(delta) > 1e-4) p.capture = Math.max(-1, Math.min(1, p.capture + delta));
			const prev = p.owner;
			if (p.capture > .72) p.owner = "player";
			else if (p.capture < -.72) p.owner = "enemy";
			else if (Math.abs(p.capture) < .18) p.owner = "neutral";
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
	refillAtBase(me, dt) {
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
			const x = edge === 0 ? -202 : edge === 1 ? 202 : (Math.random() * 2 - 1) * WORLD;
			const z = edge === 2 ? -202 : edge === 3 ? 202 : (Math.random() * 2 - 1) * WORLD;
			const kind = big && i === 0 ? "elite" : "hunter";
			const h = this.makeShip(kind, "enemy", x, z, yawTo(-x, -z));
			h.patrolId = Math.random() * this.planets.length | 0;
			this.ships.push(h);
		}
	}
	breakRock(i) {
		const r = this.rocks[i];
		r.hp = 0;
		this.dummy.scale.setScalar(0);
		this.dummy.position.set(0, -20, 0);
		this.dummy.updateMatrix();
		this.rockMesh.setMatrixAt(i, this.dummy.matrix);
		this.rockMesh.instanceMatrix.needsUpdate = true;
		this.burst(r.x, 1, r.z, 10134704, 8, 6);
		this.credits += 6;
		if (Math.random() < .25) this.drop(r.x, r.z, "cash");
	}
	keepBounds() {}
	cullDead() {
		if (this.ships.length > 48) this.ships = this.ships.filter((s) => {
			if (s.alive) return true;
			this.scene.remove(s.mesh);
			this.scene.remove(s.blob);
			return false;
		});
	}
	puff(x, y, z, size, _c) {
		const p = this.puffs.find((i) => !i.live);
		if (!p) return;
		p.live = true;
		p.x = x;
		p.y = y;
		p.z = z;
		p.vx = (Math.random() - .5) * 2;
		p.vy = .6;
		p.vz = (Math.random() - .5) * 2;
		p.life = .28;
		p.max = .28;
		p.size = size;
		p.mesh.visible = true;
	}
	burst(x, y, z, color, n, spd) {
		for (let i = 0; i < n; i++) {
			const p = this.puffs.find((q) => !q.live);
			if (!p) break;
			p.live = true;
			p.x = x;
			p.y = y;
			p.z = z;
			const a = Math.random() * Math.PI * 2;
			p.vx = Math.cos(a) * Math.random() * spd;
			p.vy = (Math.random() - .2) * spd * .5;
			p.vz = Math.sin(a) * Math.random() * spd;
			p.life = .35 + Math.random() * .4;
			p.max = p.life;
			p.size = .18 + Math.random() * .35;
			p.mesh.material.color.setHex(color);
			p.mesh.visible = true;
		}
	}
	updatePuffs(dt) {
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
			p.mesh.scale.setScalar(p.size * (.4 + (1 - k) * 1.4));
			p.mesh.material.opacity = k;
		}
	}
	killBolt(b) {
		b.live = false;
		b.mesh.visible = false;
	}
	killMissile(m) {
		m.live = false;
		m.mesh.visible = false;
	}
	syncShip(s) {
		const fx = -Math.sin(s.yaw);
		const fz = -Math.cos(s.yaw);
		s.mesh.position.set(s.x, s.y, s.z);
		this.tmp.set(s.x + fx, s.y, s.z + fz);
		s.mesh.lookAt(this.tmp);
		s.mesh.rotateZ(s.bank);
		s.blob.position.set(s.x, .05, s.z);
		s.blob.scale.setScalar(s.radius * .85);
	}
	render(dt) {
		const me = this.player();
		if (this.phase === "menu" || !me) {
			const t = performance.now() / 1e3;
			this.camera.position.set(Math.cos(t * .12) * 70, 28, Math.sin(t * .12) * 70);
			this.look.set(this.planets[0]?.x ?? 0, 4, this.planets[0]?.z ?? 0);
			this.camera.lookAt(this.look);
		} else {
			const fx = -Math.sin(me.yaw);
			const fz = -Math.cos(me.yaw);
			const follow = 11.5 + Math.min(7, me.speed * .1);
			const height = 5.6 + Math.min(3.2, me.speed * .04);
			this.tmp.set(me.x - fx * follow, me.y + height, me.z - fz * follow);
			const k = 1 - Math.exp(-4.2 * dt);
			this.cam.lerp(this.tmp, k);
			this.look.set(me.x + fx * 10, me.y + .4, me.z + fz * 10);
			const shake = this.reduced ? 0 : this.trauma * this.trauma;
			this.camera.position.set(this.cam.x + (Math.random() - .5) * shake * 1.4, this.cam.y + (Math.random() - .5) * shake * .8, this.cam.z + (Math.random() - .5) * shake * 1.4);
			this.camera.lookAt(this.look);
		}
		for (const p of this.planets) {
			p.mesh.children[0].rotation.y += dt * .08;
			p.station.rotation.z += dt * .4;
		}
		this.renderer.render(this.scene, this.camera);
	}
	canBuyMap() {
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
			cannonUp: c >= PRICES.cannonUp && this.cannonLevel < 6
		};
	}
	publish() {
		const me = this.player();
		const mini = [];
		for (const p of this.planets) mini.push({
			x: p.x / WORLD,
			z: p.z / WORLD,
			kind: "planet",
			owner: p.owner
		});
		for (const s of this.ships) {
			if (!s.alive) continue;
			mini.push({
				x: s.x / WORLD,
				z: s.z / WORLD,
				kind: s.kind === "player" ? "me" : s.faction === "player" ? "ally" : "enemy",
				yaw: s.yaw
			});
		}
		pushHud({
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
			planets: this.planets.map((p) => ({
				id: p.id,
				name: p.name,
				owner: p.owner,
				capture: p.capture,
				income: p.income
			})),
			allies: this.ships.filter((s) => s.alive && s.faction === "player" && s.kind !== "player").map((s) => ({
				id: s.id,
				kind: s.kind,
				hp: s.hp,
				maxHp: s.maxHp,
				command: s.command
			})),
			mini,
			meYaw: me?.yaw ?? 0,
			shopHint: this.nearBase ? "РЕМОНТ У БАЗЫ" : "",
			highScore: this.highScore,
			muted: this.muted,
			canBuy: this.canBuyMap(),
			prices: { ...PRICES },
			hullLevel: this.hullLevel,
			cannonLevel: this.cannonLevel
		});
	}
	wireProbe() {
		const g = this;
		window.__controlsTest = {
			getYaw: () => g.player()?.yaw ?? 0,
			getSpeed: () => Math.abs(g.player()?.speed ?? 0),
			setSteer: (v) => g.input.setSteer(v),
			setKeys: (codes) => {
				if (g.phase === "menu" || g.phase === "dead") g.beginRun();
				if (g.phase === "pause" || g.phase === "shop") g.phase = "play";
				g.input.setKeys(codes);
			}
		};
	}
	dispose() {
		this.disposed = true;
		this.stop();
		this.input.detach();
		window.removeEventListener("resize", this.onResize);
		this.renderer.dispose();
		this.scene.traverse((o) => {
			const m = o;
			if (m.geometry) m.geometry.dispose();
		});
		delete window.__controlsTest;
	}
};
var COMMANDS = [
	"follow",
	"defend",
	"hunt",
	"capture",
	"hold"
];
var SHOP = [
	{
		id: "escort",
		name: "Эскорт",
		blurb: "Держится рядом и закрывает корпус"
	},
	{
		id: "interceptor",
		name: "Перехватчик",
		blurb: "Гоняется за охотниками, ловит ракеты"
	},
	{
		id: "bomber",
		name: "Штурмовик",
		blurb: "Давит базы и стражей"
	},
	{
		id: "missiles",
		name: "Кассета ракет",
		blurb: "+4 наводящиеся"
	},
	{
		id: "repair",
		name: "Ремкомплект",
		blurb: "+90 корпуса"
	},
	{
		id: "overcharge",
		name: "Перезаряд щита",
		blurb: "Полный щит и краткий имун"
	},
	{
		id: "hullUp",
		name: "Броня +",
		blurb: "Запас корпуса и щита"
	},
	{
		id: "cannonUp",
		name: "Орудия +",
		blurb: "Скорострельность и урон"
	}
];
function GameView() {
	const canvasRef = (0, import_react.useRef)(null);
	const gameRef = (0, import_react.useRef)(null);
	const hud = useHud();
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const game = new Game(canvas);
		gameRef.current = game;
		useHud.getState().bind(game);
		game.start();
		return () => {
			useHud.getState().bind(null);
			game.dispose();
			gameRef.current = null;
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 h-full w-full touch-none",
				onContextMenu: (e) => e.preventDefault()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudChrome, {}),
			hud.phase === "menu" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartScreen, {}),
			hud.phase === "pause" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PauseScreen, {}),
			hud.phase === "shop" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopScreen, {}),
			hud.phase === "dead" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeadScreen, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchControls, {
				gameRef,
				visible: hud.phase === "play"
			})
		]
	});
}
function HudChrome() {
	const hud = useHud();
	if (hud.phase === "menu") return null;
	const hullPct = Math.max(0, hud.hull / hud.maxHull);
	const shieldPct = Math.max(0, hud.shield / hud.maxShield);
	const playing = hud.phase === "play";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-10 font-sans",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "absolute top-0 right-0 left-0 flex items-start justify-between gap-3 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] sm:px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-sm tracking-[0.28em] text-fg",
							children: "AEGIS"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[10px] tracking-[0.18em] text-muted uppercase",
							children: ["волна ", hud.wave]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 font-display text-[11px] tracking-[0.14em] text-muted tabular-nums uppercase",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["счёт ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "ml-1 font-medium text-fg",
								children: hud.score
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "hidden sm:inline",
								children: ["кр ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
									className: "ml-1 font-medium text-accent",
									children: hud.credits
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden md:inline",
								children: fmtTime(hud.time)
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto flex gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							onClick: () => hud.mute(),
							label: hud.muted ? "Звук" : "Без звука",
							children: hud.muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" })
						}), playing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							onClick: () => hud.pause(),
							label: "Пауза",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" })
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-12 left-3 w-[min(16rem,calc(100%-1.5rem))] sm:top-14 sm:left-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						label: "Корпус",
						value: hullPct,
						tone: "hull"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						label: "Щит",
						value: shieldPct,
						tone: "shield"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center gap-3 text-[10px] tracking-[0.14em] text-muted uppercase",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Rocket, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
									className: "font-display text-fg tabular-nums",
									children: [
										hud.missiles,
										"/",
										hud.maxMissiles
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
									className: "font-display text-fg tabular-nums",
									children: Math.round(hud.boost * 100)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-display text-fg tabular-nums sm:hidden",
								children: [hud.credits, " кр"]
							})
						]
					}),
					hud.lockName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 flex items-center gap-1 text-[10px] tracking-[0.16em] text-accent uppercase",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crosshair, { className: "size-3" }),
							"захват ",
							hud.lockName,
							" · ",
							hud.lockDist | 0,
							"м"
						]
					}) : null,
					hud.nearBase ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 flex items-center gap-1 text-[10px] tracking-[0.16em] text-ok uppercase",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "size-3" }), " ремонт у базы"]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "absolute top-12 right-3 hidden w-40 md:block sm:right-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mb-2 flex items-center gap-1 font-display text-[10px] tracking-[0.22em] text-muted uppercase",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "size-3" }), " базы"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: hud.planets.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between text-[10px] tracking-[0.08em]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: p.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: p.owner === "player" ? "text-ok" : p.owner === "enemy" ? "text-hull" : "text-muted",
							children: p.owner === "player" ? "наша" : p.owner === "enemy" ? "враг" : "спор"
						})]
					}, p.id))
				})]
			}),
			hud.capturing && hud.phase === "play" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-1/2 left-1/2 w-52 -translate-x-1/2 -translate-y-16",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mb-1 text-center font-display text-[10px] tracking-[0.22em] text-accent uppercase",
					children: ["захват ", hud.capturing]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-1 overflow-hidden rounded-full bg-surface-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-ok transition-[width] duration-[var(--motion-fast)]",
						style: { width: `${Math.round(hud.captureProgress * 100)}%` }
					})
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] hidden sm:block sm:right-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimap, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 hidden max-w-56 sm:block sm:left-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-1 font-display text-[10px] tracking-[0.2em] text-muted uppercase",
					children: "эскадра"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: hud.allies.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-[10px] text-muted",
						children: "Пусто · E ангар"
					}) : hud.allies.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex w-full items-center justify-between rounded-sm border border-line bg-surface/80 px-2 py-1 text-left text-[10px] tracking-[0.08em] text-fg",
						onClick: () => {
							const next = COMMANDS[(COMMANDS.indexOf(a.command) + 1) % COMMANDS.length];
							hud.allyCommand(a.id, next);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: KIND_LABEL[a.kind] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: COMMAND_LABEL[a.command]
						})]
					}) }, a.id))
				})]
			}),
			hud.phase === "play" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto absolute bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] left-1/2 flex -translate-x-1/2 gap-1 sm:bottom-6",
				children: COMMANDS.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => hud.issueCommand(c),
					className: "min-h-11 rounded-md border px-2 font-display text-[9px] tracking-[0.12em] uppercase sm:px-3 " + (hud.command === c ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface/80 text-muted"),
					children: [
						i + 1,
						" ",
						COMMAND_LABEL[c]
					]
				}, c))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "absolute top-24 right-3 flex max-w-[14rem] flex-col items-end gap-1 sm:top-14 sm:right-52",
				children: hud.toasts.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-sm border border-line bg-surface/90 px-2 py-1 font-display text-[10px] tracking-[0.14em] uppercase " + (t.kind === "bad" ? "text-hull" : t.kind === "good" ? "text-ok" : "text-accent"),
					children: t.text
				}, t.id))
			})
		]
	});
}
function Bar({ label, value, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-0.5 flex justify-between text-[9px] tracking-[0.16em] text-muted uppercase",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "tabular-nums",
				children: Math.round(value * 100)
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-1.5 overflow-hidden rounded-full bg-surface-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full " + (tone === "hull" ? "bg-hull" : "bg-shield"),
				style: { width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }
			})
		})]
	});
}
function Minimap() {
	const ref = (0, import_react.useRef)(null);
	const mini = useHud((s) => s.mini);
	const yaw = useHud((s) => s.meYaw);
	(0, import_react.useEffect)(() => {
		const c = ref.current;
		if (!c) return;
		const ctx = c.getContext("2d");
		if (!ctx) return;
		const w = c.width;
		const h = c.height;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = "#0c1016";
		ctx.fillRect(0, 0, w, h);
		ctx.strokeStyle = "#262c36";
		ctx.strokeRect(.5, .5, w - 1, h - 1);
		const to = (x, z) => [(x * .5 + .5) * w, (z * .5 + .5) * h];
		for (const m of mini) {
			const [px, py] = to(m.x, m.z);
			if (m.kind === "planet") {
				ctx.fillStyle = m.owner === "player" ? "#7a9e86" : m.owner === "enemy" ? "#c97878" : "#8b939e";
				ctx.beginPath();
				ctx.arc(px, py, 3.2, 0, Math.PI * 2);
				ctx.fill();
			} else if (m.kind === "me") {
				ctx.save();
				ctx.translate(px, py);
				ctx.rotate(m.yaw ?? yaw);
				ctx.fillStyle = "#c5ced6";
				ctx.beginPath();
				ctx.moveTo(0, -5);
				ctx.lineTo(3.2, 4);
				ctx.lineTo(-3.2, 4);
				ctx.closePath();
				ctx.fill();
				ctx.restore();
			} else {
				ctx.fillStyle = m.kind === "ally" ? "#7a9e86" : "#c97878";
				ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
			}
		}
	}, [mini, yaw]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none overflow-hidden rounded-lg border border-line bg-surface/80 p-1",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref,
			width: 148,
			height: 148,
			className: "block size-[148px]"
		})
	});
}
function StartScreen() {
	const start = useHud((s) => s.start);
	const high = useHud((s) => s.highScore);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex items-center justify-center bg-bg/70 px-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-[11px] tracking-[0.32em] text-muted uppercase",
					children: "орбитальный флот · 2.99D"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-5xl leading-none tracking-[0.18em] text-fg sm:text-6xl",
					children: "AEGIS"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-md text-sm leading-relaxed text-muted",
					children: "Захватывай планетарные базы, нанимай эскадрилью, которая понимает приказы, и держи систему против дежурных охотников. Наводящиеся ракеты, щит и рывок — тебя сложно сбить."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: start,
					className: "mt-6 min-h-12 w-full rounded-lg bg-accent px-4 font-display text-sm tracking-[0.28em] text-accent-fg transition-transform duration-[var(--motion-quick)] hover:opacity-90 active:scale-[0.98]",
					children: "Start"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] tracking-[0.04em] text-muted sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-[10px] tracking-[0.16em] uppercase",
							children: "Курс"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-fg",
							children: "W/S тяга · A/D поворот"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-[10px] tracking-[0.16em] uppercase",
							children: "Огонь"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-fg",
							children: "Пробел · F ракеты · Shift рывок"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-[10px] tracking-[0.16em] uppercase",
							children: "Эскадра"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-fg",
							children: "1–4 приказы · клик по союзнику"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-[10px] tracking-[0.16em] uppercase",
							children: "Ангар"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "text-fg",
							children: "E магазин · базы дают кредиты"
						})] })
					]
				}),
				high > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 font-display text-[11px] tracking-[0.16em] text-muted uppercase",
					children: ["рекорд ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg tabular-nums",
						children: high
					})]
				}) : null
			]
		})
	});
}
function PauseScreen() {
	const hud = useHud();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex items-center justify-center bg-bg/70 px-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl tracking-[0.18em] text-fg",
				children: "ПАУЗА"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuBtn, {
						onClick: () => hud.resume(),
						children: "Продолжить"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuBtn, {
						onClick: () => hud.openShop(true),
						tone: "ghost",
						children: "Ангар"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuBtn, {
						onClick: () => hud.mute(),
						tone: "ghost",
						children: hud.muted ? "Включить звук" : "Выключить звук"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuBtn, {
						onClick: () => hud.retry(),
						tone: "ghost",
						children: "Заново"
					})
				]
			})]
		})
	});
}
function ShopScreen() {
	const hud = useHud();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex items-center justify-center bg-bg/70 px-4 py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-full w-full max-w-lg overflow-auto rounded-xl border border-line bg-surface p-5 sm:p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl tracking-[0.16em] text-fg",
					children: "АНГАР"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-muted",
					children: [
						"Кредиты ",
						hud.credits,
						" · слоты ",
						hud.allies.length,
						"/6 · брон ",
						hud.hullLevel,
						" · калибр ",
						hud.cannonLevel
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => hud.openShop(false),
					className: "min-h-11 rounded-md border border-line px-3 text-xs tracking-[0.14em] text-muted uppercase",
					children: "Закрыть"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4 grid gap-2",
				children: SHOP.map((item) => {
					const ok = hud.canBuy[item.id];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: !ok,
						onClick: () => hud.buyItem(item.id),
						className: "flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-3 text-left disabled:opacity-40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-display text-sm tracking-[0.08em] text-fg",
							children: item.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block text-[11px] text-muted",
							children: item.blurb
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-sm tabular-nums text-accent",
							children: hud.prices[item.id]
						})]
					}) }, item.id);
				})
			})]
		})
	});
}
function DeadScreen() {
	const hud = useHud();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex items-center justify-center bg-bg/75 px-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-[11px] tracking-[0.28em] text-hull uppercase",
					children: "потерян контакт"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-3xl tracking-[0.12em] text-fg",
					children: "СБИТ"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-5 grid grid-cols-2 gap-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Счёт",
							v: hud.score
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Рекорд",
							v: hud.highScore
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Сбито",
							v: hud.kills
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Базы",
							v: `${hud.planetsOwned}/${hud.planetsTotal}`
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => hud.retry(),
					className: "mt-6 min-h-12 w-full rounded-lg bg-accent font-display text-sm tracking-[0.24em] text-accent-fg uppercase",
					children: "Start"
				})
			]
		})
	});
}
function Stat({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-[10px] tracking-[0.16em] text-muted uppercase",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "font-display text-lg tabular-nums text-fg",
		children: v
	})] });
}
function MenuBtn({ children, onClick, tone = "solid" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "min-h-12 rounded-lg font-display text-sm tracking-[0.18em] uppercase " + (tone === "solid" ? "bg-accent text-accent-fg" : "border border-line bg-transparent text-fg"),
		children
	});
}
function IconBtn({ children, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		onClick,
		className: "inline-flex size-11 items-center justify-center rounded-md border border-line bg-surface/80 text-fg",
		children
	});
}
function TouchControls({ gameRef, visible }) {
	const zone = (0, import_react.useRef)(null);
	if (!visible) return null;
	const setFire = (v) => {
		const i = gameRef.current?.input;
		if (i) i.touchFire = v;
	};
	const setMissile = (v) => {
		const i = gameRef.current?.input;
		if (i) i.touchMissile = v;
	};
	const setBoost = (v) => {
		const i = gameRef.current?.input;
		if (i) i.touchBoost = v;
	};
	const onStick = (e) => {
		const el = zone.current;
		const i = gameRef.current?.input;
		if (!el || !i) return;
		const r = el.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width * 2 - 1;
		const y = (e.clientY - r.top) / r.height * 2 - 1;
		i.touchSteer = Math.max(-1, Math.min(1, -x));
		i.touchThrust = Math.max(-1, Math.min(1, -y));
	};
	const clearStick = () => {
		const i = gameRef.current?.input;
		if (!i) return;
		i.touchSteer = 0;
		i.touchThrust = 0;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-10 sm:hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: zone,
			className: "pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 size-[132px] rounded-full border border-line bg-surface/50",
			onPointerDown: (e) => {
				e.currentTarget.setPointerCapture(e.pointerId);
				onStick(e);
			},
			onPointerMove: (e) => {
				if (e.currentTarget.hasPointerCapture(e.pointerId)) onStick(e);
			},
			onPointerUp: clearStick,
			onPointerCancel: clearStick
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
					label: "Рывок",
					onHold: setBoost
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
					label: "Ракеты",
					onHold: setMissile
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchBtn, {
					label: "Огонь",
					onHold: setFire,
					primary: true
				})
			]
		})]
	});
}
function TouchBtn({ label, onHold, primary }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "min-h-12 min-w-20 rounded-lg border px-3 font-display text-[10px] tracking-[0.16em] uppercase " + (primary ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface/80 text-fg"),
		onPointerDown: (e) => {
			e.preventDefault();
			onHold(true);
		},
		onPointerUp: () => onHold(false),
		onPointerCancel: () => onHold(false),
		onPointerLeave: () => onHold(false),
		children: label
	});
}
function fmtTime(t) {
	const s = Math.max(0, t | 0);
	return `${s / 60 | 0}:${(s % 60).toString().padStart(2, "0")}`;
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameView, {});
}
//#endregion
export { Home as component };
