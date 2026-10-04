import { describe, it, expect } from "vitest";
import { computeBasicMean, CriterionConfig, EvaluationInput } from "../src";

describe("Scoring Engine - computeBasicMean", () => {
  it("computes pure deterministic mean score without side effects", () => {
    const criteria: CriterionConfig[] = [
      { key: "innovation", type: "scale", label: "Innovation", weight: 3, min: 0, max: 10 },
      { key: "execution", type: "scale", label: "Execution", weight: 1, min: 0, max: 10 },
    ];

    const evaluations: EvaluationInput[] = [
      {
        judgeId: "j1",
        entryId: "e1",
        scores: { innovation: 10, execution: 10 },
      },
      {
        judgeId: "j2",
        entryId: "e1",
        scores: { innovation: 5, execution: 5 },
      },
    ];

    const results = computeBasicMean({ criteria, evaluations });

    expect(results).toHaveLength(1);
    expect(results[0].entryId).toBe("e1");
    expect(results[0].finalScore).toBe(75);
    expect(results[0].rank).toBe(1);
  });
});
