import { useEffect, useRef, type PointerEvent, type ReactNode, type RefObject } from "react";
import {
  Crosshair,
  Flag,
  Pause,
  Rocket,
  Shield,
  Volume2,
  VolumeX,
  Wrench,
} from "lucide-react";
import { Game } from "@/game/engine";
import { useHud } from "@/game/store";
import { COMMAND_LABEL, KIND_LABEL, type Command, type ShopId } from "@/game/types";

const COMMANDS: Command[] = ["follow", "defend", "hunt", "capture", "hold"];

const SHOP: { id: ShopId; name: string; blurb: string }[] = [
  { id: "escort", name: "Эскорт", blurb: "Держится рядом и закрывает корпус" },
  { id: "interceptor", name: "Перехватчик", blurb: "Гоняется за охотниками, ловит ракеты" },
  { id: "bomber", name: "Штурмовик", blurb: "Давит базы и стражей" },
  { id: "missiles", name: "Кассета ракет", blurb: "+4 наводящиеся" },
  { id: "repair", name: "Ремкомплект", blurb: "+90 корпуса" },
  { id: "overcharge", name: "Перезаряд щита", blurb: "Полный щит и краткий имун" },
  { id: "hullUp", name: "Броня +", blurb: "Запас корпуса и щита" },
  { id: "cannonUp", name: "Орудия +", blurb: "Скорострельность и урон" },
];

export function GameView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const hud = useHud();

  useEffect(() => {
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

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        onContextMenu={(e) => e.preventDefault()}
      />
      <HudChrome />
      {hud.phase === "menu" && <StartScreen />}
      {hud.phase === "pause" && <PauseScreen />}
      {hud.phase === "shop" && <ShopScreen />}
      {hud.phase === "dead" && <DeadScreen />}
      <TouchControls gameRef={gameRef} visible={hud.phase === "play"} />
    </div>
  );
}

