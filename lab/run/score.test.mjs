// ch5 双臂评分器测试：--report 注入临时 json 路径，断言行形状与 verdict 判定。
// good 全过 / bad-misses-draw 恰挂 draw / 空目录 error 行 / report.json 追加语义。
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(fileURLToPath(new URL("./score.mjs", import.meta.url)));
const REPO = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const CANDIDATES = join(REPO, "lab", "candidates");

function run(candidateDir, extra = []) {
  return spawnSync(process.execPath, [SCRIPT, candidateDir, ...extra], {
    encoding: "utf8",
    cwd: REPO,
    timeout: 30000,
  });
}

// 评分器最后一行 stdout 是本行的 JSON——逐行取最后一个非空行解析
function lastJsonLine(stdout) {
  const lines = stdout.trim().split("\n");
  return JSON.parse(lines[lines.length - 1]);
}

describe("lab/run/score.mjs", () => {
  it("good 候选：verdict pass、checksFailed 0、行形状带 arm/round/candidate", () => {
    const r = run(CANDIDATES + "/good", ["--arm", "spec", "--round", "2", "--report", join(tmpdir(), "unused-score-report.json")]);
    expect(r.status).toBe(0);
    const row = lastJsonLine(r.stdout);
    expect(row).toMatchObject({
      arm: "spec",
      round: 2,
      candidate: "good",
      checksFailed: 0,
      failedNames: [],
      verdict: "pass",
    });
    expect(row.checksTotal).toBeGreaterThan(0);
  });

  it("bad-misses-draw 候选：verdict fail、failedNames 含 draw", () => {
    const r = run(CANDIDATES + "/bad-misses-draw", ["--arm", "prompt", "--round", "1", "--report", join(tmpdir(), "unused-score-report.json")]);
    expect(r.status).toBe(0);
    const row = lastJsonLine(r.stdout);
    expect(row.verdict).toBe("fail");
    expect(row.failedNames).toContain("draw");
    expect(row.checksFailed).toBe(1);
    expect(row.checksTotal).toBeGreaterThan(row.checksFailed);
  });

  it("空目录（judge 缺失）：verdict error、恒 exit 0", () => {
    const base = mkdtempSync(join(tmpdir(), "score-empty-"));
    try {
      const r = run(base, ["--arm", "prompt", "--round", "1", "--report", join(base, "report.json")]);
      expect(r.status).toBe(0);
      const row = lastJsonLine(r.stdout);
      expect(row.verdict).toBe("error");
      expect(row.candidate).toBeTruthy();
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  it("report.json 追加语义：同一 --report 跑两次后长度 2", () => {
    const base = mkdtempSync(join(tmpdir(), "score-append-"));
    const report = join(base, "report.json");
    try {
      const a = run(CANDIDATES + "/good", ["--arm", "prompt", "--round", "1", "--report", report]);
      expect(a.status).toBe(0);
      const b = run(CANDIDATES + "/bad-misses-draw", ["--arm", "spec", "--round", "2", "--report", report]);
      expect(b.status).toBe(0);
      const rows = JSON.parse(readFileSync(report, "utf8"));
      expect(Array.isArray(rows)).toBe(true);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({ candidate: "good", verdict: "pass" });
      expect(rows[1]).toMatchObject({ candidate: "bad-misses-draw", verdict: "fail" });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  it("无 judge 的目录里塞非函数 judge.ts：verdict error、不 crash", async () => {
    const base = mkdtempSync(join(tmpdir(), "score-notfn-"));
    try {
      const { writeFileSync } = await import("node:fs");
      writeFileSync(join(base, "judge.ts"), "export const judge = 42;\n");
      const r = run(base, ["--arm", "spec", "--round", "3", "--report", join(base, "report.json")]);
      expect(r.status).toBe(0);
      const row = lastJsonLine(r.stdout);
      expect(row.verdict).toBe("error");
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});
