import { describe, expect, it } from "vitest";
import { buildPromiseCalendar } from "../client/src/lib/calendar";

describe("PromiseOS calendar export", () => {
  it("creates a private iCalendar event with the agreement details", () => {
    const calendar = buildPromiseCalendar({
      id: 14,
      title: "Share the proposal, v2",
      promisor: "Alex",
      recipient: "Maya",
      due: "2026-08-28",
      completion: "A private link is shared.",
      context: "Brand refresh",
    }, new Date("2026-08-26T08:00:00.000Z"));

    expect(calendar).toContain("BEGIN:VCALENDAR");
    expect(calendar).toContain("BEGIN:VEVENT");
    expect(calendar).toContain("DTSTART:20260828T120000Z");
    expect(calendar).toContain("DTEND:20260828T123000Z");
    expect(calendar).toContain("SUMMARY:Promise: Share the proposal\\, v2");
    expect(calendar).toContain("Promisor: Alex");
    expect(calendar).toContain("STATUS:CONFIRMED");
    expect(calendar).toContain("END:VCALENDAR");
  });
});
