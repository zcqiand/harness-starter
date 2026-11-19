// ch5 双臂实验——裁判函数的黑盒断言集。
// 本文件是 lab/spec/tic-tac-toe.spec.md（J1-J7）的机器可跑形态：
// 每条断言喂给候选一个构造好的棋盘，核对返回形状。
// 失败形状：断言不满足时 throw Error(name)——断言名即失败名，
// 评分器按名逐字收集 failedNames，改断言名=改评分口径。

export interface CandidateModule {
  judge: (board: unknown) => unknown;
}

export interface Assertion {
  name: string;
  run(candidate: CandidateModule): void;
}

// 棋子常量与棋盘构造器：断言里只写"摆子"，不写下标算术。
type Piece = "x" | "o" | null;
const X: Piece = "x";
const O: Piece = "o";
const N: Piece = null;

const board = (...cells: unknown[]): unknown => cells;

interface JudgeOutcome {
  status?: unknown;
  reason?: unknown;
}

function expectStatus(
  candidate: CandidateModule,
  cells: unknown[],
  expected: string,
  name: string,
): void {
  const outcome = candidate.judge(board(...cells)) as JudgeOutcome;
  if (outcome?.status !== expected) throw new Error(name);
}

function expectIllegal(candidate: CandidateModule, cells: unknown[], name: string): void {
  const outcome = candidate.judge(board(...cells)) as JudgeOutcome;
  if (outcome?.status !== "illegal") throw new Error(name);
  if (typeof outcome.reason !== "string" || outcome.reason.length === 0) throw new Error(name);
}

export const ASSERTIONS: Assertion[] = [
  // J4 连线胜（J3/J6 计数各与胜者匹配）
  {
    name: "x-row-win",
    run: (c) =>
      expectStatus(c, [X, X, X, O, O, N, X, O, N], "x_win", "x-row-win"), // x=4 o=3
  },
  {
    name: "o-row-win",
    run: (c) => expectStatus(c, [X, X, N, O, O, O, X, N, N], "o_win", "o-row-win"), // x=3 o=3
  },
  {
    name: "diagonal-win",
    run: (c) => expectStatus(c, [X, O, N, N, X, O, N, N, X], "x_win", "diagonal-win"), // x=3 o=2
  },
  // J4 列线与反对角线（评审 round1 补：胜线须覆盖行/列/主对角/反对角四形态）
  {
    name: "x-column-win",
    run: (c) => expectStatus(c, [X, O, N, X, O, N, X, N, N], "x_win", "x-column-win"), // x=3 o=2
  },
  {
    name: "o-anti-diagonal-win",
    run: (c) => expectStatus(c, [X, N, O, N, O, N, O, X, X], "o_win", "o-anti-diagonal-win"), // x=3 o=3
  },
  // J7 终态
  {
    name: "draw",
    run: (c) => expectStatus(c, [X, O, X, O, O, X, X, X, O], "draw", "draw"), // 满盘无胜
  },
  {
    name: "playing",
    run: (c) => expectStatus(c, [X, O, N, N, N, N, N, N, N], "playing", "playing"),
  },
  // J5 双胜（x=4 o=3，两条连线并存；双胜的 illegal 判定优先于胜者计数）
  {
    name: "double-winner",
    run: (c) => expectIllegal(c, [X, X, X, O, O, O, X, N, N], "double-winner"),
  },
  // J3 计数平衡
  {
    name: "illegal-x-fewer-than-o",
    run: (c) => expectIllegal(c, [X, O, O, N, N, N, N, N, N], "illegal-x-fewer-than-o"),
  },
  {
    name: "illegal-count-gap-over-one",
    run: (c) => expectIllegal(c, [X, X, X, O, N, N, N, N, N], "illegal-count-gap-over-one"),
  },
  // J6 胜者计数匹配（x 有连线但 x=o，胜者计数不匹配）
  {
    name: "illegal-winner-count-mismatch",
    run: (c) => expectIllegal(c, [X, X, X, O, O, N, N, N, O], "illegal-winner-count-mismatch"),
  },
  // J2 非法输入
  {
    name: "illegal-invalid-piece",
    run: (c) => expectIllegal(c, [X, "z", N, N, N, N, N, N, N], "illegal-invalid-piece"),
  },
  {
    name: "illegal-board-shape",
    run: (c) => {
      const notArray = c.judge("not-a-board") as JudgeOutcome;
      if (notArray?.status !== "illegal") throw new Error("illegal-board-shape");
      const wrongLength = c.judge([X, O, N]) as JudgeOutcome;
      if (wrongLength?.status !== "illegal") throw new Error("illegal-board-shape");
    },
  },
];
