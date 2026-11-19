# harness-starter 设计文档：规则可溯源

> 书三 ch4-6 配套（xr-know-022），读者第一块 Harness 实验田。React 系仓（非 Godot）。
> 日期：2026-11-19

## 意图与为什么

本仓与书稿前三章绑定：ch4 环境搭建、ch5 Harness 入门（双臂对比实验=全书锚点实验）、ch6 第一个可验证项目。前五仓（2048/snake/maze/jumper/cardbattle）各突出一个**运行时完整性**机制；本仓是教学田，突出点换成**开发期证据进产品**——「规则可溯源」：

- 贪吃蛇进阶页面上，**每条游戏规则带徽标**；点开即见三件套：规约条款原文（逐字）、钉住它的断言（文件+测试名+一句话锚什么）、最近一次证据回执（测试运行回执 JSON）。
- 玩着玩着规则触发时（吃食/过门/撞墙死），对应徽标同步亮起——**溯源看得见，不只查得到**。你死在墙上，「撞墙死」徽标亮起，点开就是钉住它的那条断言。
- 溯源注册表**双向自审**：每条规则的规约引文必须逐字命中仓内规约文档、断言锚必须解析到真实存在的测试；规约每个条款必须被 ≥1 条规则引用。断链=审计红——注册表本身就是被规约+断言管住的第一个对象，突出点自证。

与前五仓的谱系：2048=种子重放、snake=快照捕获、maze=走线认证、jumper=物理契约、cardbattle=数字对账，starter=**每条规则可溯源**（开发期证据链在产品里可查）。书稿 ch6 的「需求→规约→生成→断言→证据全闭环」从纸面流程变成玩家可摸的 UI；ch6 练习「换主题重走闭环」时溯源面板原样复用。

## 目标

1. **ch6 蛇页面完整可玩**：经典蛇 + 两个进阶元素（黄金食/传送门），HUD（分数/速度/最高分）+ 规则徽标侧栏 + 溯源面板，规则触发徽标点亮。
2. **规约文件为真源**：`docs/specs/snake-advanced.spec.md` 条款编号 S1..Sn；注册表引文逐字命中；双向覆盖自审断言全绿。
3. **证据回执闭环**：`npm run evidence`（vitest 自定义 reporter）产出 `evidence/latest.json`（commit/时间/套件/检查数/失败数）入档；页面读它渲染「最近一次全绿回执」；CI 在 build 前跑 evidence，部署页携带 CI 回执。
4. **ch5 双臂实验装置可复跑**：`lab/` 内任务规约 + AGENTS.md 规约模板（章交付物二）+ 黑盒断言集 + 评分器 `node lab/run/score.mjs <candidate-dir>` + 双臂报告（report.json 数据行 + report.md 模板含示例实测数据）；含好/坏 fixture 候选，评分器判定可被断言测试钉住。
5. **ch4 工具链脚本齐**：doctor.mjs（已有）之外补 `backup.mjs`（git bundle 备份）、`switch.mjs`（多项目快速切换，项目清单 JSON）、`mcp-check.mjs`（MCP 配置连通检查）；各自带 vitest 测试。
6. `npm run build`（tsc strict + vite）与 `npm test`（vitest 无 Key 无网全绿）双门绿；headless 可跑。

## 非目标

- 多关卡、皮肤、音效、动效演出——可玩+有趣即可，重心在溯源 UI。
- 移动端深度适配（布局不碎、可玩即可，触屏虚拟方向键不做精细手感）。
- ch7+ 的边界契约/悔棋/回放系统（那是 harness-2048/harness-snake 的机制，本仓蛇的确定性只为测试可断言，不做回放功能）。
- 双臂实验的自动化生成（装置只评测候选代码目录，跑轮次生成候选是读者/书稿侧动作）。
- 联网、账号、云存档。

## 反目标（出现即失败）

- 注册表里任何规约引文与规约文档对不上（手打「大概是这样」的引文=假溯源）。
- 任何规则徽标没有真实存在的断言锚（指向不存在的测试=假证据）。
- 证据回执手工编写——`evidence/latest.json` 只能由 reporter 产出，手工改数字=伪造证据链。
- 规约文档存在未被任何规则引用的孤儿条款（覆盖率单向断言缺失=自审失效）。
- `lab/` 件混入 `src/` 正式区（仓铁律：实验件隔离）。

## 约束

