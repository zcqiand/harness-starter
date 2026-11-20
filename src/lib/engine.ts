import {
  BOARD_COLS,
  BOARD_ROWS,
  PORTAL_A,
  PORTAL_B,
  type Cell,
  type Pos,
} from "./board";
import { rngInt } from "./rng";
import type { RuleId } from "../rules/ids";

// @impl M01.F01.I02 — cellGrid 格网派生；M01.F02.I01 createGame / I02 queueDir / I03 tick / I04 tickIntervalMs（function-tree M01）

export type Dir = "up" | "down" | "left" | "right";

export interface GameState {
  seed: number;
  rngState: number;
  tickCount: number;
  snake: Pos[];
  dir: Dir;
  queuedDirs: Dir[];
  food: Pos;
  gold: { pos: Pos; ttl: number } | null;
  foodsEaten: number;
  goldRush: number;
  score: number;
  status: "playing" | "over";
  deathCause: null | "wall" | "self";
}

export type RuleEvent = { ruleId: RuleId; payload?: Record<string, number | string> };

const DELTAS: Record<Dir, Pos> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function samePos(a: Pos, b: Pos): boolean {
  return a.x === b.x && a.y === b.y;
}

/** 空位派生（普通食与金共用）：拒绝采样——rngInt(400) 换算 (x=v%20, y=floor(v/20))，
 * 撞 occupied（蛇身/传送门/已有食或金）则继续采样，rngState 随采样次数前进。
 * 无空格（蛇占满棋盘减传送门，实际不可达——无胜利条件、长度 398 封顶）时返回 null：
 * 调用方按「冻结旧位、status 保持 playing」的文档化退化 no-op 处理，不挂起、不崩溃。 */
function deriveFood(rngState: number, occupied: Pos[]): [Pos, number] | null {
  const blocked = new Set<number>();
  for (const p of [...occupied, PORTAL_A, PORTAL_B]) {
    blocked.add(p.y * BOARD_COLS + p.x);
  }
  if (blocked.size >= BOARD_COLS * BOARD_ROWS) return null;
  let s = rngState;
  for (let i = 0; i < 100000; i++) {
    const [v, ns] = rngInt(s, BOARD_COLS * BOARD_ROWS);
    s = ns;
    if (!blocked.has(v)) return [{ x: v % BOARD_COLS, y: Math.floor(v / BOARD_COLS) }, s];
  }
  return null;
}

/** 建局：缺省蛇头 (10,10) 向右、身 [(10,10),(9,10),(8,10)]，food 由 rng 派生空格；
 * init 提供的 Partial 字段逐项覆盖（显式给 food 则直接采用、不耗 rng）。 */
export function createGame(seed: number, init?: Partial<GameState>): GameState {
  const base: GameState = {
    seed,
    rngState: seed,
    tickCount: 0,
    snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
    dir: "right",
    queuedDirs: [],
    food: { x: 0, y: 0 },
    gold: null,
    foodsEaten: 0,
    goldRush: 0,
    score: 0,
    status: "playing",
    deathCause: null,
    ...init,
  };
  if (init?.food === undefined) {
    // init 显式给金时，建局派生食同样避金格
    const occupied = init?.gold ? [...base.snake, init.gold.pos] : base.snake;
    const derived = deriveFood(base.rngState, occupied);
    if (derived) {
      base.food = derived[0];
      base.rngState = derived[1];
    }
  }
  return base;
}

/** 转向入队：最多 2 个；与队尾（队空则当前 dir）同向或反向均不入队。 */
export function queueDir(state: GameState, dir: Dir): GameState {
  const last = state.queuedDirs.length > 0
    ? state.queuedDirs[state.queuedDirs.length - 1]
    : state.dir;
  if (dir === last || dir === OPPOSITE[last]) return state;
  if (state.queuedDirs.length >= 2) return state;
  return { ...state, queuedDirs: [...state.queuedDirs, dir] };
}

/** 单步推进。顺序：出队转向 → 算新头 → 越界判 wall → 门映射（每 tick 至多一次，
 * 落点按置换后坐标进撞身判断）→ 撞身判 self（吃食全身判，否则先去尾）→
 * 金消费/TTL → goldRush 递减 → 生长/前进与进食派生 → speed-step → 事件收集。
 * status=over 时原状态原样返回、空事件（死亡 tick 金/rush 与蛇一并冻结）。 */
