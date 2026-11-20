// @impl M05.F02.I01 — RuleSidebar 规则徽标侧栏（function-tree M05.F02）
import type { RuleMeta } from "../rules/registry";
import type { RuleId } from "../rules/ids";

/** 规则徽标侧栏：全量 10 条规则，lit 集合内的徽标加 ring 高亮（触发点亮），点开送溯源面板。 */
export default function RuleSidebar({
  rules,
  lit,
  onOpen,
}: {
  rules: RuleMeta[];
  lit: Set<RuleId>;
  onOpen: (rule: RuleMeta) => void;
}) {
  return (
    <aside className="min-w-56">
      <h2 className="text-sm font-semibold text-slate-500 mb-2">规则徽标（点开溯源）</h2>
      <ul className="space-y-1">
        {rules.map((r) => {
          const isLit = lit.has(r.id);
          return (
            <li key={r.id}>
              <button
                type="button"
                aria-label={`rule-${r.id}`}
                onClick={() => onOpen(r)}
                className={
                  "w-full text-left rounded px-2 py-1 text-sm border transition-colors " +
                  (isLit
                    ? "ring-2 ring-amber-400 border-amber-400 bg-amber-50 text-amber-900 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
                }
              >
                {r.title}
                {isLit && <span className="ml-2 text-xs text-amber-600">● 触发</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
