import { describe, it, expect } from "vitest";
import { BOARD_COLS, BOARD_ROWS, type Pos } from "./board";
import { cellGrid, createGame, queueDir, tick, tickIntervalMs } from "./engine";

describe("engine tick", () => {
  it("advances the head along the current direction", () => {
    const g = createGame(42);
    const { state } = tick(g);
    expect(state.snake[0]).toEqual({ x: 11, y: 10 });
    expect(state.status).toBe("playing");
  });
  it("ignores reverse direction input", () => {
    const g = queueDir(createGame(42), "left");
    const { state } = tick(g);
    expect(state.snake[0]).toEqual({ x: 11, y: 10 });
  });
  it("reports wall-death on out-of-bounds head", () => {
    const g = createGame(42, { snake: [{ x: 19, y: 5 }, { x: 18, y: 5 }], dir: "right" });
    const { state, events } = tick(g);
    expect(state.status).toBe("over");
    expect(state.deathCause).toBe("wall");
    expect(events.map((e) => e.ruleId)).toContain("wall-death");
  });
  it("reports self-bite and lets the tail clear first", () => {
    // 咬身：头邻接非尾身格（长度 5，尾 (6,4) 让位后头 (5,4) 仍撞 body[3]）
    const bite = createGame(42, {
      snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }],
      dir: "left",
    });
    const bitten = tick(queueDir(bite, "up"));
    expect(bitten.state.status).toBe("over");
    expect(bitten.state.deathCause).toBe("self");
    expect(bitten.events.map((e) => e.ruleId)).toContain("self-bite");
    // 尾尖让位：长度 4 同形少一节，头进原尾格=合法
    const follow = createGame(42, {
      snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 4 }, { x: 5, y: 4 }],
      dir: "left",
    });
    const followed = tick(queueDir(follow, "up"));
    expect(followed.state.status).toBe("playing");
    expect(followed.state.snake[0]).toEqual({ x: 5, y: 4 });
  });
  it("is deterministic for same seed and input", () => {
    const a = createGame(42);
    const b = createGame(42);
    let sa = { s: a, e: [] as string[] };
    let sb = { s: b, e: [] as string[] };
    for (const _ of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      sa = { s: tick(queueDir(sa.s, "up")).state, e: [] };
      sb = { s: tick(queueDir(sb.s, "up")).state, e: [] };
    }
    expect(sb.s).toEqual(sa.s);
  });
  it("reports eat-food with growth and score", () => {
    const g = createGame(42, {
      snake: [{ x: 5, y: 5 }, { x: 6, y: 5 }], dir: "left", food: { x: 4, y: 5 },
    });
    const { state, events } = tick(g);
    expect(state.score).toBe(1);
    expect(state.foodsEaten).toBe(1);
    expect(state.snake).toHaveLength(3);
    expect(state.food).not.toEqual({ x: 4, y: 5 });
    expect(events.map((e) => e.ruleId)).toContain("eat-food");
  });
  it("spawns and consumes gold-food with ttl and rush", () => {
    // 满 3 生成：foodsEaten=2 时吃到第 3 个 ⇒ gold 出现 ttl 40
    const spawn = tick(createGame(42, {
      snake: [{ x: 5, y: 5 }, { x: 6, y: 5 }], dir: "left",
      food: { x: 4, y: 5 }, foodsEaten: 2, score: 2,
    }));
    expect(spawn.state.gold).not.toBeNull();
    expect(spawn.state.gold!.ttl).toBe(40);
    expect(spawn.events).toContainEqual(expect.objectContaining({
      ruleId: "gold-food", payload: expect.objectContaining({ phase: "spawn" }),
    }));
    // 吃金：+5 分、goldRush=3、金消失
    const eat = tick(createGame(42, {
      snake: [{ x: 5, y: 5 }, { x: 6, y: 5 }], dir: "left",
      food: { x: 10, y: 10 },
      gold: { pos: { x: 4, y: 5 }, ttl: 10 },
    }));
    expect(eat.state.score).toBe(5);
    expect(eat.state.goldRush).toBe(3);
    expect(eat.state.gold).toBeNull();
    expect(eat.events).toContainEqual(expect.objectContaining({
      ruleId: "gold-food", payload: expect.objectContaining({ phase: "consume" }),
    }));
    // 超时消失：ttl=1 时 tick ⇒ gold 无声消失（事件 phase=expire）
    const expire = tick(createGame(42, { gold: { pos: { x: 0, y: 0 }, ttl: 1 } }));
    expect(expire.state.gold).toBeNull();
    expect(expire.events).toContainEqual(expect.objectContaining({
      ruleId: "gold-food", payload: expect.objectContaining({ phase: "expire" }),
    }));
  });
  it("maps portal-jump across the fixed pair", () => {
    const g = createGame(42, { snake: [{ x: 2, y: 3 }, { x: 2, y: 4 }], dir: "up", food: { x: 10, y: 10 } });
    const { state, events } = tick(g);
    expect(state.snake[0]).toEqual({ x: 17, y: 17 });
    expect(state.status).toBe("playing");
    expect(events.map((e) => e.ruleId)).toContain("portal-jump");
    // 落点 B 下一 tick 沿方向离开，不回传
    const next = tick(state);
    expect(next.state.snake[0]).toEqual({ x: 17, y: 16 });
  });
  it("steps speed at every 5 points with 0.85", () => {
    const base = createGame(42, { score: 4 });
    expect(tickIntervalMs(base)).toBe(160);
    const stepped = createGame(42, { score: 5 });
    expect(tickIntervalMs(stepped)).toBe(136);
    const floored = createGame(42, { score: 25 });
    expect(tickIntervalMs(floored)).toBe(80);
    const rushing = createGame(42, { score: 5, goldRush: 2 });
    expect(tickIntervalMs(rushing)).toBeCloseTo(81.6, 9);
  });
  it("freezes food without hanging when no free cell remains", () => {
    // 守卫：蛇占满除 food 外全部格子，吃到唯一空位食后无空格可派生 ⇒ 冻结旧食位、不挂起
    const food: Pos = { x: 0, y: 1 };
    const cells: Pos[] = [];
    for (let y = 0; y < BOARD_ROWS; y++) {
      for (let x = 0; x < BOARD_COLS; x++) {
        if (!(x === food.x && y === food.y)) cells.push({ x, y });
      }
    }
    const snake: Pos[] = [{ x: 0, y: 0 }, ...cells.filter((c) => !(c.x === 0 && c.y === 0))];
    const g = createGame(42, { snake, dir: "down", food });
    const r = tick(g);
    expect(r.state.status).toBe("playing");
    expect(r.state.food).toEqual(food);
  });
  it("cellGrid lays out snake, food, gold and portals", () => {
    const g = createGame(42, {
      snake: [{ x: 5, y: 5 }, { x: 6, y: 5 }], dir: "left", food: { x: 4, y: 5 },
      gold: { pos: { x: 10, y: 10 }, ttl: 5 },
    });
    const grid = cellGrid(g);
    expect(grid).toHaveLength(BOARD_ROWS);
    expect(grid[2][2]).toBe("portal_a");
    expect(grid[17][17]).toBe("portal_b");
    expect(grid[5][5]).toBe("snake");
    expect(grid[5][4]).toBe("food");
    expect(grid[10][10]).toBe("gold");
  });
});
