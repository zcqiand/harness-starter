/** 棋盘纯逻辑模块：20x20 网格常量、传送门对与格子/坐标类型。 */
// @impl M01.F01.I01 — 网格与传送门常量（function-tree M01.F01）

export type Pos = { x: number; y: number };

export type Cell = "empty" | "snake" | "food" | "gold" | "portal_a" | "portal_b";

export const BOARD_ROWS = 20;
export const BOARD_COLS = 20;

export const PORTAL_A: Pos = { x: 2, y: 2 };
export const PORTAL_B: Pos = { x: 17, y: 17 };
