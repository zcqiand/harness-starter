// ch4 工具链体检：Node / Python / Godot 三件可运行检查。
// 用法：node scripts/doctor.mjs
// 退出码：0=三件齐；1=有缺失（书 ch4 口径：fail-fast，不做默认兜底）。

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

// Godot 不上 PATH，按装机实测回执钉路径（harness-jumper/version-lock.json 同源）。
const GODOT_EXE =
  "D:/qiand-life/3-resources/8-ego/software/godot/Godot_v4.7-stable_win64_console.exe";

function probe(name, args, parse) {
  try {
    const out = execFileSync(name, args, { encoding: "utf8", timeout: 15000 });
    return { name, ok: true, detail: parse(out) };
  } catch {
    return { name, ok: false, detail: "未找到或不可运行" };
  }
}

// Godot 检测：装机路径存在且 --version 可执行；MISS 分支保留（exit 1 语义不变）。
function probeGodot() {
  if (!existsSync(GODOT_EXE)) {
    return { name: "godot", ok: false, detail: `装机路径不存在：${GODOT_EXE}` };
  }
  try {
    const out = execFileSync(GODOT_EXE, ["--version"], {
      encoding: "utf8",
      timeout: 15000,
    });
    return {
      name: "godot",
      ok: true,
      detail: `Godot ${out.trim().split("\n")[0]}（${GODOT_EXE}）`,
    };
  } catch {
    return { name: "godot", ok: false, detail: `存在但 --version 不可运行：${GODOT_EXE}` };
  }
}

const probes = [
  probe("node", ["--version"], (o) => `Node ${o.trim().replace(/^v/, "")}`),
  probe("python", ["--version"], (o) => o.trim()),
  probeGodot(),
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
