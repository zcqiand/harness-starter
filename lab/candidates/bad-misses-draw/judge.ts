// ch5 双臂实验——坏候选一：满盘无胜时误报 playing，不认和棋。
// 「坏」的程度被刻意收窄：只缺 J7 的 draw 分支，其余条款实现与 good 候选逐字一致，
// 因此恰挂 draw 一条断言、failedNames=["draw"]。评分器据此演示"规约缺一条，断言集指名道姓"。

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
  if (!Array.isArray(board) || board.length !== 9) {
    return illegal("board must be an array of 9 cells");
  }
  for (const cell of board) {
    if (cell !== "x" && cell !== "o" && cell !== null) {
      return illegal(`invalid cell value: ${String(cell)}`);
    }
  }
  const xCount = board.filter((c) => c === "x").length;
  const oCount = board.filter((c) => c === "o").length;
  if (xCount !== oCount && xCount !== oCount + 1) {
    return illegal(`piece counts out of balance: x=${xCount} o=${oCount}`);
  }
  const xWins = hasLine(board, "x");
  const oWins = hasLine(board, "o");
  if (xWins && oWins) {
    return illegal("both players have a winning line");
  }
  if (xWins) {
    if (xCount !== oCount + 1) return illegal("x wins but piece counts do not match");
    return { status: "x_win" };
  }
  if (oWins) {
    if (xCount !== oCount) return illegal("o wins but piece counts do not match");
    return { status: "o_win" };
  }
  // 【种子缺陷】满盘无胜应返回 draw，本候选漏掉该分支，一律报 playing
  return { status: "playing" };
}
