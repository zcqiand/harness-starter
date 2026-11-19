// ch4 MCP 配置连通检查脚本：清点各配置文件里登记了哪些 MCP server。
// 用法：node scripts/mcp-check.mjs [--config <path>...]
//   缺省探 ./.mcp.json 与 ~/.codex/config.toml。
//   .json 取 mcpServers 键名清单；.toml 正则收 [mcp_servers.<name>] 段名。
// 输出：逐 server 一行 `name: configured`。
// 退出码：0=至少发现一个 server；1=配置全缺失/无 server（未发现 MCP 配置）。
// 连通 ping 不在此做——真连接演示归书稿侧。

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const args = process.argv.slice(2);
let configs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--config") {
    const v = args[++i];
    if (!v) {
      console.error("--config 需要一个配置文件路径。");
      process.exit(1);
    }
    configs.push(v);
  }
}
if (configs.length === 0) {
  configs = [resolve(".mcp.json"), resolve(homedir(), ".codex", "config.toml")];
}

function collectFromJson(path) {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  const servers = parsed.mcpServers ?? {};
  return Object.keys(servers);
}

// 只认段名正则，不做 TOML 全量解析（教学口径：够用即止）
function collectFromToml(path) {
  const text = readFileSync(path, "utf8");
  const names = [];
  const re = /^\s*\[mcp_servers\.([A-Za-z0-9_-]+)\s*\]/gm;
  let m;
  while ((m = re.exec(text)) !== null) names.push(m[1]);
  return names;
}

const found = [];
for (const c of configs) {
  const path = resolve(c);
  if (!existsSync(path)) continue;
  const names = path.endsWith(".toml") ? collectFromToml(path) : collectFromJson(path);
  for (const n of names) found.push(n);
}

if (found.length === 0) {
  console.error("未发现 MCP 配置——查 .mcp.json 或 ~/.codex/config.toml。");
  process.exit(1);
}

for (const n of found) {
  console.log(`${n}: configured`);
}
