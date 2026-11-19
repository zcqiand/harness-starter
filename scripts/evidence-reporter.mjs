// 证据回执 reporter：每次 vitest run 结束把运行证据落盘到 evidence/latest.json，
// 供页面烘焙展示「规则可溯源」的测试回执链。
// vitest 3 自定义 reporter 走 onTestRunEnd（jest 风格 onRunComplete 已移除）。
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(repoRoot, "evidence", "latest.json");

export default class EvidenceReporter {
  async onTestRunEnd(testModules, _unhandledErrors, _reason) {
    const files = testModules.length;
    let checks = 0;
    let failures = 0;
    for (const mod of testModules) {
      for (const test of mod.children.allTests()) {
        checks += 1;
        if (test.result()?.status === "failed") {
          failures += 1;
        }
      }
    }
    const commit = execSync("git rev-parse --short HEAD", {
      cwd: repoRoot,
    })
      .toString()
      .trim();

    const receipt = {
      commit,
      generatedAt: new Date().toISOString(),
      files,
      checks,
      failures,
      allGreen: failures === 0,
      source: process.env.CI ? "ci" : "local",
    };

    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(receipt, null, 2) + "\n", "utf-8");
  }
}
