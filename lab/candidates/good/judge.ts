// ch5 双臂实验——「规约+断言臂」好候选：逐条款实现 lab/spec/tic-tac-toe.spec.md（J1-J7）。
// Node 24 原生 type stripping 可直接 import 本文件；评分器按 judge.assertions 的
// failedNames 对本候选计分，期望失败数为 0。

const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function hasLine(cells: unknown[], piece: string): boolean {
  return LINES.some((line) => line.every((i) => cells[i] === piece));
}

function illegal(reason: string): { status: string; reason: string } {
  return { status: "illegal", reason };
}

export function judge(board: unknown): unknown {
  // J1/J2 入参自验：非数组、长度不为 9、非法棋子一律 illegal
  if (!Array.isArray(board) || board.length !== 9) {
    return illegal("board must be an array of 9 cells");
  }
  for (const cell of board) {
    if (cell !== "x" && cell !== "o" && cell !== null) {
      return illegal(`invalid cell value: ${String(cell)}`);
    }
  }
  // J3 计数平衡：x=o 或 x=o+1（x 先行）
  const xCount = board.filter((c) => c === "x").length;
  const oCount = board.filter((c) => c === "o").length;
  if (xCount !== oCount && xCount !== oCount + 1) {
    return illegal(`piece counts out of balance: x=${xCount} o=${oCount}`);
  }
  const xWins = hasLine(board, "x");
  const oWins = hasLine(board, "o");
  // J5 双胜优先于胜者计数：双方同连线即 illegal
  if (xWins && oWins) {
    return illegal("both players have a winning line");
  }
  // J6 胜者计数匹配
  if (xWins) {
    if (xCount !== oCount + 1) return illegal("x wins but piece counts do not match");
    return { status: "x_win" };
  }
  if (oWins) {
    if (xCount !== oCount) return illegal("o wins but piece counts do not match");
    return { status: "o_win" };
  }
  // J7 终态
  if (xCount + oCount === 9) return { status: "draw" };
  return { status: "playing" };
}
