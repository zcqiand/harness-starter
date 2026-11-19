// ch4 backup.mjs 测试：spawn 真实临时 git 仓跑备份脚本，断言 exit code 与 bundle 产物。
import { describe, it, expect, beforeAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, existsSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(fileURLToPath(new URL("./backup.mjs", import.meta.url)));

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    timeout: 30000,
  });
}

// 当日本地时区日期，与脚本实现同一口径断言文件名
function todayStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

describe("scripts/backup.mjs", () => {
  let repoDir;
  let destDir;

  beforeAll(() => {
    const base = mkdtempSync(join(tmpdir(), "harness-backup-"));
    repoDir = join(base, "demo-repo");
    destDir = join(base, "dest");
    mkdirSync(repoDir, { recursive: true });
    mkdirSync(destDir, { recursive: true });
    const g = (args, cwd) =>
      spawnSync("git", args, { cwd, encoding: "utf8", timeout: 30000 });
    g(["init"], repoDir);
    g(["config", "user.email", "t@t.local"], repoDir);
    g(["config", "user.name", "t"], repoDir);
    g(["add", "-A"], repoDir);
    g(["commit", "-m", "init", "--allow-empty"], repoDir);
  });

  it("happy path：bundle 生成且名含仓名与当日日期", () => {
    const r = run([repoDir, destDir]);
    expect(r.status).toBe(0);
    const bundle = join(destDir, `demo-repo-${todayStamp()}.bundle`);
    expect(existsSync(bundle)).toBe(true);
  });

  it("同日重复备份：先删再建，不报错", () => {
    const r = run([repoDir, destDir]);
    expect(r.status).toBe(0);
    const bundle = join(destDir, `demo-repo-${todayStamp()}.bundle`);
    expect(existsSync(bundle)).toBe(true);
  });

  it("缺参数 ⇒ exit 1 且有用法提示", () => {
    const r = run([]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("用法");
  });

  it("非 git 目录 ⇒ exit 1", () => {
    const notGit = mkdtempSync(join(tmpdir(), "harness-notgit-"));
    try {
      const r = run([notGit, destDir]);
      expect(r.status).toBe(1);
    } finally {
      rmSync(notGit, { recursive: true, force: true });
    }
  });
});
