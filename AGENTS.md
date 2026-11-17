# AGENTS.md — 根目录规约（ch5.5 模板示范品）

本仓自身就是书 ch5.5「根目录 AGENTS.md 规约模板」的示范品。给任何编码 Agent 的约束：

## 任务边界

- 只改与本仓约定一致的内容；跨仓改动必须停下问人
- 业务逻辑只进 `src/`（正式）或 `lab/`（实验），脚本只进 `scripts/`

## 验收断言（改完必须全绿才算完成）

```bash
npm run build   # tsc strict + vite 构建
npm test        # vitest 断言
```

## 禁止

- 引入 `version-lock.json` 之外的依赖
- `TODO`/`pass`/`...` 占位代码
- 绕过断言直接交付（「能跑」不等于「验过」）
