// ch4 switch.mjs 测试：--config 注入临时清单，断言路径打印与未知名/缺参 exit 1。
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(fileURLToPath(new URL("./switch.mjs", import.meta.url)));

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    timeout: 30000,
  });
}

// 造一份临时清单：alpha 指向真实临时目录，beta 仅作清单名
function makeFixture() {
  const base = mkdtempSync(join(tmpdir(), "harness-switch-"));
  const projDir = join(base, "alpha-project");
  mkdirSync(projDir, { recursive: true });
  const manifest = join(base, "projects.json");
  writeFileSync(
    manifest,
    JSON.stringify(
      {
        projects: [
          { name: "alpha", path: projDir, launch: "npm run dev" },
          { name: "beta", path: join(base, "beta-project"), launch: "npm run dev" },
        ],
      },
      null,
      2,
    ),
  );
  return { base, projDir, manifest, cleanup: () => rmSync(base, { recursive: true, force: true }) };
}

describe("scripts/switch.mjs", () => {
  it("已知 name：打印 cd <绝对路径> 与 launch 命令", () => {
    const f = makeFixture();
    try {
      const r = run(["alpha", "--config", f.manifest]);
      expect(r.status).toBe(0);
      expect(r.stdout).toContain("cd");
      expect(r.stdout).toContain(f.projDir);
      expect(r.stdout).toContain("npm run dev");
    } finally {
      f.cleanup();
    }
  });

  it("未知 name ⇒ exit 1 且 stderr 列出清单里的可用名", () => {
    const f = makeFixture();
    try {
      const r = run(["nope", "--config", f.manifest]);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain("alpha");
      expect(r.stderr).toContain("beta");
    } finally {
      f.cleanup();
    }
  });

  it("缺参数 ⇒ exit 1", () => {
    const r = run([]);
    expect(r.status).toBe(1);
  });
});