function HudChrome() {
  const hud = useHud();
  if (hud.phase === "menu") return null;
  const hullPct = Math.max(0, hud.hull / hud.maxHull);
  const shieldPct = Math.max(0, hud.shield / hud.maxShield);
  const playing = hud.phase === "play";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-sans">
      <header className="absolute top-0 right-0 left-0 flex items-start justify-between gap-3 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] sm:px-5">
        <div className="pointer-events-auto flex items-center gap-2">
          <p className="font-display text-sm tracking-[0.28em] text-fg">AEGIS</p>
          <span className="text-[10px] tracking-[0.18em] text-muted uppercase">
            волна {hud.wave}
          </span>
        </div>
        <div className="flex items-center gap-3 font-display text-[11px] tracking-[0.14em] text-muted tabular-nums uppercase">
          <span>
            счёт <b className="ml-1 font-medium text-fg">{hud.score}</b>
          </span>
          <span className="hidden sm:inline">
            кр <b className="ml-1 font-medium text-accent">{hud.credits}</b>
          </span>
          <span className="hidden md:inline">
            {fmtTime(hud.time)}
          </span>
        </div>
        <div className="pointer-events-auto flex gap-1">
          <IconBtn onClick={() => hud.mute()} label={hud.muted ? "Звук" : "Без звука"}>
            {hud.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </IconBtn>
          {playing && (
            <IconBtn onClick={() => hud.pause()} label="Пауза">
              <Pause className="size-4" />
            </IconBtn>
          )}
        </div>
      </header>

      <div className="absolute top-12 left-3 w-[min(16rem,calc(100%-1.5rem))] sm:top-14 sm:left-5">
        <Bar label="Корпус" value={hullPct} tone="hull" />
        <Bar label="Щит" value={shieldPct} tone="shield" />
        <div className="mt-2 flex items-center gap-3 text-[10px] tracking-[0.14em] text-muted uppercase">
          <span className="inline-flex items-center gap-1">
            <Rocket className="size-3" />
            <b className="font-display text-fg tabular-nums">
              {hud.missiles}/{hud.maxMissiles}
            </b>
          </span>
          <span className="inline-flex items-center gap-1">
            <Shield className="size-3" />
            <b className="font-display text-fg tabular-nums">{Math.round(hud.boost * 100)}</b>
          </span>
          <span className="font-display text-fg tabular-nums sm:hidden">{hud.credits} кр</span>
        </div>
        {hud.lockName ? (
          <p className="mt-2 flex items-center gap-1 text-[10px] tracking-[0.16em] text-accent uppercase">
            <Crosshair className="size-3" />
            захват {hud.lockName} · {hud.lockDist | 0}м
          </p>
        ) : null}
        {hud.nearBase ? (
          <p className="mt-1 flex items-center gap-1 text-[10px] tracking-[0.16em] text-ok uppercase">
            <Wrench className="size-3" /> ремонт у базы
          </p>
        ) : null}
      </div>

      <aside className="absolute top-12 right-3 hidden w-40 md:block sm:right-5">
        <p className="mb-2 flex items-center gap-1 font-display text-[10px] tracking-[0.22em] text-muted uppercase">
          <Flag className="size-3" /> базы
        </p>
        <ul className="space-y-1">
          {hud.planets.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-[10px] tracking-[0.08em]">
              <span className="text-muted">{p.name}</span>
              <span
                className={
                  p.owner === "player" ? "text-ok" : p.owner === "enemy" ? "text-hull" : "text-muted"
                }
              >
                {p.owner === "player" ? "наша" : p.owner === "enemy" ? "враг" : "спор"}
              </span>
            </li>
          ))}
        </ul>
      </aside>

      {hud.capturing && hud.phase === "play" ? (
        <div className="absolute top-1/2 left-1/2 w-52 -translate-x-1/2 -translate-y-16">
          <p className="mb-1 text-center font-display text-[10px] tracking-[0.22em] text-accent uppercase">
            захват {hud.capturing}
          </p>
          <div className="h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-ok transition-[width] duration-[var(--motion-fast)]"
              style={{ width: `${Math.round(hud.captureProgress * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="absolute right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] hidden sm:block sm:right-5">
        <Minimap />
      </div>

      <div className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 hidden max-w-56 sm:block sm:left-5">
        <p className="mb-1 font-display text-[10px] tracking-[0.2em] text-muted uppercase">эскадра</p>
        <ul className="space-y-1">
          {hud.allies.length === 0 ? (
            <li className="text-[10px] text-muted">Пусто · E ангар</li>
          ) : (
            hud.allies.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-sm border border-line bg-surface/80 px-2 py-1 text-left text-[10px] tracking-[0.08em] text-fg"
                  onClick={() => {
                    const i = COMMANDS.indexOf(a.command);
                    const next = COMMANDS[(i + 1) % COMMANDS.length]!;
                    hud.allyCommand(a.id, next);
                  }}
                >
                  <span>{KIND_LABEL[a.kind]}</span>
                  <span className="text-muted">{COMMAND_LABEL[a.command]}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {hud.phase === "play" && (
        <div className="pointer-events-auto absolute bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] left-1/2 flex -translate-x-1/2 gap-1 sm:bottom-6">
          {COMMANDS.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => hud.issueCommand(c)}
              className={
                "min-h-11 rounded-md border px-2 font-display text-[9px] tracking-[0.12em] uppercase sm:px-3 " +
                (hud.command === c
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line bg-surface/80 text-muted")
              }
            >
              {i + 1} {COMMAND_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      <ul className="absolute top-24 right-3 flex max-w-[14rem] flex-col items-end gap-1 sm:top-14 sm:right-52">
        {hud.toasts.map((t) => (
          <li
            key={t.id}
            className={
              "rounded-sm border border-line bg-surface/90 px-2 py-1 font-display text-[10px] tracking-[0.14em] uppercase " +
              (t.kind === "bad" ? "text-hull" : t.kind === "good" ? "text-ok" : "text-accent")
            }
          >
            {t.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bar({ label, value, tone }: { label: string; value: number; tone: "hull" | "shield" }) {
  return (
    <div className="mb-1">
      <div className="mb-0.5 flex justify-between text-[9px] tracking-[0.16em] text-muted uppercase">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className={"h-full " + (tone === "hull" ? "bg-hull" : "bg-shield")}
          style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mini = useHud((s) => s.mini);
  const yaw = useHud((s) => s.meYaw);

  useEffect(() => {
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
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    const to = (x: number, z: number) => [(x * 0.5 + 0.5) * w, (z * 0.5 + 0.5) * h] as const;
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

  return (
    <div className="pointer-events-none overflow-hidden rounded-lg border border-line bg-surface/80 p-1">
      <canvas ref={ref} width={148} height={148} className="block size-[148px]" />
    </div>
  );
}

function StartScreen() {
  const start = useHud((s) => s.start);
  const high = useHud((s) => s.highScore);
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/70 px-5">
      <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
        <p className="font-display text-[11px] tracking-[0.32em] text-muted uppercase">орбитальный флот · 2.99D</p>
        <h1 className="mt-2 font-display text-5xl leading-none tracking-[0.18em] text-fg sm:text-6xl">AEGIS</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          Захватывай планетарные базы, нанимай эскадрилью, которая понимает приказы, и держи систему
          против дежурных охотников. Наводящиеся ракеты, щит и рывок — тебя сложно сбить.
        </p>
        <button
          type="button"
          onClick={start}
          className="mt-6 min-h-12 w-full rounded-lg bg-accent px-4 font-display text-sm tracking-[0.28em] text-accent-fg transition-transform duration-[var(--motion-quick)] hover:opacity-90 active:scale-[0.98]"
        >
          Start
        </button>
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] tracking-[0.04em] text-muted sm:grid-cols-2">
          <div>
            <dt className="text-[10px] tracking-[0.16em] uppercase">Курс</dt>
            <dd className="text-fg">W/S тяга · A/D поворот</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.16em] uppercase">Огонь</dt>
            <dd className="text-fg">Пробел · F ракеты · Shift рывок</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.16em] uppercase">Эскадра</dt>
            <dd className="text-fg">1–4 приказы · клик по союзнику</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.16em] uppercase">Ангар</dt>
            <dd className="text-fg">E магазин · базы дают кредиты</dd>
          </div>
        </dl>
        {high > 0 ? (
          <p className="mt-4 font-display text-[11px] tracking-[0.16em] text-muted uppercase">
            рекорд <span className="text-fg tabular-nums">{high}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PauseScreen() {
  const hud = useHud();
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/70 px-5">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6">
        <h2 className="font-display text-2xl tracking-[0.18em] text-fg">ПАУЗА</h2>
        <div className="mt-5 flex flex-col gap-2">
          <MenuBtn onClick={() => hud.resume()}>Продолжить</MenuBtn>
          <MenuBtn onClick={() => hud.openShop(true)} tone="ghost">
            Ангар
          </MenuBtn>
          <MenuBtn onClick={() => hud.mute()} tone="ghost">
            {hud.muted ? "Включить звук" : "Выключить звук"}
          </MenuBtn>
          <MenuBtn onClick={() => hud.retry()} tone="ghost">
            Заново
          </MenuBtn>
        </div>
      </div>
    </div>
  );
}

function ShopScreen() {
  const hud = useHud();
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/70 px-4 py-8">
      <div className="max-h-full w-full max-w-lg overflow-auto rounded-xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-[0.16em] text-fg">АНГАР</h2>
            <p className="mt-1 text-xs text-muted">
              Кредиты {hud.credits} · слоты {hud.allies.length}/6 · брон {hud.hullLevel} · калибр {hud.cannonLevel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => hud.openShop(false)}
            className="min-h-11 rounded-md border border-line px-3 text-xs tracking-[0.14em] text-muted uppercase"
          >
            Закрыть
          </button>
        </div>
        <ul className="mt-4 grid gap-2">
          {SHOP.map((item) => {
            const ok = hud.canBuy[item.id];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!ok}
                  onClick={() => hud.buyItem(item.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-3 text-left disabled:opacity-40"
                >
                  <span>
                    <span className="block font-display text-sm tracking-[0.08em] text-fg">{item.name}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">{item.blurb}</span>
                  </span>
                  <span className="font-display text-sm tabular-nums text-accent">{hud.prices[item.id]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function DeadScreen() {
  const hud = useHud();
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/75 px-5">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6">
        <p className="font-display text-[11px] tracking-[0.28em] text-hull uppercase">потерян контакт</p>
        <h2 className="mt-2 font-display text-3xl tracking-[0.12em] text-fg">СБИТ</h2>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Stat k="Счёт" v={hud.score} />
          <Stat k="Рекорд" v={hud.highScore} />
          <Stat k="Сбито" v={hud.kills} />
          <Stat k="Базы" v={`${hud.planetsOwned}/${hud.planetsTotal}`} />
        </dl>
        <button
          type="button"
          onClick={() => hud.retry()}
          className="mt-6 min-h-12 w-full rounded-lg bg-accent font-display text-sm tracking-[0.24em] text-accent-fg uppercase"
        >
          Start
        </button>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: number | string }) {
  return (
    <div>
      <dt className="text-[10px] tracking-[0.16em] text-muted uppercase">{k}</dt>
      <dd className="font-display text-lg tabular-nums text-fg">{v}</dd>
    </div>
  );
}

function MenuBtn({
  children,
  onClick,
  tone = "solid",
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "solid" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "min-h-12 rounded-lg font-display text-sm tracking-[0.18em] uppercase " +
        (tone === "solid"
          ? "bg-accent text-accent-fg"
          : "border border-line bg-transparent text-fg")
      }
    >
      {children}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center rounded-md border border-line bg-surface/80 text-fg"
    >
      {children}
    </button>
  );
}

function TouchControls({
  gameRef,
  visible,
}: {
  gameRef: RefObject<Game | null>;
  visible: boolean;
}) {
  const zone = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  const setFire = (v: boolean) => {
    const i = gameRef.current?.input;
    if (i) i.touchFire = v;
  };
  const setMissile = (v: boolean) => {
    const i = gameRef.current?.input;
    if (i) i.touchMissile = v;
  };
  const setBoost = (v: boolean) => {
    const i = gameRef.current?.input;
    if (i) i.touchBoost = v;
  };

  const onStick = (e: PointerEvent<HTMLDivElement>) => {
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

  return (
    <div className="pointer-events-none absolute inset-0 z-10 sm:hidden">
      <div
        ref={zone}
        className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 size-[132px] rounded-full border border-line bg-surface/50"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onStick(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) onStick(e);
        }}
        onPointerUp={clearStick}
        onPointerCancel={clearStick}
      />
      <div className="pointer-events-auto absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-2">
        <TouchBtn label="Рывок" onHold={setBoost} />
        <TouchBtn label="Ракеты" onHold={setMissile} />
        <TouchBtn label="Огонь" onHold={setFire} primary />
      </div>
    </div>
  );
}

function TouchBtn({
  label,
  onHold,
  primary,
}: {
  label: string;
  onHold: (v: boolean) => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={
        "min-h-12 min-w-20 rounded-lg border px-3 font-display text-[10px] tracking-[0.16em] uppercase " +
        (primary ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface/80 text-fg")
      }
      onPointerDown={(e) => {
        e.preventDefault();
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onPointerLeave={() => onHold(false)}
    >
      {label}
    </button>
  );
}

function fmtTime(t: number) {
  const s = Math.max(0, t | 0);
  const m = (s / 60) | 0;
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
