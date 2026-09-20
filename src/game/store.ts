import { create } from "zustand";
import { COMMAND_LABEL, PRICES, type Command, type HudSnapshot, type ShopId } from "./types";

export const initialHud: HudSnapshot = {
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
    cannonUp: false,
  },
  prices: { ...PRICES },
  hullLevel: 1,
  cannonLevel: 1,
};

export interface GameApi {
  beginRun: () => void;
  setPaused: (v: boolean) => void;
  setShop: (v: boolean) => void;
  buy: (id: ShopId) => void;
  setGlobalCommand: (cmd: Command) => void;
  setAllyCommand: (id: number, cmd: Command) => void;
  toggleMute: () => void;
}

let api: GameApi | null = null;

type Actions = {
  bind: (next: GameApi | null) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  openShop: (open: boolean) => void;
  buyItem: (id: ShopId) => void;
  issueCommand: (cmd: Command) => void;
  allyCommand: (id: number, cmd: Command) => void;
  mute: () => void;
  retry: () => void;
};

export const useHud = create<HudSnapshot & Actions>()((set) => ({
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
    set({ command: cmd, shopHint: COMMAND_LABEL[cmd] });
  },
  allyCommand: (id, cmd) => api?.setAllyCommand(id, cmd),
  mute: () => api?.toggleMute(),
  retry: () => api?.beginRun(),
}));

export function pushHud(snap: HudSnapshot) {
  useHud.setState(snap);
}
