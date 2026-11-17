import { describe, expect, it } from "vitest";
import { BOARD_COLS, BOARD_ROWS, emptyBoard } from "./board";

describe("emptyBoard", () => {
  it("返回 ROWS×COLS 网格", () => {
    const board = emptyBoard();
    expect(board).toHaveLength(BOARD_ROWS);
    for (const row of board) expect(row).toHaveLength(BOARD_COLS);
  });

  it("空板全为空格", () => {
    for (const row of emptyBoard()) {
      for (const cell of row) expect(cell).toBe(false);
    }
  });
});
