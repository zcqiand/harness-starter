// @impl M05.F02.I02 — ProvenancePanel 溯源面板（function-tree M05.F02）
import type { RuleMeta } from "../rules/registry";

/** 证据回执形状 = evidence/latest.json 七字段（reporter 落盘契约）。 */
export interface Receipt {
  commit: string;
  generatedAt: string;
  files: number;
  checks: number;
  failures: number;
  allGreen: boolean;
  source: string;
}

/** 溯源面板三件套：规约引文（specQuote 逐字）/ 断言锚（测试文件+用例整链）/ 证据回执（最近一次绿 run）。 */
export default function ProvenancePanel({ rule, receipt }: { rule: RuleMeta; receipt: Receipt }) {
  return (
    <section aria-label="provenance" className="mt-4 rounded border border-slate-200 bg-slate-50 p-4 text-sm">
      <h3 className="font-semibold text-slate-900 mb-2">
        溯源：{rule.title}（条款 {rule.specClause}）
      </h3>
      <blockquote className="border-l-4 border-emerald-500 pl-3 mb-2 text-slate-800">
        {rule.specQuote}
      </blockquote>
      <p className="mb-2 text-slate-600">
        断言锚：<span className="font-mono">{rule.assertionRef.file}</span> —{" "}
        <span className="font-mono">{rule.assertionRef.test}</span>
      </p>
      <p className="text-slate-500 mb-2">UI 提示：{rule.uiHint}</p>
      <div className="rounded bg-white border border-slate-200 px-3 py-2 text-xs text-slate-600">
        <p>
          证据回执：commit <span className="font-mono">{receipt.commit}</span> · checks{" "}
          {receipt.checks} · failures {receipt.failures} ·{" "}
          {receipt.allGreen ? "全绿" : "有红"}
        </p>
        <p className="text-slate-400">
          generatedAt {receipt.generatedAt}（{receipt.source}）
        </p>
      </div>
    </section>
  );
}
