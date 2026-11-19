import { describe, it, expect } from "vitest";
import { createGame, queueDir, tick } from "./engine";

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
});
