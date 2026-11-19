# ch5 双臂实验报告——纯提示词臂 VS Harness 规约+断言臂

> 评分器：`lab/run/score.mjs`；断言集：`lab/assertions/judge.assertions.ts`（J1-J7 的机器可跑形态）。
> 数据文件：`lab/run/report.json`（一行一候选一次评分）。

**示意声明：下表为 fixture 演示行，非实测——真实锚点实验随书稿 ch5 批跑。**
表中候选是三个手工 fixture（`lab/candidates/`），用于验证评分器装置本身工作正常；
「双臂对比」的真实数据要等书稿 ch5 批次用真实产出的候选跑完才有。

## 双臂数据表

| 臂 | 轮次 | 候选 | 检查 | 失败 | 判定 |
|---|---|---|---|---|---|
| prompt | 1 | good | 13 | 0 | pass |
| spec | 2 | bad-misses-draw | 13 | 1（draw） | fail |
| prompt | 3 | bad-allows-two-winners | 13 | 1（double-winner） | fail |

- **good**：全过。规约+断言臂的理想产出形态——13 条断言无一失败。
- **bad-misses-draw**：恰挂 `draw` 一条。规约缺 J7 的和棋分支，断言集指名道姓报出缺口。
- **bad-allows-two-winners**：恰挂 `double-winner` 一条。不查双胜的候选被 J5 断言精确击中——
  它对正常胜局照常判胜，只有摆出双方同时连线的棋盘才暴露（评分器无需知道盘面细节，断言自己会摆）。

## 读者复跑说明

```bash
node lab/run/score.mjs lab/candidates/good --arm prompt --round 1
node lab/run/score.mjs lab/candidates/bad-misses-draw --arm spec --round 2
```

评分结果追加进 `lab/run/report.json`（无则建）；想要干净的数据文件先删掉它再跑。
评分面恒 exit 0——judge 缺失或非函数会产出 `verdict:"error"` 的数据行而不是崩溃。

## 结论框架（随书稿 ch5 批次填充）

- **对比口径**：同一断言集（13 条，覆盖 J1-J7 全条款）评两臂各自产出的 judge 候选，
  比较 checksFailed 与 failedNames 的分布。
- **预期信号**：纯提示词臂的失败应呈「散点」——不同轮次挂在不同条款上、且难以一次修干净；
  规约+断言臂的失败应呈「钉子」——挂点直接对应规约缺口（如本表 fixture 演示的恰挂单条形状），
  补一条规约条款即收敛一条失败。
- **判定规则（待批次数据校准）**：若规约+断言臂在真实候选上的失败数与修复轮次显著低于
  纯提示词臂，则 harness 的价值在该实验中被量化成立；否则如实报告差异不显著，并分析
  是任务太简单（judge 太小）还是断言集不够尖。
