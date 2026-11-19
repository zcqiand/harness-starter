// ch5 双臂实验——评分器：跑断言集给候选计分，一行一候选追加进 report.json。
// 用法：node lab/run/score.mjs <candidate-dir> --arm <prompt|spec> --round <n> [--report <json-path>]
// 行形状：{arm, round, candidate, checksTotal, checksFailed, failedNames, verdict}
// verdict 三态：pass（全过）/ fail（有断言失败）/ error（judge 缺失、非函数或加载即炸）。
// 评分面恒 exit 0——error 行也是数据行，不 crash；只有用法错误（缺参/坏臂名）才 exit 1。
// Node 24 原生 type stripping：断言集与候选 judge.ts 均走动态 import，无需预编译。
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = fileURLToPath(new URL(".", import.meta.url));
const ASSERTIONS_URL = pathToFileURL(resolve(SCRIPT_DIR, "..", "assertions", "judge.assertions.ts")).href;

function usage(message) {
  console.error(`用法: node lab/run/score.mjs <candidate-dir> --arm <prompt|spec> --round <n> [--report <json-path>]`);
  if (message) console.error(`错误: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  let arm;
  let round;
  let report;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--arm") {
      arm = argv[++i];
    } else if (arg === "--round") {
      round = argv[++i];
    } else if (arg === "--report") {
      report = argv[++i];
    } else {
      positional.push(arg);
    }
  }
  if (positional.length !== 1) usage("需要且只需要一个候选目录参数");
  if (arm !== "prompt" && arm !== "spec") usage(`--arm 必须是 prompt 或 spec，收到 ${JSON.stringify(arm)}`);
  const roundNum = Number(round);
  if (!Number.isInteger(roundNum) || roundNum < 1) usage(`--round 必须是正整数，收到 ${JSON.stringify(round)}`);
  return {
    candidateDir: resolve(positional[0]),
    arm,
    round: roundNum,
    reportPath: resolve(report ?? join(SCRIPT_DIR, "report.json")),
  };
}

// 候选加载：目录缺 judge.ts / judge 非函数 / 模块加载即抛 ⇒ 都归 verdict:"error"
async function loadJudge(candidateDir) {
  const judgePath = join(candidateDir, "judge.ts");
  if (!existsSync(judgePath)) {
    return { error: `judge.ts not found in ${candidateDir}` };
  }
  try {
    const mod = await import(pathToFileURL(judgePath).href);
    if (typeof mod.judge !== "function") {
      return { error: "judge export is not a function" };
    }
    return { judge: mod.judge };
  } catch (err) {
    return { error: `judge.ts failed to load: ${err?.message ?? String(err)}` };
  }
}

async function main() {
  const { candidateDir, arm, round, reportPath } = parseArgs(process.argv.slice(2));
  const loaded = await loadJudge(candidateDir);

  const assertionsMod = await import(ASSERTIONS_URL);
  const { ASSERTIONS } = assertionsMod;

  const failedNames = [];
  if (loaded.judge) {
    const candidate = { judge: loaded.judge };
    for (const assertion of ASSERTIONS) {
      try {
        assertion.run(candidate);
      } catch {
        failedNames.push(assertion.name);
      }
    }
  }

  const verdict = loaded.error ? "error" : failedNames.length === 0 ? "pass" : "fail";
  const row = {
    arm,
    round,
    candidate: basename(candidateDir),
    checksTotal: ASSERTIONS.length,
    checksFailed: failedNames.length,
    failedNames,
    verdict,
  };
  if (loaded.error) row.error = loaded.error;

  // 追加语义：report.json 无则建数组，有则 push
  let rows = [];
  if (existsSync(reportPath)) {
    try {
      const parsed = JSON.parse(readFileSync(reportPath, "utf8"));
      if (Array.isArray(parsed)) rows = parsed;
    } catch {
      // 现存文件不可解析时从空数组起，不吞掉本次评分
      console.error(`警告: ${reportPath} 不是可解析的 JSON 数组，已从空数组重建`);
    }
  }
  rows.push(row);
  writeFileSync(reportPath, JSON.stringify(rows, null, 2) + "\n");

  console.log(JSON.stringify(row));
  process.exit(0); // 评分面恒 exit 0：error 行也是数据行
}

main().catch((err) => {
  console.error(`评分器内部错误: ${err?.stack ?? err}`);
  process.exit(1);
});
