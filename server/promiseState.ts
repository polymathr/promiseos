import { TRPCError } from "@trpc/server";

export type PromiseState =
  | "proposed"
  | "active"
  | "at_risk"
  | "blocked"
  | "renegotiation_proposed"
  | "renegotiated"
  | "complete"
  | "declined"
  | "disputed"
  | "acknowledged"
  | "archived";

export type PromiseEventAction =
  | "progress_added"
  | "at_risk"
  | "blocked"
  | "renegotiation_proposed"
  | "renegotiation_accepted"
  | "marked_complete"
  | "declined"
  | "disputed"
  | "acknowledged"
  | "archived";

const targets: Partial<Record<PromiseEventAction, PromiseState>> = {
  at_risk: "at_risk",
  blocked: "blocked",
  renegotiation_proposed: "renegotiation_proposed",
  renegotiation_accepted: "renegotiated",
  marked_complete: "complete",
  declined: "declined",
  disputed: "disputed",
  acknowledged: "acknowledged",
  archived: "archived",
};

const allowedTargets: Record<PromiseState, PromiseState[]> = {
  proposed: ["active"],
  active: ["at_risk", "blocked", "renegotiation_proposed"],
  at_risk: ["renegotiated", "complete", "declined", "disputed"],
  blocked: ["renegotiated", "complete", "declined", "disputed"],
  renegotiation_proposed: ["renegotiated", "complete", "declined", "disputed"],
  renegotiated: ["acknowledged"],
  complete: ["acknowledged"],
  declined: ["acknowledged"],
  disputed: ["acknowledged"],
  acknowledged: ["archived"],
  archived: [],
};

export function nextPromiseState(current: PromiseState, action: PromiseEventAction) {
  if (action === "progress_added") {
    if (current === "archived") throw new TRPCError({ code: "CONFLICT", message: "Archived promises cannot be changed." });
    return undefined;
  }
  const target = targets[action];
  if (!target || !allowedTargets[current].includes(target)) {
    throw new TRPCError({ code: "CONFLICT", message: `The ${action.replaceAll("_", " ")} event is not valid while this promise is ${current.replaceAll("_", " ")}.` });
  }
  return target;
}
