// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadBest, saveBest } from "./scorebook";

describe("scorebook", () => {
  beforeEach(() => localStorage.clear());
  it("persists and loads the best score", () => {
    saveBest(42);
    expect(loadBest()).toBe(42);
  });
  it("guards corrupted best and degrades to memory", () => {
    localStorage.setItem("hstarter.snake.best", "not-a-number");
    expect(loadBest()).toBe(0);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    saveBest(7);
    expect(loadBest()).toBe(7); // 内存假件兜底
    spy.mockRestore();
  });
});
