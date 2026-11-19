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
  async onTestRunEnd(testModules, unhandledErrors, _reason) {
    const files = testModules.length;
    let checks = 0;
    let failures = 0;
    for (const mod of testModules) {
      // 模块级失败（import/收集失败）可能无可枚举用例，必须单独计入，
      // 否则红 run 会产 allGreen=true 的假绿回执。
      if (mod.state() === "failed") {
        failures += 1;
      }
      for (const test of mod.children.allTests()) {
        checks += 1;
        if (test.result()?.status === "failed") {
          failures += 1;
        }
      }
    }
    // 未捕获错误（用例之外抛出）同样封锁 allGreen。
    failures += unhandledErrors.length;
    // git 元数据缺失退化：容器构建（node:24-alpine 无 git）、worktree 检出（.git 是
    // 指向宿主机 gitdir 的指针文件）场景 rev-parse 必失败——回执 commit 退化为 unknown，
    // 不阻断测试；CI 全量 checkout 自带 git + 全量 .git，仍取真 short SHA。
    let commit = "unknown";
    try {
      commit =
        execSync("git rev-parse --short HEAD", {
          cwd: repoRoot,
          stdio: ["ignore", "pipe", "ignore"],
        })
          .toString()
          .trim() || commit;
    } catch {
      // keep fallback
    }

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
