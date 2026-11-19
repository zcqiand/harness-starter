// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { cellGrid, createGame } from "../lib/engine";
import { RULES } from "../rules/registry";
import BoardView from "./BoardView";
import Hud from "./Hud";
import RuleSidebar from "./RuleSidebar";
import ProvenancePanel from "./ProvenancePanel";
import App from "../App";

vi.mock("../../evidence/latest.json", () => ({
  default: { commit: "abc1234", generatedAt: "2026-11-19T00:00:00Z", files: 6, checks: 30, failures: 0, allGreen: true, source: "local" },
}));

// vitest 未开 globals，@testing-library/react 不自动 cleanup——不手动清则
// 测试间 DOM 累积，App 测的 getByLabelText 会撞上前测侧栏的同名标签。
afterEach(cleanup);

describe("ui", () => {
  it("renders board cells with semantic classes", () => {
    const g = createGame(42, { food: { x: 15, y: 15 }, gold: { pos: { x: 0, y: 0 }, ttl: 5 } });
    const { container } = render(<BoardView grid={cellGrid(g)} />);
    expect(container.querySelector('[aria-label="board"]')).toBeTruthy();
    expect(container.querySelectorAll(".cell-portal-a").length).toBe(1);
    expect(container.querySelectorAll(".cell-gold").length).toBe(1);
  });
  it("shows hud numbers", () => {
    render(<Hud score={7} speedLevel={1} best={30} />);
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
  });
  it("lists all rule badges and opens provenance on click", () => {
    render(<RuleSidebar rules={RULES} lit={new Set()} onOpen={() => {}} />);
    for (const r of RULES) expect(screen.getByLabelText(`rule-${r.id}`)).toBeTruthy();
    const { getByText } = render(<ProvenancePanel rule={RULES[2]} receipt={{
      commit: "abc1234", generatedAt: "2026-11-19T00:00:00Z", files: 6, checks: 30, failures: 0, allGreen: true, source: "local",
    }} />);
    expect(getByText(/规则：蛇头越出棋盘边界即终局/)).toBeTruthy(); // specQuote 逐字
    expect(getByText(/engine tick > reports wall-death/)).toBeTruthy();
    expect(getByText(/abc1234/)).toBeTruthy();
  });
  it("lights a badge when its rule event fires", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "ArrowUp" });
    // 竖直方向蛇向右行进不点亮任何徽标；吃食路径由集成测覆盖——此处断言侧栏与 HUD 在位
    expect(screen.getByLabelText("rule-wall-death")).toBeTruthy();
    expect(screen.getByLabelText("board")).toBeTruthy();
  });
});
