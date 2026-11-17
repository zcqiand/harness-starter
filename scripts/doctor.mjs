// ch4 工具链体检：Node / Python / Godot 三件可运行检查。
// 用法：node scripts/doctor.mjs
// 退出码：0=三件齐；1=有缺失（书 ch4 口径：fail-fast，不做默认兜底）。

import { execFileSync } from "node:child_process";

function probe(name, args, parse) {
  try {
    const out = execFileSync(name, args, { encoding: "utf8", timeout: 15000 });
    return { name, ok: true, detail: parse(out) };
  } catch {
    return { name, ok: false, detail: "未找到或不可运行" };
  }
}

const probes = [
  probe("node", ["--version"], (o) => `Node ${o.trim().replace(/^v/, "")}`),
  probe("python", ["--version"], (o) => o.trim()),
  probe("godot", ["--version"], (o) => `Godot ${o.trim().split("\n")[0]}`),
];

let missing = 0;
for (const p of probes) {
  console.log(`${p.ok ? "[OK]" : "[MISS]"} ${p.name}: ${p.detail}`);
  if (!p.ok) missing += 1;
}

if (missing > 0) {
  console.log(`\n${missing} 件工具缺失——按书 ch4 安装并回填 version-lock.json 实测回执。`);
  process.exit(1);
}
console.log("\n工具链三件齐。");
