import { useEffect, useRef, useState } from "react";
import { cellGrid, createGame, queueDir, tick, tickIntervalMs } from "./lib/engine";
import type { Dir, GameState, RuleEvent } from "./lib/engine";
import type { RuleId } from "./rules/ids";
import { RULES } from "./rules/registry";
import type { RuleMeta } from "./rules/registry";
import { loadBest, saveBest } from "./lib/scorebook";
import BoardView from "./ui/BoardView";
import Hud from "./ui/Hud";
import RuleSidebar from "./ui/RuleSidebar";
import ProvenancePanel from "./ui/ProvenancePanel";
import type { Receipt } from "./ui/ProvenancePanel";
import receipt from "../evidence/latest.json";

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

const LIT_MS = 1500;
const TYPED_RECEIPT: Receipt = receipt;

const newSeed = () => Date.now() % 2 ** 31;

/** ch6 页面：蛇可玩 + 规则徽标触发点亮（1.5s）+ 溯源三件套（规约引文/断言锚/证据回执）。
 * 输入走 ref 队列（≤2、拒反向），定时循环按 tickIntervalMs 驱动 tick；死亡进终局屏，
 * Space 换新种子重开；破纪录终局时 best-score 徽标一并点亮。 */
export default function App() {
  const [state, setState] = useState<GameState>(() => createGame(newSeed()));
  const [lit, setLit] = useState<Set<RuleId>>(() => new Set());
  const [selected, setSelected] = useState<RuleMeta | null>(null);
  const [best, setBest] = useState<number>(() => loadBest());
  const queueRef = useRef<Dir[]>([]);
  const stateRef = useRef(state);
  const litTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 卸载时清掉未触发的点亮定时器，避免卸载后 setState
  useEffect(() => {
    const timers = litTimersRef;
    return () => {
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
    };
  }, []);

  const light = (ids: RuleId[]) => {
    if (ids.length === 0) return;
    setLit((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
    const t = setTimeout(() => {
      setLit((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    }, LIT_MS);
    litTimersRef.current.push(t);
  };

  // 主循环：playing 才排下一 tick；死亡 tick 结束后终局结算（含破纪录点亮 best-score）
  useEffect(() => {
    if (state.status !== "playing") return;
    const t = setTimeout(() => {
      const dir = queueRef.current.shift();
      const queued = dir ? queueDir(state, dir) : state;
      const { state: next, events }: { state: GameState; events: RuleEvent[] } = tick(queued);
      setState(next);
      light(events.map((e) => e.ruleId));
      if (next.status === "over") {
        const prevBest = loadBest();
        if (next.score > prevBest) {
          saveBest(next.score);
          setBest(next.score);
          light(["best-score"]);
        } else {
          setBest(prevBest);
        }
      }
    }, tickIntervalMs(state));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // 键盘：方向键/WASD 入 ref 队列（规则同 engine.queueDir），Space 在终局屏重开
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_DIRS[e.key];
      if (dir) {
        e.preventDefault();
        const q = queueRef.current;
        const last = q.length > 0 ? q[q.length - 1] : stateRef.current.dir;
        if (dir !== last && dir !== OPPOSITE[last] && q.length < 2) q.push(dir);
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        if (stateRef.current.status === "over") {
          queueRef.current = [];
          setLit(new Set());
          setState(createGame(newSeed()));
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-1">harness-starter · 可溯源规则贪吃蛇</h1>
      <p className="text-sm text-slate-500 mb-4">
        每条规则徽标可点开：规约引文 / 断言锚 / 证据回执三件套；规则触发时徽标点亮 1.5s。
      </p>
      <Hud score={state.score} speedLevel={Math.floor(state.score / 5)} best={best} />
      <div className="flex gap-6 flex-wrap items-start">
        <BoardView grid={cellGrid(state)} />
        <RuleSidebar rules={RULES} lit={lit} onOpen={setSelected} />
      </div>
      {selected ? (
        <ProvenancePanel rule={selected} receipt={TYPED_RECEIPT} />
      ) : (
        <p className="mt-4 text-sm text-slate-400">点侧栏任意徽标查看溯源三件套。</p>
      )}
      {state.status === "over" && (
        <div
          aria-label="game-over"
          className="mt-4 rounded border-2 border-red-400 bg-red-50 p-4"
        >
          <p className="text-lg font-bold text-red-800">终局！本局分数 {state.score}</p>
          <p className="text-sm text-red-700">死因：{state.deathCause === "wall" ? "撞墙" : "咬身"}</p>
          <p className="text-sm text-red-700 mt-1">按 Space 重开（新种子）</p>
        </div>
      )}
    </main>
  );
}
