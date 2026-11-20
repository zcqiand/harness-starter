/** HUD：分数 / 速度档（每 5 分一档）/ 最高分。数值独立成节点，便于测试按字面命中。 */
// @impl M05.F01.I03 — Hud 数值显示（function-tree M05.F01）
export default function Hud({ score, speedLevel, best }: { score: number; speedLevel: number; best: number }) {
  return (
    <div className="flex gap-6 items-baseline mb-4">
      <div className="text-sm text-slate-600">
        分数 <span className="text-xl font-bold text-slate-900">{score}</span>
      </div>
      <div className="text-sm text-slate-600">
        速度档 <span className="text-xl font-bold text-slate-900">{speedLevel}</span>
      </div>
      <div className="text-sm text-slate-600">
        最高分 <span className="text-xl font-bold text-slate-900">{best}</span>
      </div>
    </div>
  );
}
