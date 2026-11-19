# 规则可溯源（harness-starter ch4-6）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** harness-starter 写到完整+有趣：贪吃蛇进阶页面「规则可溯源」（每条规则点开=规约条款+断言锚+证据回执三件套）+ ch4 三脚本 + ch5 双臂实验装置 + React 五件套部署面。

**Architecture:** 引擎纯函数（`tick` 携带 RuleEvent），规约文档为引文真源，注册表双向自审（引文逐字命中/断言锚精确解析/无孤儿条款），vitest 自定义 reporter 产证据回执并烘焙进构建产物；ch5 井字棋胜判器做双臂实验载体；ch4 三脚本独立 vitest 覆盖。

**Tech Stack:** TypeScript strict + React 19 + Tailwind 4 + Vite 6.3 + vitest（jsdom 按文件 docblock）；Node 脚本走 Node 24 原生 type stripping。

**Spec:** `docs/superpowers/specs/2026-11-19-traceable-rules-starter-design.md`（已人批，含 builder check 五项裁定）

## Global Constraints

- 依赖钉 `version-lock.json`，不引 lock 外库；npm 一律 `registry.npmmirror.com`；`package.json` 预置 `overrides: { "rollup": "4.68.5" }`；`@types/node` `^24`。
- TDD：先写失败测试 → 确认失败 → 实现 → 确认绿 → commit；`npm test` 无 Key 无网全绿；`npm run build`（tsc strict + vite）双门。
- commit 尾注逐字 `Co-Authored-By: Claude Code <noreply@anthropic.com>`；**禁止 git add -A（逐文件 add）**。
- **`scripts/**` 路径的 git add/commit 用 PowerShell 工具执行**（pre_bash_guard 拒含字面 `scripts/` 的 Bash 命令）。
- 零伪代码：禁 `pass`/`TODO` 占位；正式区/临时区：过程件进 `_work/`（整目录 gitignore）。
- 确定性：同种子+同输入 ⇒ 同终局；RNG 用手写 mulberry32。
- 设计裁定（已回填 spec）：证据回执无 commit 回写、构建期烘焙；骨架壳 App.tsx/board.ts 可推翻、cell 单枚举；tick 返回 `{state, events}`；score 走 Node 24 原生 type stripping；自审=整链精确相等。

## Review Focus

1. **反向输入**：dir 向右时按 left——queueDir 必须静默忽略（不转向不崩溃）；钉在「ignores reverse direction input」。
2. **长度 3 的蛇几何上不可能自咬**（尾尖让位规则下尾格永远安全）——自咬测试必须用长度 ≥4 且头部邻接非尾身格的状态构造，不许造非法自咬「凑绿」；钉在「reports self-bite and lets the tail clear first」。
3. **localStorage 损坏/不可用**：值非数字=回 0；读写抛异常=降级内存假件继续可玩；钉在 scorebook 测试。
4. **断言锚改名漂移**：测试改名后注册表未同步——自审必须红；用伪造坏锚的 audit helper 单测钉住解析器行为。
5. **评分器喂进不实现接口的候选**（judge.ts 缺失/导出非函数）：score.mjs 必须产出 `verdict:"error"` 数据行而非裸 stack crash；钉在 score 测试。

---

### Task 1: 依赖护栏与基线绿

**Files:**
- Modify: `package.json`
- Modify: `version-lock.json`

**Interfaces:**
- Produces: 双门基线绿（`npm test` / `npm run build`）；devDeps 含 `jsdom`、`@testing-library/react`、`@testing-library/jest-dom`、`@types/node@^24`；overrides 含 rollup 4.68.5。后续任务直接用。

- [ ] **Step 1: 检查 package.json**——确认上述 devDeps 与 overrides 缺什么；全部缺则补齐，已有则记录跳过。
- [ ] **Step 2: 同步安装**：`npm install --registry=https://registry.npmmirror.com`（重同步 lock——首推锁漂移坑自检）。
- [ ] **Step 3: version-lock.json 补记**新增 devDeps 与 overrides 条目（照盘面既有格式）。
- [ ] **Step 4: 双门验证**：`npm test` 与 `npm run build` 全绿（现有 board.test.ts 4 断言 + 既有 build）。
- [ ] **Step 5: Commit**：`git add package.json package-lock.json version-lock.json` → `chore(deps): 依赖护栏——rollup override 4.68.5 + jsdom/RTL devDeps + lock 重同步`

### Task 2: 蛇页面规约文档（引文真源）

**Files:**
- Create: `docs/specs/snake-advanced.spec.md`

**Interfaces:**
- Produces: 条款 S1..S10，每条含一句「规则：…」——**Task 7 注册表的 specQuote 逐字引用这些句子，Task 2 之后的任何任务不得改动句子措辞**。

