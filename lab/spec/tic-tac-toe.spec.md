# 井字棋裁判规约（tic-tac-toe judge）

本文件是 ch5 双臂对比实验的「规约臂」输入：纯提示词臂拿到的是同一段需求的自然语言转述，
规约+断言臂拿到的是本文加 `lab/assertions/judge.assertions.ts` 的机器可跑断言集。
两臂各自产出同一个裁判函数，由评分器按断言失败数对比两臂质量。

### J1 接口

规则：候选实现导出 `export function judge(board: unknown): unknown`。`board` 是长度恰为 9 的数组，行优先展开 3×3（下标 0-2 为第一行，3-5 第二行，6-8 第三行），每格取值 `"x"` / `"o"` / `null`（null=空格）。返回值只能是两种形状之一：`{ status: "x_win" | "o_win" | "draw" | "playing" }` 或 `{ status: "illegal", reason: string }`。入参声明为 unknown——黑盒契约下裁判函数必须自己验证输入，不得信任调用方。

### J2 非法输入

规则：`board` 不是数组、长度不为 9、或任一格取值不在 `"x"` / `"o"` / `null` 之内时，返回 `{ status: "illegal", reason: <非空说明> }`。

### J3 计数平衡

规则：x 的数量必须等于 o 的数量，或比 o 多一（x 先行落子）；否则返回 illegal（reason 非空）。

### J4 连线胜

规则：任一行、任一列、两条对角线之一被同一棋子占满，该棋子获胜，返回 `{ status: "x_win" }` 或 `{ status: "o_win" }`。

### J5 双胜

规则：x 与 o 同时存在连线时棋局非法，返回 illegal（reason 非空）。

### J6 胜者计数匹配

规则：存在胜者时计数必须与胜者匹配——x_win 要求 x 比 o 多一，o_win 要求 x 与 o 相等；不匹配返回 illegal（reason 非空）。

### J7 终态

规则：无胜者时，九格全满返回 `{ status: "draw" }`，否则返回 `{ status: "playing" }`。
