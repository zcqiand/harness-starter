import type { RuleId } from "./ids";

export interface RuleMeta {
  id: RuleId;
  title: string;
  specClause: string;
  specQuote: string;
  assertionRef: { file: string; test: string };
  uiHint: string;
  triggerable: boolean;
}

// specQuote 逐字取自 docs/specs/snake-advanced.spec.md 各条款「规则：」句（盘面复制，不凭记忆）。
export const RULES: RuleMeta[] = [
  {
    id: "board",
    title: "棋盘与传送门",
    specClause: "S1",
    specQuote:
      "规则：棋盘为 20×20 网格，坐标 (x,y) 以 x 向右、y 向下、原点在左上角；固定一对传送门 A(2,2) 与 B(17,17)。",
    assertionRef: { file: "src/lib/board.test.ts", test: "board > fixes the 20x20 grid and portal pair" },
    uiHint: "20×20 网格 · 传送门 A(2,2)/B(17,17)",
    triggerable: false,
  },
  {
    id: "movement",
    title: "移动与反向忽略",
    specClause: "S2",
    specQuote:
      "规则：每 tick 蛇头按当前方向前进一格，蛇身沿头的历史轨迹跟随；反向（180°）输入被忽略，掉头不可能发生。",
    assertionRef: { file: "src/lib/engine.test.ts", test: "engine tick > ignores reverse direction input" },
    uiHint: "反向输入无效",
    triggerable: false,
  },
  {
    id: "wall-death",
    title: "撞墙终局",
    specClause: "S3",
    specQuote: "规则：蛇头越出棋盘边界即终局，死因记 wall。",
    assertionRef: { file: "src/lib/engine.test.ts", test: "engine tick > reports wall-death on out-of-bounds head" },
    uiHint: "出界即终局",
    triggerable: true,
  },
  {
    id: "self-bite",
    title: "咬身终局",
    specClause: "S4",
    specQuote:
      "规则：蛇头落在蛇身格即终局，死因记 self；本 tick 不进食时尾尖格先行腾出，蛇头可安全进入原尾尖格。",
    assertionRef: {
      file: "src/lib/engine.test.ts",
      test: "engine tick > reports self-bite and lets the tail clear first",
    },
    uiHint: "撞到蛇身即终局",
    triggerable: true,
  },
  {
    id: "eat-food",
    title: "进食成长得分",
    specClause: "S5",
    specQuote: "规则：场上恒有一个普通食；吃到即加长一节并得 1 分，下一个食由种子随机在空格重生。",
    assertionRef: { file: "src/lib/engine.test.ts", test: "engine tick > reports eat-food with growth and score" },
    uiHint: "普通食 +1 分并加长",
    triggerable: true,
  },
  {
    id: "gold-food",
    title: "黄金食限时加速",
    specClause: "S6",
    specQuote:
      "规则：每吃满 3 个普通食生成一个黄金食，存在 40 tick；吃到得 5 分并进入 3 tick 加速，超时则无声消失。",
    assertionRef: {
      file: "src/lib/engine.test.ts",
      test: "engine tick > spawns and consumes gold-food with ttl and rush",
    },
    uiHint: "黄金食 +5 分 · 限时加速",
    triggerable: true,
  },
  {
    id: "portal-jump",
    title: "传送门跳跃",
    specClause: "S7",
    specQuote: "规则：蛇头进 A 即从 B 出（反之亦然），蛇身自然跟随；落点若撞身按咬身死处理。",
    assertionRef: { file: "src/lib/engine.test.ts", test: "engine tick > maps portal-jump across the fixed pair" },
    uiHint: "A 进 B 出",
    triggerable: true,
  },
  {
    id: "speed-step",
    title: "速度递增",
    specClause: "S8",
    specQuote: "规则：基础 tick 间隔 160ms，每得 5 分乘 0.85 降一档，下限 80ms；黄金食加速期间再乘 0.6。",
    assertionRef: { file: "src/lib/engine.test.ts", test: "engine tick > steps speed at every 5 points with 0.85" },
    uiHint: "每 5 分提速一档",
    triggerable: true,
  },
  {
    id: "best-score",
    title: "终局与最高分",
    specClause: "S9",
    specQuote:
      "规则：死亡即进终局屏显示本局分数与死因；最高分持久化在 localStorage 键 hstarter.snake.best，读取带类型守卫，存储不可用时降级内存。",
    assertionRef: { file: "src/lib/scorebook.test.ts", test: "scorebook > guards corrupted best and degrades to memory" },
    uiHint: "最高分持久化 · 存储不可用降级内存",
    triggerable: true,
  },
  {
    id: "determinism",
    title: "种子确定性",
    specClause: "S10",
    specQuote: "规则：同种子加同输入序列必得同终局，食物位置全部由种子派生。",
    assertionRef: { file: "src/lib/engine.test.ts", test: "engine tick > is deterministic for same seed and input" },
    uiHint: "同种子同输入必同终局",
    triggerable: false,
  },
];

/**
 * 静态扫描测试文件文本，重建 describe/it 断言链，与请求链整链精确比对（大小写敏感）。
 *
 * 嵌套深度以 describe 开/闭括号计数近似：遇 `describe("X"` 压栈（记录当时花括号深度），
 * 每行按花括号增减累计深度，深度回落到该 describe 开启时的深度即视为其闭合、弹栈。
 * 本仓测试文件约定单层 describe；单行连写的 `describe(... => { it(... => {}); })` 亦能
 * 正确成链（describe 先压栈，同一行的 it 立即引用）。花括号计数为朴素计数，不解析字符串
 * 字面量——本仓测试串不含不平衡花括号，约定内安全。
 */
export function resolveAssertionChain(fileText: string, chain: string): boolean {
  const describeRe = /describe\(\s*["']([^"']+)["']/;
  const itRe = /\b(?:it|test)\(\s*["']([^"']+)["']/;

  const stack: { name: string; openDepth: number }[] = [];
  const chains: string[] = [];
  let depth = 0;

  for (const line of fileText.split(/\r?\n/)) {
    const d = line.match(describeRe);
    if (d) stack.push({ name: d[1], openDepth: depth });

    const t = line.match(itRe);
    if (t && stack.length > 0) {
      chains.push([...stack.map((s) => s.name), t[1]].join(" > "));
    }

    for (const ch of line) {
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
    }
    while (stack.length > 0 && stack[stack.length - 1].openDepth >= depth) {
      stack.pop();
    }
  }

  return chains.includes(chain);
}