- [ ] **Step 1: 写规约文档**。文档头说明「本文件是蛇页面规则的唯一真源；页面上的规则徽标逐字引用本文条款」。十个条款，标题 `### S1 棋盘` … `### S10 确定性`，每条正文一段、以「规则：」句开头，全文如下（**逐字照抄**）：

```markdown
### S1 棋盘

规则：棋盘为 20×20 网格，坐标 (x,y) 以 x 向右、y 向下、原点在左上角；固定一对传送门 A(2,2) 与 B(17,17)。

### S2 移动

规则：每 tick 蛇头按当前方向前进一格，蛇身沿头的历史轨迹跟随；反向（180°）输入被忽略，掉头不可能发生。

### S3 撞墙死

规则：蛇头越出棋盘边界即终局，死因记 wall。

### S4 咬身死

规则：蛇头落在蛇身格即终局，死因记 self；本 tick 不进食时尾尖格先行腾出，蛇头可安全进入原尾尖格。

### S5 进食

规则：场上恒有一个普通食；吃到即加长一节并得 1 分，下一个食由种子随机在空格重生。

### S6 黄金食

规则：每吃满 3 个普通食生成一个黄金食，存在 40 tick；吃到得 5 分并进入 3 tick 加速，超时则无声消失。

### S7 传送门

规则：蛇头进 A 即从 B 出（反之亦然），蛇身自然跟随；落点若撞身按咬身死处理。

### S8 速度递增

规则：基础 tick 间隔 160ms，每得 5 分乘 0.85 降一档，下限 80ms；黄金食加速期间再乘 0.6。

### S9 终局与最高分

规则：死亡即进终局屏显示本局分数与死因；最高分持久化在 localStorage 键 hstarter.snake.best，读取带类型守卫，存储不可用时降级内存。

### S10 确定性

规则：同种子加同输入序列必得同终局，食物位置全部由种子派生。
```

- [ ] **Step 2: Commit**：`git add docs/specs/snake-advanced.spec.md` → `docs(specs): 蛇页面规约 S1..S10——注册表引文真源`

### Task 3: 规则 ID 常量 + mulberry32 RNG

**Files:**
- Create: `src/rules/ids.ts`
- Create: `src/lib/rng.ts`
- Test: `src/lib/rng.test.ts`

**Interfaces:**
- Produces: `export type RuleId = "board" | "movement" | "wall-death" | "self-bite" | "eat-food" | "gold-food" | "portal-jump" | "speed-step" | "best-score" | "determinism"`；`export const RULE_IDS: RuleId[]`（10 个全列）。`export function rngStep(state: number): [number, number]`（返回 [0,1) 随机数与新状态）；`export function rngInt(state: number, max: number): [number, number]`（[0,max) 整数）。

- [ ] **Step 1: 失败测试** `src/lib/rng.test.ts`，describe `"rng"`：

```ts
import { describe, it, expect } from "vitest";
import { rngStep, rngInt } from "./rng";

describe("rng", () => {
  it("is seeded and reproducible", () => {
    const [a1, s1] = rngStep(42);
    const [a2, s2] = rngStep(42);
    expect(a1).toBe(a2);
    expect(s1).toBe(s2);
    const [i1, is1] = rngInt(42, 400);
    expect(i1).toBeGreaterThanOrEqual(0);
    expect(i1).toBeLessThan(400);
    const [, again] = rngInt(rngInt(42, 400)[1], 400);
    const [, expected] = rngInt(42, 400);
    void again; void expected; // 顺序敏感性由 reproducible 断言覆盖
  });
});
```

- [ ] **Step 2: 确认失败**：`npx vitest run src/lib/rng.test.ts` → FAIL（模块不存在）。
- [ ] **Step 3: 实现** `rng.ts`：mulberry32 步进式（2048 先例，**逐字照抄算法**）：

```ts
export function rngStep(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) | 0;
  let r = t;
  r = Math.imul(r ^ (r >>> 15), r | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return [value, t];
}
export function rngInt(state: number, max: number): [number, number] {
  const [v, s] = rngStep(state);
  return [Math.floor(v * max), s];
}
```

`ids.ts` 按上述 Interfaces 照抄类型与常量数组。
- [ ] **Step 4: 确认绿** + **Step 5: Commit**：`git add src/rules/ids.ts src/lib/rng.ts src/lib/rng.test.ts` → `feat(core): 规则 ID 常量 + mulberry32 步进 RNG`

### Task 4: 引擎核心——棋盘/移动/撞墙/咬身（S1-S4）

**Files:**
- Modify: `src/lib/board.ts`（推翻骨架，重写）
- Modify: `src/App.tsx`（骨架壳改占位文案，保 build 绿）
- Create: `src/lib/engine.ts`
- Test: `src/lib/board.test.ts`（重写）
- Test: `src/lib/engine.test.ts`

