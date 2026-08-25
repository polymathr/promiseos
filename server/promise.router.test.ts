import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  addPromiseEventForUser: vi.fn(),
  createPromiseForUser: vi.fn(),
  getPromiseDetailForUser: vi.fn(),
  getReliabilitySummaryForUser: vi.fn(),
  getReminderPreferencesForUser: vi.fn(),
  listPromisesForUser: vi.fn(),
  respondToPromiseInvitation: vi.fn(),
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
    res: {} as TrpcContext["res"],
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

  it("keeps reliability history private to the authenticated relationship query", async () => {
    dbMocks.getReliabilitySummaryForUser.mockResolvedValueOnce({ completed: 3, renegotiated: 1, blocked: 0, open: 2, acknowledged: 1 });
    const caller = appRouter.createCaller(context());

    const result = await caller.promise.reliability({ otherUserId: 17 });

    expect(dbMocks.getReliabilitySummaryForUser).toHaveBeenCalledWith(42, 17);
    expect(result).toEqual({ completed: 3, renegotiated: 1, blocked: 0, open: 2, acknowledged: 1 });
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
});
