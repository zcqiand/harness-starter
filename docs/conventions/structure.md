# 目录结构与章节绑定

> 树是文件系统的复写，以仓库实际为准；模块职责与章节绑定在此维护。

```text
harness-starter/
├── AGENTS.md                       ← ch5.5 根目录规约模板（本仓自身即示范品）
├── CLAUDE.md                       ← 工程约定入口
├── version-lock.json               ← 版本钉死 SSOT（ch4「版本按 version-lock」）
├── scripts/                        ← ch4 工具链脚本区
│   ├── doctor.mjs                  ← 工具链体检：Node/Python/Godot 三件可运行检查
│   ├── backup.mjs                  ← git 源码备份（随 ch4 章节落）
│   └── switch.mjs                  ← 多项目快速切换（随 ch4 章节落）
├── lab/                            ← ch5 双臂对比实验载体（纯提示词臂 VS Harness 臂）
│   └── （随 ch5 章节落，建仓期不放占位）
├── src/                            ← ch6 第一个可验证项目（React 19 + Tailwind 4 + TS）
│   ├── main.tsx                    ← 挂载入口
│   ├── App.tsx                     ← 页面壳：贪吃蛇进阶页面（逻辑随章节灌）
│   ├── index.css                   ← Tailwind 4 入口（@import "tailwindcss"）
│   └── lib/
│       ├── board.ts                ← 纯逻辑模块区（骨架含 board 尺寸/空板派生）
│       └── board.test.ts           ← vitest 断言（TDD 先行示范）
├── docs/conventions/               ← structure / tagging
└── _work/                          ← 过程件（gitignore）
```

## 章节绑定表

| 章节 | 落点 | 交付物 |
|---|---|---|
| ch4 环境搭建 | `scripts/` | 工具链体检回执 / git 备份脚本 / 多项目切换脚本 |
| ch5 Harness 入门 | `lab/` + `AGENTS.md` | 双臂对比实验记录 + 根目录规约模板 |
| ch6 第一个可验证项目 | `src/` | 贪吃蛇进阶页面（契约+断言+证据全闭环） |
