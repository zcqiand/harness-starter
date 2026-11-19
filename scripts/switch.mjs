// ch4 多项目快速切换脚本：从项目清单查 name，给出进入与启动命令。
// 用法：node scripts/switch.mjs <name> [--config <manifest>] [--exec]
//   --config   指定清单路径（缺省 scripts/projects.json）
//   --exec     打印之外直接在项目目录 spawn launch
// 清单形状：{ "projects": [{ "name", "path", "launch" }] }，path 相对 suite 根。
// 退出码：0=命中；1=缺参数/未知 name/清单缺失（fail-fast，不做兜底）。

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const DEFAULT_MANIFEST = join(scriptDir, "projects.json");

// 清单里的 path 相对 suite 根（本仓宿主 = <suite>/output/harness-starter）。
// 从本脚本目录逐级上溯，找第一个能拼出该路径的祖先目录——worktree 与主检出都成立。
function resolveProjectPath(rel) {
  let dir = scriptDir;
  for (;;) {
    const candidate = join(dir, rel);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// 解析参数：第一个非 -- 词为 name；--config 吃下一个值；--exec 为开关
const args = process.argv.slice(2);
let name = null;
let manifestPath = DEFAULT_MANIFEST;
let doExec = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--config") {
    manifestPath = args[++i];
    if (!manifestPath) {
      console.error("--config 需要一个清单路径。");
      process.exit(1);
    }
  } else if (args[i] === "--exec") {
    doExec = true;
  } else if (name === null) {
    name = args[i];
  }
}

if (!name) {
  console.error("用法：node scripts/switch.mjs <name> [--config <manifest>] [--exec]");
  console.error("缺少参数：必须给出项目 name。");
  process.exit(1);
}

const absManifest = resolve(manifestPath);
if (!existsSync(absManifest)) {
  console.error(`清单不存在：${absManifest}`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(absManifest, "utf8"));
const projects = manifest.projects ?? [];

const hit = projects.find((p) => p.name === name);
if (!hit) {
  console.error(`未知项目名：${name}`);
  console.error(`可用：${projects.map((p) => p.name).join(" / ") || "（清单为空）"}`);
  process.exit(1);
}

let absPath = resolve(hit.path);
if (!existsSync(absPath)) {
  // 不是现成绝对路径时，按 suite 根相对语义逐级上溯找
  const found = resolveProjectPath(hit.path);
  if (!found) {
    console.error(`项目目录不存在（清单 path 相对 suite 根）：${hit.path}`);
    process.exit(1);
  }
  absPath = found;
}

console.log(`cd ${absPath}`);
if (hit.launch) console.log(hit.launch);

if (doExec && hit.launch) {
  const r = spawnSync(hit.launch, {
    cwd: absPath,
    stdio: "inherit",
    shell: true,
  });
  process.exit(r.status ?? 1);
}
