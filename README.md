# harness-starter

书《Harness 工程：Codex 智能游戏开发入门》（xr-know-022）配套仓——读者第一块 Harness 实验田。

| 字段 | 值 |
|---|---|
| 绑定章节 | ch4 环境搭建 / ch5 Harness 入门 / ch6 第一个可验证项目 |
| 技术栈 | TypeScript + React 19 + Tailwind 4 + Vite；ch4 侧 Shell/Node 脚本 |
| 测试 | vitest（无 Key 无网全绿） |
| 状态 | 骨架（2026-11-18 建仓；游戏逻辑随书稿章节逐批灌入） |

## 快速开始

```bash
npm install --registry=https://registry.npmmirror.com
npm run dev      # 本地起页
npm run build    # tsc strict + vite 构建门
npm test         # vitest 断言门
node scripts/doctor.mjs   # 工具链体检：Node / Python / Godot
```

## 目录速览

- `scripts/` —— ch4 工具链脚本（体检 / 备份 / 项目切换）
- `lab/` —— ch5 双臂对比实验载体（随 ch5 章节落）
- `src/` —— ch6 可验证项目（贪吃蛇进阶页面骨架已立，逻辑随章节灌）

工程纪律见 [CLAUDE.md](CLAUDE.md)。