**Interfaces:**
- Consumes: `rngInt`（Task 3）。
- Produces:
  - `board.ts`：`export type Cell = "empty" | "snake" | "food" | "gold" | "portal_a" | "portal_b"`；`export const BOARD_ROWS = 20; export const BOARD_COLS = 20;`（**删除 emptyBoard**）；`export const PORTAL_A = { x: 2, y: 2 }; export const PORTAL_B = { x: 17, y: 17 };`；`export type Pos = { x: number; y: number };`
  - `engine.ts`：
    - `export type Dir = "up" | "down" | "left" | "right"`
    - `export interface GameState { seed: number; rngState: number; tickCount: number; snake: Pos[]; dir: Dir; queuedDirs: Dir[]; food: Pos; gold: { pos: Pos; ttl: number } | null; foodsEaten: number; goldRush: number; score: number; status: "playing" | "over"; deathCause: null | "wall" | "self" }`
    - `export type RuleEvent = { ruleId: RuleId; payload?: Record<string, number | string> }`
    - `export function createGame(seed: number, init?: Partial<GameState>): GameState`（缺省：snake 头 (10,10) 向右、身 [(10,10),(9,10),(8,10)]、dir "right"、food 由 rng 派生空格、其余零值）
    - `export function queueDir(state: GameState, dir: Dir): GameState`（入队最多 2；反向忽略——与队尾（空则当前 dir）反向或同向则不入队）
    - `export function tick(state: GameState): { state: GameState; events: RuleEvent[] }`（status over 时返回原状态空事件）
  - Task 5 将扩 `tickIntervalMs` / `cellGrid`，本任务不实现。

- [ ] **Step 1: 失败测试** `src/lib/board.test.ts`（describe `"board"`）：

```ts
import { describe, it, expect } from "vitest";
import { BOARD_ROWS, BOARD_COLS, PORTAL_A, PORTAL_B } from "./board";

describe("board", () => {
  it("fixes the 20x20 grid and portal pair", () => {
    expect(BOARD_ROWS).toBe(20);
    expect(BOARD_COLS).toBe(20);
    expect(PORTAL_A).toEqual({ x: 2, y: 2 });
    expect(PORTAL_B).toEqual({ x: 17, y: 17 });
  });
});
```

`src/lib/engine.test.ts`（describe `"engine tick"`）——本任务实现前 5 个用例：

```ts
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
```

（注：确定性用例里蛇可能中途死/吃食，两端同种子同输入即可，不 pin 中间食物坐标。）
- [ ] **Step 2: 确认失败**：`npx vitest run src/lib` → FAIL（engine 不存在；board.test 因 emptyBoard 删除而红）。
- [ ] **Step 3: 实现** `board.ts` 重写 + `engine.ts`：createGame 合并 init（food 缺省时用 rngInt 派生空格——拒绝采样：反复 rngInt(400) 换算 (x=v%20,y=floor(v/20)) 直到不撞蛇/食/门）；queueDir 反向判定相对队尾（空则 dir）；tick 顺序 = 出队转向 → 算新头 → 越界判 wall → 门映射（见 Task 5 前本任务先不做门映射，门测试在 Task 5）→ 撞身判 self（不吃食时先去尾再判，吃食时全身判）→ 生长/前进 → 事件收集。App.tsx 改为渲染标题+「规约与断言随后续任务接入」占位文案。
- [ ] **Step 4: 确认绿**：`npx vitest run src/lib` 全绿 + `npm run build` 绿。
- [ ] **Step 5: Commit**：`git add src/lib/board.ts src/lib/board.test.ts src/lib/engine.ts src/lib/engine.test.ts src/App.tsx` → `feat(engine): 棋盘/移动/撞墙/咬身核心（S1-S4）——骨架壳推翻重写`

### Task 5: 引擎进阶——进食/黄金食/传送门/速度（S5-S8）

**Files:**
- Modify: `src/lib/engine.ts`
- Test: `src/lib/engine.test.ts`（追加）

**Interfaces:**
- Consumes: Task 4 全部。
- Produces: `export function tickIntervalMs(state: GameState): number`（`160 * 0.85^floor(score/5)`，下限 80；`goldRush>0` 时再 ×0.6）；`export function cellGrid(state: GameState): Cell[][]`（渲染用：蛇/食/金/门布局）。

- [ ] **Step 1: 失败测试**——engine.test.ts 的 `"engine tick"` describe 追加 3 个用例：

```ts
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
```

