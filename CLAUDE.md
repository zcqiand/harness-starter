# harness-starter — 仓库工作约定（供 Claude Code）

本仓为书《Harness 工程：Codex 智能游戏开发入门》（xr-know-022）配套仓，
是书稿代码块的 **source of truth**。绑定章节：ch4（环境搭建）、ch5（Harness 入门）、ch6（第一个可验证项目）。

## 项目定位

零基础读者的第一个 Harness 实验田：

- `scripts/` —— ch4 工具链脚本（环境体检 / git 源码备份 / 多项目快速切换）
- `lab/` —— ch5 双臂对比实验载体（纯提示词臂 VS Harness 规约+断言臂）
- `src/` —— ch6 第一个可验证项目：贪吃蛇进阶页面（规则契约+断言+证据全闭环），React 19 + Tailwind 4 + TS + Vite

## 铁律

- **版本钉死**：依赖与 `version-lock.json` 的 `version_lock` 一致；不引入 lock 外的库；npm 一律走 `registry.npmmirror.com`
- **TDD**：`src/` 下游戏逻辑先写失败测试 → 确认失败 → 实现 → 确认绿 → commit；`npm test` 无 Key、无网全绿
- **只增不改**：随书章节扩仓时不动现有模块签名/行为；新模块独立测试
- **零伪代码**：禁止 `pass`/`TODO`/`...` 占位，每段代码必须可运行
- **实验件隔离**：ch4/ch5 的 lab 件只进 `lab/` 与 `_work/`，不混入 `src/` 正式区

## 验收

```bash
npm install --registry=https://registry.npmmirror.com   # 离线锁版本
npm run build    # tsc strict + vite 构建门
npm test         # vitest 断言门
node scripts/doctor.mjs   # ch4 工具链体检（Node/Python/Godot 三件）
```

## 正式区 / 临时区（2026-10-24 人定，全产品线通用）

- 过程件（实验记录、批次卡、调试日志、证据快照）进 `_work/`，不与正式件混放
- 正式区同名正式件有且仅有一个（不堆 v2/final 副本）
- `_work/` 整目录 .gitignore（2026-10-27 人裁），可追溯由本地盘承担

## 细则（docs/conventions/，按需引用）

- 目录结构与章节绑定 → `docs/conventions/structure.md`
- Tag 规约：Release 格式 `v<MAJOR>.<MINOR>.<PATCH>-<YYYYMMDD>`，禁止删/覆盖，禁止 `git push --tags` → `docs/conventions/tagging.md`
