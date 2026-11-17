import { BOARD_COLS, BOARD_ROWS, emptyBoard } from "./lib/board";

/** ch6 页面壳：贪吃蛇进阶页面。游戏逻辑随章节灌入，本壳只渲染空棋盘骨架。 */
export default function App() {
  const board = emptyBoard();
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold mb-4">harness-starter</h1>
      <p className="text-sm text-gray-500 mb-4">
        ch6 第一个可验证项目（骨架）：规则契约与断言随章节灌入
      </p>
      <div
        aria-label="board"
        className="grid gap-px bg-gray-300 border border-gray-400"
        style={{
          gridTemplateColumns: `repeat(${BOARD_COLS}, 24px)`,
          gridTemplateRows: `repeat(${BOARD_ROWS}, 24px)`,
        }}
      >
        {board.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={cell ? "bg-gray-800" : "bg-white"}
            />
          )),
        )}
      </div>
    </main>
  );
}
