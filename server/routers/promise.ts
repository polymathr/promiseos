import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addPromiseEventForUser,
  createPromiseForUser,
  exportPromisesForUser,
  getGuestInvite,
  getRelationshipSummariesForUser,
  getPromiseDetailForUser,
  getReliabilitySummaryForUser,
  getReminderPreferencesForUser,
  listPromisesForUser,
  respondToPromiseInvitation,
  respondToGuestInvite,
  updateReminderPreferencesForUser,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const promiseId = z.object({ promiseId: z.number().int().positive() });

export const promiseRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => listPromisesForUser(ctx.user.id)),
  get: protectedProcedure.input(promiseId).query(async ({ ctx, input }) => {
    const detail = await getPromiseDetailForUser(input.promiseId, ctx.user.id);
    if (!detail) throw new TRPCError({ code: "NOT_FOUND", message: "Promise not found" });
    return detail;
  }),
  create: protectedProcedure.input(z.object({
    title: z.string().trim().min(3).max(280),
    dueAt: z.date().optional(),
    completionCondition: z.string().trim().max(3000).optional(),
    context: z.string().trim().max(3000).optional(),
    recipientUserId: z.number().int().positive().optional(),
    recipientEmail: z.string().email().optional(),
  })).mutation(async ({ ctx, input }) => ({ promiseId: await createPromiseForUser({ ...input, userId: ctx.user.id }) })),
  respond: protectedProcedure.input(promiseId.extend({
    response: z.enum(["accepted", "counterproposed", "declined", "clarification_requested"]),
    detail: z.string().trim().max(3000).optional(),
  })).mutation(async ({ ctx, input }) => respondToPromiseInvitation({ ...input, userId: ctx.user.id })),
  addEvent: protectedProcedure.input(promiseId.extend({
    type: z.enum(["progress_added", "at_risk", "blocked", "renegotiation_proposed", "renegotiation_accepted", "marked_complete", "declined", "disputed", "acknowledged", "archived"]),
    detail: z.string().trim().max(3000).optional(),
  })).mutation(async ({ ctx, input }) => addPromiseEventForUser({ ...input, userId: ctx.user.id })),
  export: protectedProcedure.query(async ({ ctx }) => exportPromisesForUser(ctx.user.id)),
  guestPreview: publicProcedure.input(z.object({ token: z.string().min(12).max(96) })).query(async ({ input }) => {
    const invite = await getGuestInvite(input.token);
    if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
    return { promise: invite.promise, confirmationStatus: invite.participant.confirmationStatus };
  }),
  guestRespond: publicProcedure.input(z.object({ token: z.string().min(12).max(96), response: z.enum(["accepted", "counterproposed", "declined"]), detail: z.string().trim().max(3000).optional() })).mutation(async ({ input }) => respondToGuestInvite(input)),
  reliability: protectedProcedure.input(z.object({ otherUserId: z.number().int().positive().optional() })).query(async ({ ctx, input }) => getReliabilitySummaryForUser(ctx.user.id, input.otherUserId)),
  relationships: protectedProcedure.query(async ({ ctx }) => getRelationshipSummariesForUser(ctx.user.id)),
  reminderPreferences: protectedProcedure.query(async ({ ctx }) => getReminderPreferencesForUser(ctx.user.id)),
  updateReminderPreferences: protectedProcedure.input(z.object({
    invitationReminders: z.boolean().optional(),
    dueDateReminders: z.boolean().optional(),
    renegotiationReminders: z.boolean().optional(),
    completionReminders: z.boolean().optional(),
    browserNotifications: z.boolean().optional(),
    emailSummaries: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => updateReminderPreferencesForUser(ctx.user.id, input)),
});
