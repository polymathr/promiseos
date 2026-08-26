export type PersonalReliabilityCounts = {
  completed: number;
  acknowledged: number;
  renegotiated: number;
  blocked: number;
  disputed: number;
};

export function calculatePrivateReliabilityScore(counts: PersonalReliabilityCounts) {
  const evidenceCount = counts.completed + counts.acknowledged + counts.renegotiated + counts.blocked + counts.disputed;
  if (evidenceCount === 0) {
    return { score: null, evidenceCount, label: "Build a record", explanation: "Complete or update a promise to establish a private reliability baseline." };
  }
  const weightedFollowThrough = counts.completed + counts.acknowledged + counts.renegotiated * 0.75 + counts.blocked * 0.5;
  const score = Math.round((weightedFollowThrough / evidenceCount) * 100);
  const label = score >= 85 ? "Strong follow-through" : score >= 65 ? "Steady follow-through" : "Needs attention";
  return {
    score,
    evidenceCount,
    label,
    explanation: "Completed and acknowledged promises count fully; responsible renegotiations and blockers retain partial credit; disputed promises count as unresolved evidence.",
  };
}
