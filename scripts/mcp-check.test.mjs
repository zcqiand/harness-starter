// ch4 mcp-check.mjs 测试：--config 注入 fixture，断言 server 清点输出与退出码。
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(fileURLToPath(new URL("./mcp-check.mjs", import.meta.url)));
const FIXTURES = resolve(fileURLToPath(new URL("./__fixtures__/mcp", import.meta.url)));

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    timeout: 30000,
  });
}

describe("scripts/mcp-check.mjs", () => {
  it("json fixture：输出 filesystem: configured，exit 0", () => {
    const r = run(["--config", resolve(FIXTURES, "mcp.json")]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("filesystem: configured");
  });

  it("toml fixture：输出 docs: configured，exit 0", () => {
    const r = run(["--config", resolve(FIXTURES, "config.toml")]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("docs: configured");
  });

  it("配置文件不存在 ⇒ exit 1", () => {
    const r = run(["--config", resolve(FIXTURES, "no-such-file.json")]);
    expect(r.status).toBe(1);
  });
});
