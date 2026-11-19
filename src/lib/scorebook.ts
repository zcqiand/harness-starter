// S9: 最高分持久化（localStorage）+ 类型守卫 + 内存降级
const BEST_KEY = "hstarter.snake.best";

// 模块级内存假件：localStorage 不可用时兜底，同会话读写一致
let memoryBest = 0;

export function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (raw === null) return memoryBest;
    const value = Number(raw);
    // 存储值非有限数字 ⇒ 损坏，按 0 处理
    return Number.isFinite(value) ? value : 0;
  } catch {
    // localStorage 读取抛异常 ⇒ 内存假件兜底
    return memoryBest;
  }
}

export function saveBest(score: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // 写入失败（配额/隐私模式等）⇒ 内存假件兜底；
    // 同时清掉可能损坏的旧条目，让后续 loadBest 走内存路径
    memoryBest = score;
    try {
      localStorage.removeItem(BEST_KEY);
    } catch {
      // 清理失败也无妨：下次读取损坏值仍按 0 守卫
    }
  }
}
