import type { Cell } from "../lib/board";

/** 格型 → 语义类（cell-portal_a 转连字符 cell-portal-a）+ 底色。 */
const CELL_CLASS: Record<Cell, string> = {
  empty: "cell-empty bg-slate-100",
  snake: "cell-snake bg-emerald-600",
  food: "cell-food bg-red-500",
  gold: "cell-gold bg-amber-400",
  portal_a: "cell-portal-a bg-violet-500",
  portal_b: "cell-portal-b bg-fuchsia-500",
};

/** 棋盘：20x20 格网纯渲染，格型只走语义类名，不掺游戏逻辑。 */
export default function BoardView({ grid }: { grid: Cell[][] }) {
  return (
    <div aria-label="board" className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-px w-fit bg-slate-300 p-px rounded">
      {grid.flatMap((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${CELL_CLASS[cell]}`}
          />
        )),
      )}
    </div>
  );
}
