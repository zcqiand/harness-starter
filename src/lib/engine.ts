import {
  BOARD_COLS,
  BOARD_ROWS,
  PORTAL_A,
  PORTAL_B,
  type Pos,
} from "./board";
import { rngInt } from "./rng";
import type { RuleId } from "../rules/ids";

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

/** 食物派生：拒绝采样——rngInt(400) 换算 (x=v%20, y=floor(v/20))，
 * 撞蛇身或传送门则继续采样，rngState 随采样次数前进。 */
function deriveFood(rngState: number, snake: Pos[]): [Pos, number] {
  let s = rngState;
  for (;;) {
    const [v, ns] = rngInt(s, BOARD_COLS * BOARD_ROWS);
    s = ns;
    const p: Pos = { x: v % BOARD_COLS, y: Math.floor(v / BOARD_COLS) };
    const onSnake = snake.some((q) => samePos(q, p));
    const onPortal = samePos(p, PORTAL_A) || samePos(p, PORTAL_B);
    if (!onSnake && !onPortal) return [p, s];
  }
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
    const [food, rngState] = deriveFood(base.rngState, base.snake);
    base.food = food;
    base.rngState = rngState;
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

/** 单步推进。顺序：出队转向 → 算新头 → 越界判 wall → 撞身判 self
 * （不吃食时先去尾再判，吃食时全身判）→ 生长/前进 → 事件收集。
 * 门映射属 Task 5，本步不实现。status=over 时原状态原样返回、空事件。 */
export function tick(state: GameState): { state: GameState; events: RuleEvent[] } {
  if (state.status === "over") return { state, events: [] };

  const dir = state.queuedDirs[0] ?? state.dir;
  const queuedDirs = state.queuedDirs.slice(1);
  const tickCount = state.tickCount + 1;
  const head = state.snake[0];
  const delta = DELTAS[dir];
  const newHead: Pos = { x: head.x + delta.x, y: head.y + delta.y };

  const outOfBounds =
    newHead.x < 0 ||
    newHead.x >= BOARD_COLS ||
    newHead.y < 0 ||
    newHead.y >= BOARD_ROWS;
  if (outOfBounds) {
    return {
      state: { ...state, dir, queuedDirs, tickCount, status: "over", deathCause: "wall" },
      events: [{ ruleId: "wall-death", payload: { x: newHead.x, y: newHead.y } }],
    };
  }

  const willEat = samePos(newHead, state.food);
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
  if (bodyToCheck.some((p) => samePos(p, newHead))) {
    return {
      state: { ...state, dir, queuedDirs, tickCount, status: "over", deathCause: "self" },
      events: [{ ruleId: "self-bite", payload: { x: newHead.x, y: newHead.y } }],
    };
  }

  const snake = willEat
    ? [newHead, ...state.snake]
    : [newHead, ...state.snake.slice(0, -1)];

  const events: RuleEvent[] = [];
  let { rngState, food, foodsEaten, score } = state;
  if (willEat) {
    const [nextFood, nextRng] = deriveFood(rngState, snake);
    food = nextFood;
    rngState = nextRng;
    foodsEaten += 1;
    score += 1;
    events.push({ ruleId: "eat-food", payload: { score } });
  }

  return {
    state: { ...state, snake, dir, queuedDirs, tickCount, rngState, food, foodsEaten, score },
    events,
  };
}