export function tick(state: GameState): { state: GameState; events: RuleEvent[] } {
  if (state.status === "over") return { state, events: [] };

  const dir = state.queuedDirs[0] ?? state.dir;
  const queuedDirs = state.queuedDirs.slice(1);
  const tickCount = state.tickCount + 1;
  const prevHead = state.snake[0];
  const delta = DELTAS[dir];
  const rawHead: Pos = { x: prevHead.x + delta.x, y: prevHead.y + delta.y };

  const events: RuleEvent[] = [];

  const outOfBounds =
    rawHead.x < 0 ||
    rawHead.x >= BOARD_COLS ||
    rawHead.y < 0 ||
    rawHead.y >= BOARD_ROWS;
  if (outOfBounds) {
    return {
      state: { ...state, dir, queuedDirs, tickCount, status: "over", deathCause: "wall" },
      events: [{ ruleId: "wall-death", payload: { x: rawHead.x, y: rawHead.y } }],
    };
  }

  // 门映射：新头踩门即置换对端，单次；落点撞身按 S4 判（蛇身自然跟随，无特殊处理）
  let head = rawHead;
  if (samePos(rawHead, PORTAL_A) || samePos(rawHead, PORTAL_B)) {
    head = samePos(rawHead, PORTAL_A) ? { ...PORTAL_B } : { ...PORTAL_A };
    events.push({ ruleId: "portal-jump", payload: { x: head.x, y: head.y } });
  }

  const willEat = samePos(head, state.food);
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
  if (bodyToCheck.some((p) => samePos(p, head))) {
    return {
      state: { ...state, dir, queuedDirs, tickCount, status: "over", deathCause: "self" },
      events: [{ ruleId: "self-bite", payload: { x: head.x, y: head.y } }],
    };
  }

  const snake = willEat
    ? [head, ...state.snake]
    : [head, ...state.snake.slice(0, -1)];

  const prevSteps = Math.floor(state.score / 5);
  let { rngState, food, foodsEaten, score } = state;
  let goldRush = state.goldRush > 0 ? state.goldRush - 1 : 0;
  let gold = state.gold;

  // 金：消费（新头进金格：+5、rush=3、不生长不加 foodsEaten）或 TTL 递减到 0（无声过期）
  if (gold && samePos(head, gold.pos)) {
    score += 5;
    goldRush = 3;
    gold = null;
    events.push({ ruleId: "gold-food", payload: { phase: "consume" } });
  } else if (gold) {
    const ttl = gold.ttl - 1;
    gold = ttl > 0 ? { pos: gold.pos, ttl } : null;
    if (gold === null) events.push({ ruleId: "gold-food", payload: { phase: "expire" } });
  }

  if (willEat) {
    foodsEaten += 1;
    score += 1;
    events.push({ ruleId: "eat-food", payload: { score } });
    // 新普通食与金都从同一 rngState 顺序派生；食避金格、金避食格
    const derived = deriveFood(rngState, gold ? [...snake, gold.pos] : snake);
    if (derived) {
      food = derived[0];
      rngState = derived[1];
    } // else：无空格退化——冻结旧食位、保持 playing（文档化 no-op）
    if (foodsEaten % 3 === 0) {
      const g = deriveFood(rngState, [...snake, food]);
      if (g) {
        gold = { pos: g[0], ttl: 40 };
        rngState = g[1];
        events.push({ ruleId: "gold-food", payload: { phase: "spawn" } });
      }
    }
  }

  // speed-step：floor(score/5) 较 tick 前增大时发（goldRush 起止不发，UI 从 gold-food 消费）
  if (Math.floor(score / 5) > prevSteps) {
    events.push({ ruleId: "speed-step" });
  }

  return {
    state: {
      ...state,
      snake,
      dir,
      queuedDirs,
      tickCount,
      rngState,
      food,
      gold,
      foodsEaten,
      goldRush,
      score,
    },
    events,
  };
}

/** 每 tick 毫秒数：160 * 0.85^floor(score/5)，下限 80；goldRush>0 时再 ×0.6。 */
export function tickIntervalMs(state: GameState): number {
  const steps = Math.floor(state.score / 5);
  let ms = 160 * Math.pow(0.85, steps);
  if (ms < 80) ms = 80;
  if (state.goldRush > 0) ms *= 0.6;
  return ms;
}

/** 渲染用 20x20 格网：全 empty 底，门常驻，蛇全段 snake，食 food，金 gold（食/金永不同格）。 */
export function cellGrid(state: GameState): Cell[][] {
  const grid: Cell[][] = Array.from({ length: BOARD_ROWS }, () =>
    Array<Cell>(BOARD_COLS).fill("empty"),
  );
  grid[PORTAL_A.y][PORTAL_A.x] = "portal_a";
  grid[PORTAL_B.y][PORTAL_B.x] = "portal_b";
  for (const p of state.snake) grid[p.y][p.x] = "snake";
  grid[state.food.y][state.food.x] = "food";
  if (state.gold) grid[state.gold.pos.y][state.gold.pos.x] = "gold";
  return grid;
}
