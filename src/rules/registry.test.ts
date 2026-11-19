import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RULES, resolveAssertionChain } from "./registry";

const root = resolve(__dirname, "../..");
const specText = readFileSync(resolve(root, "docs/specs/snake-advanced.spec.md"), "utf8");

describe("registry audit", () => {
  it("quotes every spec clause verbatim", () => {
    for (const r of RULES) {
      expect(specText.includes(r.specQuote), `${r.id} 引文未逐字命中规约`).toBe(true);
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
  it("detects a drifted assertion anchor", () => {
    const fake = 'describe("engine tick", () => { it("renamed test", () => {}); });';
    expect(resolveAssertionChain(fake, "engine tick > renamed test")).toBe(true);
    expect(resolveAssertionChain(fake, "engine tick > old name")).toBe(false);
  });
});
