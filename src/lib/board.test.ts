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