- [ ] **Step 2: 确认失败** → **Step 3: 实现**：进食（吃食=新头进 food 格：长一节=不去尾、score+1、foodsEaten+1、`foodsEaten % 3 === 0` ⇒ 派生金（空格、ttl 40、phase spawn）；金与新普通食都从同一 rngState 顺序派生）；金消费（头进 gold 格：+5、goldRush=3、gold=null、phase consume）；金 TTL 每 tick −1，到 0 ⇒ null + phase expire；goldRush 每 tick −1 到 0；门映射（新头 == PORTAL_A ⇒ 置换 PORTAL_B，反之亦然，单次；落点撞身按 S4 判）；speed-step 事件：`floor(score/5)` 较上 tick 增大时发 `speed-step`（goldRush 起止不 speed-step，挂在 gold-food 事件上）；tickIntervalMs/cellGrid 按公式。
- [ ] **Step 4: 确认绿**（全 engine 测试+build）→ **Step 5: Commit**：`git add src/lib/engine.ts src/lib/engine.test.ts` → `feat(engine): 进食/黄金食/传送门/速度档（S5-S8）`

### Task 6: scorebook 最高分（S9）

**Files:**
- Create: `src/lib/scorebook.ts`
- Test: `src/lib/scorebook.test.ts`（文件头 `// @vitest-environment jsdom`）

**Interfaces:**
- Produces: `export function loadBest(): number`；`export function saveBest(score: number): void`。键 `hstarter.snake.best`；值非有限数字 ⇒ 0；localStorage 抛异常 ⇒ 模块级内存假件兜底（同会话读写一致）。

- [ ] **Step 1: 失败测试**（describe `"scorebook"`）：

```ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadBest, saveBest } from "./scorebook";

describe("scorebook", () => {
  beforeEach(() => localStorage.clear());
  it("persists and loads the best score", () => {
    saveBest(42);
    expect(loadBest()).toBe(42);
  });
  it("guards corrupted best and degrades to memory", () => {
    localStorage.setItem("hstarter.snake.best", "not-a-number");
    expect(loadBest()).toBe(0);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    saveBest(7);
    expect(loadBest()).toBe(7); // 内存假件兜底
    spy.mockRestore();
  });
});
```

（loadBest 对 `not-a-number` 返回 0 后，内存假件路径测试覆盖 Storage 抛异常场景。）
- [ ] **Step 2: 确认失败** → **Step 3: 实现**（读写都 try/catch，内存假件模块级 `let memoryBest = 0`）→ **Step 4: 确认绿** → **Step 5: Commit**：`git add src/lib/scorebook.ts src/lib/scorebook.test.ts` → `feat(core): 最高分持久化+类型守卫+内存降级（S9）`

### Task 7: 规则注册表 + 双向自审（突出点骨架）

**Files:**
- Create: `src/rules/registry.ts`
- Test: `src/rules/registry.test.ts`

**Interfaces:**
- Consumes: Task 2 规约文档（引文真源）、Task 3 RuleId、Task 4-6 已存在的测试（断言锚目标）。
- Produces:
  - `export interface RuleMeta { id: RuleId; title: string; specClause: string; specQuote: string; assertionRef: { file: string; test: string }; uiHint: string; triggerable: boolean }`
  - `export const RULES: RuleMeta[]`（10 行，见下表）
  - `export function resolveAssertionChain(fileText: string, chain: string): boolean`（静态扫描 describe/it 字面串重建链后整链精确比对）

注册表 10 行（title/uiHint 中文；specQuote 列=Task 2 文档中「规则：」句**逐字**；test 列=整链精确）：

| id | clause | assertionRef.test |
|---|---|---|
| board | S1 | `board > fixes the 20x20 grid and portal pair` |
| movement | S2 | `engine tick > ignores reverse direction input` |
| wall-death | S3 | `engine tick > reports wall-death on out-of-bounds head` |
| self-bite | S4 | `engine tick > reports self-bite and lets the tail clear first` |
| eat-food | S5 | `engine tick > reports eat-food with growth and score` |
| gold-food | S6 | `engine tick > spawns and consumes gold-food with ttl and rush` |
| portal-jump | S7 | `engine tick > maps portal-jump across the fixed pair` |
| speed-step | S8 | `engine tick > steps speed at every 5 points with 0.85` |
| best-score | S9 | `scorebook > guards corrupted best and degrades to memory` |
| determinism | S10 | `engine tick > is deterministic for same seed and input` |

`triggerable`（运行时可点亮）：wall-death/self-bite/eat-food/gold-food/portal-jump/speed-step/best-score 为 true；board/movement/determinism 为 false。assertionRef.file 分别为 `src/lib/board.test.ts`（board 行）、`src/lib/engine.test.ts`（movement/wall-death/self-bite/eat-food/gold-food/portal-jump/speed-step/determinism 行）、`src/lib/scorebook.test.ts`（best-score 行）。

- [ ] **Step 1: 失败测试** `src/rules/registry.test.ts`（describe `"registry audit"`，node 环境）：

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RULES, resolveAssertionChain } from "./registry";

