import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  addPromiseEventForUser: vi.fn(),
  createPromiseForUser: vi.fn(),
  deleteAccountForUser: vi.fn(),
  exportPromisesForUser: vi.fn(),
  getGuestInvite: vi.fn(),
  getPromiseDetailForUser: vi.fn(),
  getRelationshipSummariesForUser: vi.fn(),
  getReliabilitySummaryForUser: vi.fn(),
  getReminderPreferencesForUser: vi.fn(),
  listPromisesForUser: vi.fn(),
  respondToPromiseInvitation: vi.fn(),
  respondToGuestInvite: vi.fn(),
  updateReminderPreferencesForUser: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function context(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "promise-user",
      name: "Promise User",
      email: "promise@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
    } as TrpcContext["res"],
  };
}

describe("PromiseOS protected procedures", () => {
  it("creates a shared promise with the authenticated user as creator", async () => {
    dbMocks.createPromiseForUser.mockResolvedValueOnce(88);
    const caller = appRouter.createCaller(context());

    const result = await caller.promise.create({
      title: "Send the agreed outline",
      recipientEmail: "maya@example.com",
      completionCondition: "The outline link is shared.",
    });

    expect(result).toEqual({ promiseId: 88 });
    expect(dbMocks.createPromiseForUser).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      title: "Send the agreed outline",
      recipientEmail: "maya@example.com",
    }));
  });

  it("routes an invitation response through the authenticated recipient", async () => {
    dbMocks.respondToPromiseInvitation.mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(context());

    await caller.promise.respond({ promiseId: 13, response: "counterproposed", detail: "Friday afternoon works." });

    expect(dbMocks.respondToPromiseInvitation).toHaveBeenCalledWith({
      promiseId: 13,
      response: "counterproposed",
      detail: "Friday afternoon works.",
      userId: 42,
    });
  });

  it("returns the authenticated user's live promise detail with participant identity fields", async () => {
    dbMocks.getPromiseDetailForUser.mockResolvedValueOnce({
      promise: { id: 13, title: "Share access" },
      participants: [{ id: 1, name: "Maya", email: "maya@example.com", role: "recipient", confirmationStatus: "pending" }],
      events: [],
      amendments: [],
    });
    const caller = appRouter.createCaller(context());

    const result = await caller.promise.get({ promiseId: 13 });
    expect(dbMocks.getPromiseDetailForUser).toHaveBeenCalledWith(13, 42);
    expect(result.participants[0]).toMatchObject({ name: "Maya", confirmationStatus: "pending" });
  });

  it("keeps reliability history private to the authenticated relationship query", async () => {
    dbMocks.getReliabilitySummaryForUser.mockResolvedValueOnce({ completed: 3, renegotiated: 1, blocked: 0, open: 2, acknowledged: 1 });
    const caller = appRouter.createCaller(context());

    const result = await caller.promise.reliability({ otherUserId: 17 });

    expect(dbMocks.getReliabilitySummaryForUser).toHaveBeenCalledWith(42, 17);
    expect(result).toEqual({ completed: 3, renegotiated: 1, blocked: 0, open: 2, acknowledged: 1 });
  });

  it("returns private relationship groups only for the authenticated user", async () => {
    const summary = [{ label: "maya@example.com", open: 1, completed: 2, renegotiated: 0, blocked: 0, acknowledged: 1 }];
    dbMocks.getRelationshipSummariesForUser.mockResolvedValueOnce(summary);
    const caller = appRouter.createCaller(context());

    await expect(caller.promise.relationships()).resolves.toEqual(summary);
    expect(dbMocks.getRelationshipSummariesForUser).toHaveBeenCalledWith(42);
  });

  it("updates only the calling user's reminder preferences", async () => {
    dbMocks.updateReminderPreferencesForUser.mockResolvedValueOnce({ browserNotifications: true });
    const caller = appRouter.createCaller(context());

    await caller.promise.updateReminderPreferences({ browserNotifications: true, dueDateReminders: false });

    expect(dbMocks.updateReminderPreferencesForUser).toHaveBeenCalledWith(42, {
      browserNotifications: true,
      dueDateReminders: false,
    });
  });

  it("exports only the authenticated user's private promise data", async () => {
    dbMocks.exportPromisesForUser.mockResolvedValueOnce([{ promise: { id: 9 }, events: [] }]);
    const caller = appRouter.createCaller(context());

    await expect(caller.promise.export()).resolves.toEqual([{ promise: { id: 9 }, events: [] }]);
    expect(dbMocks.exportPromisesForUser).toHaveBeenCalledWith(42);
  });

  it("loads and records a valid guest invitation without requiring an account", async () => {
    dbMocks.getGuestInvite.mockResolvedValueOnce({ participant: { confirmationStatus: "pending" }, promise: { id: 77, title: "Share access" } });
    dbMocks.respondToGuestInvite.mockResolvedValueOnce({ promiseId: 77, status: "active" });
    const caller = appRouter.createCaller(context());

    await expect(caller.promise.guestPreview({ token: "valid-guest-invitation-token-123" })).resolves.toEqual({ promise: { id: 77, title: "Share access" }, confirmationStatus: "pending" });
    await expect(caller.promise.guestRespond({ token: "valid-guest-invitation-token-123", response: "accepted" })).resolves.toEqual({ promiseId: 77, status: "active" });
    expect(dbMocks.respondToGuestInvite).toHaveBeenCalledWith({ token: "valid-guest-invitation-token-123", response: "accepted" });
  });

  it("passes the authenticated account to the privacy deletion procedure", async () => {
    dbMocks.deleteAccountForUser.mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(context());

    await expect(caller.account.delete()).resolves.toEqual({ success: true });
    expect(dbMocks.deleteAccountForUser).toHaveBeenCalledWith(42);
  });
});
