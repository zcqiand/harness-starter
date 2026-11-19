// ch4 git bundle 备份脚本：把任意本地 git 仓打成单文件 bundle 快照。
// 用法：node scripts/backup.mjs <repo-path> <dest-dir>
// 行为：git bundle create <dest>/<repo名>-YYYYMMDD.bundle --all（当日已存在先删再建，本地时区日期）。
// 退出码：0=备份完成；1=参数缺失或路径不是 git 仓（fail-fast，不做兜底）。

import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join, resolve, basename } from "node:path";

const USAGE = "用法：node scripts/backup.mjs <repo-path> <dest-dir>";

const [repoArg, destArg] = process.argv.slice(2);
if (!repoArg || !destArg) {
  console.error(USAGE);
  console.error("缺少参数：<repo-path> 与 <dest-dir> 均必填。");
  process.exit(1);
}

const repoPath = resolve(repoArg);
const gitDir = join(repoPath, ".git");
if (!existsSync(gitDir)) {
  console.error(USAGE);
  console.error(`路径不是 git 仓（未找到 .git）：${repoPath}`);
  process.exit(1);
}

// 本地时区当日日期 YYYYMMDD
const now = new Date();
const p = (n) => String(n).padStart(2, "0");
const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}`;

const repoName = basename(repoPath);
const bundlePath = join(resolve(destArg), `${repoName}-${stamp}.bundle`);

// 当日已存在先删再建，保证拿到的是本次 HEAD 的快照
if (existsSync(bundlePath)) {
  rmSync(bundlePath);
}

const r = spawnSync("git", ["bundle", "create", bundlePath, "--all"], {
  cwd: repoPath,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
if (r.status !== 0) {
  console.error(r.stderr || `git bundle create 失败（exit ${r.status}）`);
  process.exit(r.status ?? 1);
}

console.log(`备份完成：${bundlePath}`);