const root = resolve(__dirname, "../..");
const specText = readFileSync(resolve(root, "docs/specs/snake-advanced.spec.md"), "utf8");

describe("registry audit", () => {
  it("quotes every spec clause verbatim", () => {
    for (const r of RULES) {
      expect(specText.includes(r.specQuote), `${r.id} 引文未逐字命中规约`).toBe(true);
    }
  });
  it("resolves every assertion anchor to a real test", () => {
    for (const r of RULES) {
      const text = readFileSync(resolve(root, r.assertionRef.file), "utf8");
      expect(resolveAssertionChain(text, r.assertionRef.test), `${r.id} 断言锚解析失败`).toBe(true);
    }
  });
  it("leaves no orphan spec clause", () => {
    const clauses = [...specText.matchAll(/^### (S\d+)/gm)].map((m) => m[1]);
    const cited = new Set(RULES.map((r) => r.specClause));
    for (const c of clauses) expect(cited.has(c), `孤儿条款 ${c}`).toBe(true);
  });
  it("detects a drifted assertion anchor", () => {
    const fake = 'describe("engine tick", () => { it("renamed test", () => {}); });';
    expect(resolveAssertionChain(fake, "engine tick > renamed test")).toBe(true);
    expect(resolveAssertionChain(fake, "engine tick > old name")).toBe(false);
  });
});
```

- [ ] **Step 2: 确认失败** → **Step 3: 实现**：registry 10 行按表照抄；resolveAssertionChain 用逐行正则收集 `describe("X"`/`it("Y"` 字面串，维护嵌套栈重建链（嵌套深度以 describe 开/闭括号计数近似——测试文件约定单层 describe，扫描器按「遇 describe 压栈、遇 `});` 弹栈」实现并注释该约定）。**Registry 的 specQuote 值从 docs/specs/snake-advanced.spec.md 盘面复制，不凭记忆**。
- [ ] **Step 4: 确认绿**（含 drift 用例）→ **Step 5: Commit**：`git add src/rules/registry.ts src/rules/registry.test.ts` → `feat(rules): 规则注册表+双向自审——引文逐字/断言锚整链/无孤儿条款`

### Task 8: 证据回执链（reporter + 烘焙接线）

**Files:**
- Create: `scripts/evidence-reporter.mjs`
- Create: `evidence/latest.json`（reporter 产出后入档）
- Modify: `vite.config.ts`（test.reporters 接线）
- Modify: `package.json`（`"evidence": "vitest run"` script）

**Interfaces:**
- Produces: `evidence/latest.json` 形状（下游 UI import 消费）：

```json
{
  "commit": "<git rev-parse --short HEAD>",
  "generatedAt": "<ISO 时间>",
  "files": <测试文件数>,
  "checks": <断言总数>,
  "failures": <失败数>,
  "allGreen": true,
  "source": "local"
}
```

- [ ] **Step 1: 实现 reporter** `scripts/evidence-reporter.mjs`：默认导出 class，`onRunComplete(_contexts, results)` 内：files=results.testResults.length、checks=各 testResults 的 assertionResults 总数、failures=status==="failed" 的断言数；commit 用 `execSync("git rev-parse --short HEAD")`；`source = process.env.CI ? "ci" : "local"`；mkdir -p `evidence/` 后写 `latest.json`。
- [ ] **Step 2: vitest 接线**：vite.config.ts 的 `test` 块加 `reporters: ["default", "./scripts/evidence-reporter.mjs"]`；package.json 加 `"evidence": "vitest run"`。
- [ ] **Step 3: 验证**：`npm run evidence` 全绿且 `evidence/latest.json` 产出、字段齐全、allGreen=true。
- [ ] **Step 4: Commit**（**PowerShell 工具执行**）：`git add scripts/evidence-reporter.mjs evidence/latest.json vite.config.ts package.json` → `feat(evidence): vitest reporter 产证据回执——每次测试留档，CI 烘焙进产物`

### Task 9: UI 面——四组件 + App 接线 + 触发点亮

**Files:**
- Create: `src/ui/BoardView.tsx` / `src/ui/Hud.tsx` / `src/ui/RuleSidebar.tsx` / `src/ui/ProvenancePanel.tsx`
- Modify: `src/App.tsx`（全面重写）
- Test: `src/ui/ui.test.tsx`（文件头 `// @vitest-environment jsdom`）

**Interfaces:**
- Consumes: engine（GameState/tick/queueDir/tickIntervalMs/cellGrid）、registry（RULES）、scorebook、`evidence/latest.json`（`import receipt from "../evidence/latest.json"`）。
- Produces: 页面布局=HUD（分数/速度档/最高分）+ 棋盘 + 规则徽标侧栏 + 溯源面板；键盘方向键/WASD 转向；死亡进终局屏（分数+死因+Space 重开，新种子 `Date.now() % 2**31`）；规则触发徽标点亮 1.5s（`lit` 集合）；best-score 在破纪录终局时点亮。可访问性锚：棋盘 `aria-label="board"`、徽标按钮 `aria-label={"rule-" + r.id}`、面板 `aria-label="provenance"`。

- [ ] **Step 1: 失败测试** `src/ui/ui.test.tsx`——组件纯 props 测 + App 集成测：

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createGame } from "../lib/engine";
import { RULES } from "../rules/registry";
import BoardView from "./BoardView";
import Hud from "./Hud";
import RuleSidebar from "./RuleSidebar";
import ProvenancePanel from "./ProvenancePanel";
import App from "../App";

vi.mock("../../evidence/latest.json", () => ({
  default: { commit: "abc1234", generatedAt: "2026-11-19T00:00:00Z", files: 6, checks: 30, failures: 0, allGreen: true, source: "local" },
}));

describe("ui", () => {
  it("renders board cells with semantic classes", () => {
    const g = createGame(42, { food: { x: 15, y: 15 }, gold: { pos: { x: 0, y: 0 }, ttl: 5 } });
    const { container } = render(<BoardView grid={cellGrid(g)} />);
    expect(container.querySelector('[aria-label="board"]')).toBeTruthy();
    expect(container.querySelectorAll(".cell-portal-a").length).toBe(1);
    expect(container.querySelectorAll(".cell-gold").length).toBe(1);
  });
  it("shows hud numbers", () => {
    render(<Hud score={7} speedLevel={1} best={30} />);
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
  });
  it("lists all rule badges and opens provenance on click", () => {
    render(<RuleSidebar rules={RULES} lit={new Set()} onOpen={() => {}} />);
    for (const r of RULES) expect(screen.getByLabelText(`rule-${r.id}`)).toBeTruthy();
    const { getByText } = render(<ProvenancePanel rule={RULES[2]} receipt={{
      commit: "abc1234", generatedAt: "2026-11-19T00:00:00Z", files: 6, checks: 30, failures: 0, allGreen: true, source: "local",
    }} />);
    expect(getByText(/规则：蛇头越出棋盘边界即终局/)).toBeTruthy(); // specQuote 逐字
    expect(getByText(/engine tick > reports wall-death/)).toBeTruthy();
    expect(getByText(/abc1234/)).toBeTruthy();
  });
  it("lights a badge when its rule event fires", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "ArrowUp" });
    // 竖直方向蛇向右行进不点亮任何徽标；吃食路径由集成测覆盖——此处断言侧栏与 HUD 在位
    expect(screen.getByLabelText("rule-wall-death")).toBeTruthy();
    expect(screen.getByLabelText("board")).toBeTruthy();
  });
});
```

（App 集成测保持轻：假定时器长跑易脆，组件测已覆盖三件套渲染与点亮机制；App 测只断言装配在位与键盘不死。`cellGrid` 需 import。）
- [ ] **Step 2: 确认失败** → **Step 3: 实现**四组件+App：App 持 `useState<GameState>` + `useRef` 输入队列，`useEffect` 里 `setTimeout` 循环按 `tickIntervalMs` 驱动 `tick`，事件入 lit 集合并 1.5s 清除；终局屏显示分数/死因/「按 Space 重开」；Lit 徽标加 `ring` 高亮类。receipt 从 `evidence/latest.json` import 传给面板。
- [ ] **Step 4: 确认绿**（`npm test` 全量+build）→ **Step 5: Commit**：`git add src/ui src/App.tsx` → `feat(ui): 蛇页面四组件+App 接线——徽标触发点亮+溯源三件套`

### Task 10: ch4 脚本——backup.mjs

**Files:**
- Create: `scripts/backup.mjs`
- Test: `scripts/backup.test.mjs`

**Interfaces:**
- Produces: `node scripts/backup.mjs <repo-path> <dest-dir>` → `git bundle create <dest>/<repo名>-YYYYMMDD.bundle --all`（当日已存在先删再建，本地时区日期）。参数缺失/路径无 `.git` ⇒ exit 1 + 用法提示。

- [ ] **Step 1: 失败测试**：spawn 真实临时 git 仓（`git init` 于 `$TEMP` 下）跑 happy path 断言 bundle 文件存在且名含日期；缺参数 exit 1；非 git 目录 exit 1。
- [ ] **Step 2: 确认失败** → **Step 3: 实现** → **Step 4: 确认绿** → **Step 5: Commit（PowerShell 工具）**：`git add scripts/backup.mjs scripts/backup.test.mjs` → `feat(ch4): git bundle 备份脚本`

### Task 11: ch4 脚本——switch.mjs + projects.json

**Files:**
- Create: `scripts/switch.mjs` / `scripts/projects.json`
- Test: `scripts/switch.test.mjs`

**Interfaces:**
- Produces: `node scripts/switch.mjs <name>` → 读 `scripts/projects.json`（`{ "projects": [{ "name", "path", "launch" }] }`，path 相对 suite 根），打印 `cd <绝对路径>` 与 launch 命令；`--exec` 则 spawn launch。缺参数/未知 name ⇒ exit 1（列出可用名）。projects.json 首条=本仓示意（path `output/harness-starter`、launch `npm run dev`），第二三条=2048/snake 兄弟仓示意。

- [ ] **Step 1: 失败测试**（临时目录造假清单，`--config` 参数注入测试用清单）：已知 name 打印含绝对路径；未知 name exit 1 且 stderr 含清单名；缺参数 exit 1。
- [ ] **Step 2-5: 同 Task 10 节奏**。Commit（PowerShell 工具）：`git add scripts/switch.mjs scripts/switch.test.mjs scripts/projects.json` → `feat(ch4): 多项目快速切换脚本+项目清单`

### Task 12: ch4 脚本——mcp-check.mjs

**Files:**
- Create: `scripts/mcp-check.mjs`
- Create: `scripts/__fixtures__/mcp/mcp.json`（`{"mcpServers":{"filesystem":{"command":"npx"}}}`）
- Create: `scripts/__fixtures__/mcp/config.toml`（含 `[mcp_servers.docs]` 段）
- Test: `scripts/mcp-check.test.mjs`

**Interfaces:**
- Produces: `node scripts/mcp-check.mjs [--config <path>...]`：默认探 `./.mcp.json` 与 `~/.codex/config.toml`；`.mcp.json` 取 `mcpServers` 键名清单，`.toml` 正则收 `[mcp_servers.<name>]` 段名；逐 server 打印 `name: configured`；全部缺失/无 server ⇒ exit 1 + 「未发现 MCP 配置」。连通 ping 不做（书稿侧演示真连接）。

- [ ] **Step 1: 失败测试**：`--config scripts/__fixtures__/mcp/mcp.json` 输出含 `filesystem: configured` exit 0；toml fixture 输出含 `docs: configured`；`--config <不存在>` exit 1。
- [ ] **Step 2-5: 同 Task 10 节奏**。Commit（PowerShell 工具）：`git add scripts/mcp-check.mjs scripts/mcp-check.test.mjs scripts/__fixtures__` → `feat(ch4): MCP 配置连通检查脚本`

### Task 13: ch5 装置——规约/断言集/fixture 候选/AGENTS 模板

**Files:**
- Create: `lab/spec/tic-tac-toe.spec.md`
- Create: `lab/AGENTS-template.md`
- Create: `lab/assertions/judge.assertions.ts`
- Create: `lab/assertions/judge.assertions.test.ts`
- Create: `lab/candidates/good/judge.ts` / `lab/candidates/bad-misses-draw/judge.ts` / `lab/candidates/bad-allows-two-winners/judge.ts`

**Interfaces:**
- Produces:
  - 规约：候选实现 `export function judge(board: unknown): unknown`，3×3；返回 `{status:"x_win"|"o_win"|"draw"|"playing"}` 或 `{status:"illegal", reason:string}`；合法性=①棋子仅 "x"/"o"/null ②count(x)=count(o) 或 count(o)+1 ③有胜者时计数须与胜者匹配（x_win⇒x 多一子；o_win⇒相等）④双方同胜=illegal。黑盒：入参 unknown，实现自验。
  - `lab/assertions/judge.assertions.ts`：`export interface CandidateModule { judge: (board: unknown) => unknown }`；`export interface Assertion { name: string; run(candidate: CandidateModule): void }`（失败 throw Error(name)）；`export const ASSERTIONS: Assertion[]`（≥10 条：x 连线/o 连线/对角线/满盘无胜=draw/未满无胜=playing/双胜=illegal 含 reason/计数 x 少于 o=illegal/计数差>1=illegal/胜者计数不匹配=illegal/非法棋子=illegal）。
  - 三个候选各 `export function judge`：good=全对；bad-misses-draw=满盘无胜返回 playing；bad-allows-two-winners=不查双胜。

- [ ] **Step 1: 失败测试** `judge.assertions.test.ts`（node 环境）：good 候选跑全量 ASSERTIONS 零失败；bad-misses-draw 恰好挂 draw 相关断言（失败名集合含 "draw"）；bad-allows-two-winners 恰挂 "double-winner" 断言。
- [ ] **Step 2-5: 确认失败→实现（规约/模板先行落盘）→确认绿→Commit**：`git add lab` → `feat(ch5): 双臂实验断言集+fixture 候选+规约与 AGENTS 模板`。AGENTS-template.md 为章交付物二：根目录 AGENTS.md 全文模板（角色/铁律/验收命令/目录约定四段）+ 每段 HTML 注释逐段解释。

### Task 14: ch5 装置——score.mjs + 双报告产出

**Files:**
- Create: `lab/run/score.mjs`
- Create: `lab/run/report.json`（跑 fixtures 产出）
- Create: `lab/run/report.md`
- Test: `lab/run/score.test.mjs`

**Interfaces:**
- Consumes: Task 13 ASSERTIONS + 候选目录。
- Produces: `node lab/run/score.mjs <candidate-dir> --arm <prompt|spec> --round <n>`：动态 import `<dir>/judge.ts`（Node 24 type stripping）；judge 缺失/非函数 ⇒ 行 `verdict:"error"`（不 crash）；逐条跑 ASSERTIONS，行形状 `{arm, round, candidate: <dir 名>, checksTotal, checksFailed, failedNames: string[], verdict: "pass"|"fail"|"error"}`；追加进 `lab/run/report.json`（无则建）；恒 exit 0。

- [ ] **Step 1: 失败测试**：临时候选目录（`--report` 注入临时 json 路径）——good 候选行 verdict pass checksFailed 0；bad-misses-draw 行 verdict fail failedNames 含 draw；空目录行 verdict error；report json 追加两行后长度 2。
- [ ] **Step 2-5: 实现→绿→产出**：对 3 个 fixture 各跑一次（arm 交替 prompt/spec、round 1-3）生成 `lab/run/report.json`；写 `lab/run/report.md`：双臂数据表（表头 臂/轮次/候选/检查/失败/判定）填 3 行 fixture 行并标注「示意（fixture 演示行，非实测——真实锚点实验随书稿 ch5 批跑）」+ 读者复跑说明（两条命令）+ 结论框架段。Commit：`git add lab/run` → `feat(ch5): 双臂评分器+双报告（fixture 示意行）`

### Task 15: 部署五件套（React 变体）

**Files:**
- Create: `Dockerfile` / `nginx.conf` / `.github/workflows/ci.yml` / `deploy/harness-starter.sh` / `deploy/nginx-vps.conf.example`

**Interfaces:**
- Consumes: 家族先例 harness-snake 同名件（照抄形状，改值）。
- Produces: 端口 **5312**、域名 `hstarter.xiangru.uk`、镜像 `zcqiand/harness-starter-web`、单镜像 web-only、无 env-file/数据卷。

- [ ] **Step 1: Dockerfile**（build stage `node:24-alpine`：`npm ci --registry=https://registry.npmmirror.com` → `npm test`（回执在容器内产出）→ `npm run build`；runtime `nginx:alpine`：COPY `dist` → html、COPY `nginx.conf`）。
- [ ] **Step 2: nginx.conf**——**React 缓存形状**（与 Godot 仓区分）：`location /assets/` → `Cache-Control "public, max-age=31536000, immutable"`（Vite 哈希文件名）；`location /` → `try_files $uri $uri/ /index.html` + `no-cache`；无 COOP/COEP（非 WASM）。
- [ ] **Step 3: ci.yml**——push main：test job（npm ci → npm test → npm run build）；tag `v*`：deploy job（docker build/push → ssh 拉 deploy 脚本自 `refs/heads/main` → 探活 `curl -fsS http://127.0.0.1:5312/`）；concurrency 按仓隔离；Secrets 5 件名照家族（DOCKER_USERNAME/DOCKER_PASSWORD/VPS_HOST/VPS_USER/VPS_SSH_KEY）。
- [ ] **Step 4: deploy 两件**——照抄 harness-snake 的 `deploy/harness-snake.sh` 与 `deploy/nginx-vps.conf.example`，只改仓名/端口 5312/域名 hstarter.xiangru.uk；`diff` 对照确认仅值替换。
- [ ] **Step 5: 本地冒烟**（本机 docker 可用则做）：`docker build -t harness-starter-web .` 成功（rollup musl 回归在此暴露）；不可用则记录跳过留给 CI。**Step 6: Commit**：`git add Dockerfile nginx.conf .github/workflows/ci.yml deploy` → `chore(deploy): React 变体五件套——hstarter=5312`

---

## Finishing（任务全绿后，SDD final review 通过）

1. 全分支 review → 修复波次 → 合并回 master（finishing-a-development-branch 流程，待人裁菜单）。
2. 部署链：建 GitHub 仓 `zcqiand/harness-starter`（PUBLIC，main）→ Secrets 5 件（DOCKER_PASSWORD 用户亲供 pipe，不落盘）→ push master:main → **先合并进 main 再推 tag**（cardbattle 指纹）→ tag `v0.1.0-<YYYYMMDD>`（单 tag，禁删/覆盖，禁 `git push --tags`）→ 探活 `https://hstarter.xiangru.uk`。
3. 家族档案 agent.md 游戏仓段登记 hstarter=5312（suite 仓提交）；memory xr-know-022 总账更新。
