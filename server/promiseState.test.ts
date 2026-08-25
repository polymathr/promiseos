import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { nextPromiseState } from "./promiseState";

describe("PromiseOS state machine", () => {
  it("permits every legal commitment path", () => {
    expect(nextPromiseState("active", "at_risk")).toBe("at_risk");
    expect(nextPromiseState("at_risk", "marked_complete")).toBe("complete");
    expect(nextPromiseState("complete", "acknowledged")).toBe("acknowledged");
    expect(nextPromiseState("acknowledged", "archived")).toBe("archived");
  });

  it("rejects every illegal state-changing path with CONFLICT", () => {
    const actions = ["at_risk", "blocked", "renegotiation_proposed", "renegotiation_accepted", "marked_complete", "declined", "disputed", "acknowledged", "archived"] as const;
    const legal: Record<string, string[]> = {
      active: ["at_risk", "blocked", "renegotiation_proposed"],
      at_risk: ["renegotiation_accepted", "marked_complete", "declined", "disputed"],
      blocked: ["renegotiation_accepted", "marked_complete", "declined", "disputed"],
      renegotiation_proposed: ["renegotiation_accepted", "marked_complete", "declined", "disputed"],
      renegotiated: ["acknowledged"],
      complete: ["acknowledged"],
      declined: ["acknowledged"],
      disputed: ["acknowledged"],
      acknowledged: ["archived"],
      proposed: [],
      archived: [],
    };
    Object.entries(legal).forEach(([state, permitted]) => actions.filter(action => !permitted.includes(action)).forEach(action => {
      expect(() => nextPromiseState(state as Parameters<typeof nextPromiseState>[0], action)).toThrowError(TRPCError);
      try { nextPromiseState(state as Parameters<typeof nextPromiseState>[0], action); } catch (error) { expect((error as TRPCError).code).toBe("CONFLICT"); }
    }));
    expect(() => nextPromiseState("archived", "progress_added")).toThrowError(TRPCError);
  });
});
