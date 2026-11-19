// @vitest-environment node
import { describe, it, expect } from "vitest";
import { ASSERTIONS, type CandidateModule } from "./judge.assertions";
import { judge as goodJudge } from "../candidates/good/judge";
import { judge as missesDrawJudge } from "../candidates/bad-misses-draw/judge";
import { judge as twoWinnersJudge } from "../candidates/bad-allows-two-winners/judge";

function collectFailedNames(candidate: CandidateModule): string[] {
  const failed: string[] = [];
  for (const assertion of ASSERTIONS) {
    try {
      assertion.run(candidate);
    } catch (error) {
      failed.push((error as Error).message);
    }
  }
  return failed;
}

describe("judge assertion set", () => {
  it("has at least 10 assertions with unique names", () => {
    expect(ASSERTIONS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ASSERTIONS.map((a) => a.name)).size).toBe(ASSERTIONS.length);
  });

  it("good candidate passes the full assertion set with zero failures", () => {
    expect(collectFailedNames({ judge: goodJudge })).toEqual([]);
  });

  it("bad-misses-draw fails exactly the draw assertion", () => {
    const failed = collectFailedNames({ judge: missesDrawJudge });
    expect(failed).toContain("draw");
    expect(failed).toEqual(["draw"]);
  });

  it("bad-allows-two-winners fails exactly the double-winner assertion", () => {
    const failed = collectFailedNames({ judge: twoWinnersJudge });
    expect(failed).toContain("double-winner");
    expect(failed).toEqual(["double-winner"]);
  });
});
