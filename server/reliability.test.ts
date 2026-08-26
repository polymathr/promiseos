import { describe, expect, it } from "vitest";
import { calculatePrivateReliabilityScore } from "./reliability";

describe("calculatePrivateReliabilityScore", () => {
  it("returns no score until the user has private reliability evidence", () => {
    expect(calculatePrivateReliabilityScore({ completed: 0, acknowledged: 0, renegotiated: 0, blocked: 0, disputed: 0 })).toMatchObject({ score: null, evidenceCount: 0 });
  });

  it("rewards completion while visibly accounting for disputed commitments", () => {
    const result = calculatePrivateReliabilityScore({ completed: 4, acknowledged: 1, renegotiated: 1, blocked: 0, disputed: 2 });
    expect(result).toMatchObject({ score: 72, evidenceCount: 8, label: "Steady follow-through" });
  });
});