- TypeScript strict + React 19 + Tailwind 4 + Vite 6.3；依赖钉 `version-lock.json`，不引 lock 外库；npm 一律 `registry.npmmirror.com`。
- **@types/node ^24 第一天就得带**（vitest d.ts 链要 Node 类型）；**package.json 预置 `overrides: { rollup: "4.68.5" }`**（musl 原生解析器回归坑，snake/maze 先例——CI alpine 构建独红）；首推前 `npm install` 重同步 lock。
- 游戏逻辑纯函数化（`tick(state, input) -> state`），食位置走种子派生 RNG（mulberry32 手写，2048 先例）；确定性只服务测试可断言。
- 最高分落 localStorage，读侧条目级类型 guard（jumper T8 同款；不可用环境白名单降级内存假件，snake 先例）。
- 测试 vitest，无 Key 无网全绿；node 脚本（scripts/lab 件）同样 vitest 覆盖。
- 正式区/临时区：过程件进 `_work/`（整目录 gitignore）。
- **部署照 2048/snake/maze React 五件套**（frontend Dockerfile / ci.yml / deploy 脚本 / nginx-vhost example / GitHub Secrets 5 件无 LLM_API_KEY）；nginx 用 **React 形状缓存**（`/assets/` 哈希文件名 immutable + `/` no-cache——与 Godot 仓的纯 no-cache 形状区分，勿抄混）；端口 **5312**，域名 `https://hstarter.xiangru.uk`；CI test job 先 `npm run evidence` 再 build，回执随部署进包。
- commit 尾注逐字 `Co-Authored-By: Claude Code <noreply@anthropic.com>`；禁止 git add -A（逐文件 add）。
- Tag 规约 `v<MAJOR>.<MINOR>.<PATCH>-<YYYYMMDD>`，禁删/覆盖，禁 `git push --tags`；首推顺序=先合并进主分支再推 tag（cardbattle 指纹）。

## 方案比较（已裁定）

- **A. 规则可溯源（选定）**：突出点=开发期证据进产品。吃满 ch5/ch6 论点（规约/断言/证据三件套），换主题重走闭环（ch6 练习）时面板复用，全书闭环从第一仓就可视。
- B. 双臂实验台即产品：最贴 ch5，但装置半手动、页面成配角，「游戏仓」有趣度最弱。实验装置按章节交付物随批交付（目标 4），不抢头牌。
- C. 经典+单一进阶机制打透（传送门蛇）：纯游戏路线，丢掉实验田身份，与兄弟仓拼游戏性不占优。

## 架构

### ch6 蛇页面（突出点载体）

```
docs/specs/snake-advanced.spec.md   规约真源：条款 S1..Sn（棋盘/移动/进食/黄金食/门/速度/终局/持久化）
src/rules/registry.ts               规则注册表：{id, title, specClause, specQuote, assertionRef:{file, test}, uiHint}
src/lib/
  rng.ts                            mulberry32 种子化 RNG（食/黄金食位置派生）
  board.ts（已有，扩）               20×20 棋盘 + 门位置常量
  engine.ts                         tick 纯逻辑：移动/碰撞/进食/黄金食 TTL/过门映射/速度等级
  scorebook.ts                      最高分 localStorage（读侧 guard + 内存降级）
src/ui/（components）
  board_view                        棋盘渲染（蛇身逐段/普通食/黄金食 TTL 视觉/门）
  hud                               分数/速度等级/最高分
  rule_sidebar                      规则徽标列表（触发时点亮）
  provenance_panel                  点徽标出三件套：条款原文/断言锚/证据回执
evidence/latest.json                证据回执（reporter 产出，入档）
scripts/evidence-reporter.mjs       vitest 自定义 reporter
```

**规则集 S1..Sn**（实现以规约文件为准）：撞墙死 / 咬身死 / 吃食长一节+1 分 / 黄金食（每吃 3 普通食出 1 个，TTL N tick，+5 分且加速 3 tick，过期消失）/ 传送门（固定一对，蛇头进 A 出 B，蛇身自然跟随）/ 速度递增（每 M 分 tick 间隔降一档，有下限）/ 最高分持久化。

**双向自审（突出点的结构保证）**：`src/rules/registry.test.ts` 断言——①每条规则 `specQuote` 在规约文档中逐字命中；②`assertionRef` 解析到真实测试文件+测试名（静态扫描）；③规约每个 S 条款被 ≥1 规则引用（无孤儿条款）。断链即红——改名断言没同步注册表，审计当场抓住。

**溯源面板三件套**：条款原文（S 编号+逐字引文）/ 断言（文件路径+测试名+一句话）/ 证据（latest.json：commit 前 7 位+时间+检查数+失败数，「全绿」态样式）。规则触发点亮徽标是 UI 事件直通，不新增状态机。

**确定性**：同种子+同输入序列 ⇒ 同终局（测试可断言随机面）；不做回放功能。

### ch5 双臂实验装置（lab/）

```
lab/spec/tic-tac-toe.spec.md        实验载体任务规约：井字棋胜判器 judge(board) 纯函数
lab/AGENTS-template.md              章交付物二：根目录 AGENTS.md 规约模板（全文+逐段解释注释）
lab/assertions/judge.assertions.ts  黑盒断言集：动态 import 候选目录 judge.ts，标准局+边角局（双胜非法/满盘无胜=平/非法棋子/非法形状）
lab/candidates/                     fixture 候选：1 好（全过）+ 2 坏（各挂特定断言，钉评分器行为）
lab/run/score.mjs                   评分器：跑断言集 → 追加 {arm, round, checksPassed/Failed, verdict} 到 report.json
lab/run/report.json                 双臂数据（arm=prompt|spec 各示例轮次）
lab/run/report.md                   双臂报告模板（章交付物一：实测数据表+结论框架，含示例行）
```

