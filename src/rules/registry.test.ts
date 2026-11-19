import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RULES, resolveAssertionChain } from "./registry";
import { RULE_IDS } from "./ids";

const root = resolve(__dirname, "../..");
const specText = readFileSync(resolve(root, "docs/specs/snake-advanced.spec.md"), "utf8");

/**
 * 按规约行结构抽出条款的完整「规则：」行：每条款为
 * `### S<N> 标题` → 空行 → `规则：…`（单行一段），可无歧义取整行做全等比对。
 * 引文审计由此从 includes() 语义升级为整行全等——截断式引文（"S99" 类伪造漂移）不再能通过。
 */
function clauseRuleLine(spec: string, clause: string): string {
  const lines = spec.split(/\r?\n/);
  const headingIdx = lines.findIndex((l) => l.startsWith(`### ${clause} `));
  if (headingIdx < 0) throw new Error(`规约缺条款标题 ${clause}`);
  for (let i = headingIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("### ")) break;
    if (line.startsWith("规则：")) return line;
  }
  throw new Error(`条款 ${clause} 下未找到「规则：」行`);
}

describe("registry audit", () => {
  it("quotes each clause's full rule line verbatim", () => {
    for (const r of RULES) {
      expect(r.specQuote, `${r.id} 引文不等于条款 ${r.specClause} 的完整「规则：」行`).toBe(
        clauseRuleLine(specText, r.specClause)
      );
    }
  });
  it("resolves every assertion anchor to a real test", () => {
    for (const r of RULES) {
      const text = readFileSync(resolve(root, r.assertionRef.file), "utf8");
      expect(resolveAssertionChain(text, r.assertionRef.test), `${r.id} 断言锚解析失败`).toBe(true);
    }
  });
  it("leaves no orphan spec clause", () => {
    const clauses = [...specText.matchAll(/^### (S\d+)/gm)].map((m) => m[1]);
    const cited = new Set(RULES.map((r) => r.specClause));
    for (const c of clauses) expect(cited.has(c), `孤儿条款 ${c}`).toBe(true);
  });
  it("keeps RULES and RULE_IDS in exact set equality", () => {
    // 双向封死：注册表多行（id 不在 RULE_IDS）/ ids.ts 漏行（RULE_IDS 缺注册表成员）都红
    const fromRules = new Set(RULES.map((r) => r.id));
    const fromIds = new Set(RULE_IDS);
    expect(fromRules.size).toBe(RULES.length);
    expect(fromIds.size).toBe(RULE_IDS.length);
    for (const id of fromIds) expect(fromRules.has(id), `注册表缺 ${id}`).toBe(true);
    for (const id of fromRules) expect(fromIds.has(id), `ids.ts 缺 ${id}`).toBe(true);
  });
  it("keeps specClause unique across rules", () => {
    const clauses = RULES.map((r) => r.specClause);
    expect(new Set(clauses).size, "specClause 出现重复").toBe(RULES.length);
  });
  it("detects a drifted assertion anchor", () => {
    const fake = 'describe("engine tick", () => { it("renamed test", () => {}); });';
    expect(resolveAssertionChain(fake, "engine tick > renamed test")).toBe(true);
    expect(resolveAssertionChain(fake, "engine tick > old name")).toBe(false);
  });
});
