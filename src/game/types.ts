export type Faction = "player" | "enemy" | "neutral";

export type Command = "follow" | "defend" | "hunt" | "capture" | "hold";

export type ShipKind =
  | "player"
  | "escort"
  | "interceptor"
  | "bomber"
  | "hunter"
  | "elite"
  | "guard";

export type ShopId =
  | "escort"
  | "interceptor"
  | "bomber"
  | "missiles"
  | "repair"
  | "overcharge"
  | "hullUp"
  | "cannonUp";

export type Phase = "menu" | "play" | "pause" | "shop" | "dead";

export type ToastKind = "info" | "bad" | "good";

export interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
}

export interface MiniMark {
  x: number;
  z: number;
  kind: "me" | "ally" | "enemy" | "planet" | "pickup";
  owner?: Faction;
  yaw?: number;
}

export interface PlanetHud {
  id: number;
  name: string;
  owner: Faction;
  capture: number;
  income: number;
}

export interface AllyHud {
  id: number;
  kind: ShipKind;
  hp: number;
  maxHp: number;
  command: Command;
}

export interface HudSnapshot {
  phase: Phase;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  missiles: number;
  maxMissiles: number;
  credits: number;
  score: number;
  kills: number;
  time: number;
  wave: number;
  boost: number;
  lockName: string;
  lockDist: number;
  command: Command;
  planetsOwned: number;
  planetsTotal: number;
  nearBase: boolean;
  capturing: string;
  captureProgress: number;
  toasts: Toast[];
  planets: PlanetHud[];
  allies: AllyHud[];
  mini: MiniMark[];
  meYaw: number;
  shopHint: string;
  highScore: number;
  muted: boolean;
  canBuy: Record<ShopId, boolean>;
  prices: Record<ShopId, number>;
  hullLevel: number;
  cannonLevel: number;
}

export const PRICES: Record<ShopId, number> = {
  escort: 180,
  interceptor: 240,
  bomber: 320,
  missiles: 70,
  repair: 55,
  overcharge: 90,
  hullUp: 420,
  cannonUp: 380,
};

export const COMMAND_LABEL: Record<Command, string> = {
  follow: "СЛЕДОВАТЬ",
  defend: "ДЕРЖАТЬ",
  hunt: "ОХОТА",
  capture: "ЗАХВАТ",
  hold: "СТОЯТЬ",
};

export const KIND_LABEL: Record<ShipKind, string> = {
  player: "ВЕКТОР",
  escort: "ЭСКОРТ",
  interceptor: "ПЕРЕХВАТ",
  bomber: "ШТУРМ",
  hunter: "ОХОТНИК",
  elite: "ЭЛИТА",
  guard: "СТРАЖ",
};