载体选**井字棋胜判器**：纯函数、规约可写死、边角丰富（纯提示词臂常漏双胜非法/满盘判定，规约臂条款钉死）——双臂差异在数据上可见。评分器与断言集的行为由 fixture 候选钉住（好候选全过/坏候选各挂指定断言），装置自身可测。

### ch4 工具链脚本（scripts/）

```
scripts/doctor.mjs（已有）          Node/Python/Godot 三件体检
scripts/backup.mjs                  git bundle 全量备份到配置目录（清单式，幂等文件名带日期）
scripts/switch.mjs                  多项目快速切换：projects.json 清单 → cd+（可选）启动命令
scripts/mcp-check.mjs               MCP 连通检查：配置文件存在性+server 清单回显
scripts/projects.json               项目清单（本仓+兄弟仓示意条目）
```

每个脚本 vitest 覆盖核心路径（参数缺失/清单不存在/正常路径），node 子进程级测试不依赖真实 git 远端。

### 部署五件套（React 变体，家族先例照抄）

`Dockerfile`（node:24-alpine build → nginx:alpine 静态）+ `ci.yml`（npm ci → test → evidence → build → docker push，tag 触发 deploy）+ `deploy/harness-starter.sh` + `deploy/nginx-vps.conf.example`（**React 缓存形状**）+ GitHub Secrets 5 件。端口 5312，`hstarter.xiangru.uk`。构建期预置 rollup override 防 musl 回归。

## 里程碑切分建议（给 planner 的粒度锚，非任务清单）

1. ch4 三脚本+清单+测试（小，独立可先行）。
2. 蛇核心引擎（rng/board/engine/scorebook 纯逻辑+全断言）。
3. 规约文档+注册表+双向自审断言（突出点骨架，先于 UI——UI 消费注册表）。
4. UI 面（board_view/hud/rule_sidebar/provenance_panel+触发点亮）。
5. 证据回执链（reporter+evidence 命令+CI 接线）。
6. ch5 lab 装置全套+fixture 钉评分器。
7. 部署五件套+GitHub 仓+Secrets+首航。

## builder check 裁定回填（2026-11-19，作者已裁五项）

1. **证据回执无 commit 回写**：CI 不把 latest.json 回写主分支（回写会触发循环 CI、污染 tag 流水线）。流水线=CI 内 `npm test → npm run evidence（写工作区 latest.json，不 commit）→ vite build 烘焙进产物 → docker build`；页面回执走**构建期 import 烘焙**（非运行时 fetch）。仓内 committed 的 latest.json=本地最近一次 run 的回执，允许滞后，页面显示以 CI 烘焙为准。
2. **骨架可推翻**：「只增不改」铁律保护的是已随章节发布的模块；建仓批的 App.tsx/board.ts 是未发布占位壳，本批重写合法。棋盘格子语义用单枚举 cell（`empty/snake/food/gold/portal_a/portal_b`），不做 boolean 网格+并行状态双表示。
3. **tick 携带事件**：引擎签名 `tick(state, input) -> {state, events: RuleEvent[]}`，RuleEvent 含 `ruleId`+载荷；规则 ID 常量落 `src/rules/ids.ts`，引擎与注册表共同 import 同源常量（差分推断无法可靠捕捉黄金食过期/速度降档这类非位置事件，否决）。
4. **score.mjs 跑 TS = Node 24 原生 type stripping**：断言模块设计成双用途——导出 `ASSERTIONS: {name, assert(candidate)}[]`，score.mjs 动态 import 后逐条跑候选；同一模块配薄 vitest 包装测试（对 fixture 候选跑全量）钉住评分器行为。候选为 .ts 文件。CI alpine 同为 node 24，可复现。
5. **自审②匹配口径 = 整链精确相等**：assertionRef.test 引完整 `describe > it` 标题链；registry.test.ts 静态扫描测试文件字面 `describe`/`it` 字符串重建链后精确比对。紧口径是特性（改名断言未同步注册表=审计当场红），不是缺陷。

## 遗留给 builder

- 黄金食 TTL 数值、门位置坐标、速度档位曲线——规约文档定值，plan 照抄。
- 溯源面板移动端折叠形态——UI 细节 builder 裁。
- `lab/` 示例候选的「坏」程度——挂恰好指定断言即可，不追拟真。
- report.md 示例数据行口径（2026-11-19 人裁，甲案）：本批只交付装置+示意行，数据行标注「示意，非实测」，读者自测行留空；真实锚点实验（双臂各十轮）随书稿 ch5 章稿批真跑落仓。
