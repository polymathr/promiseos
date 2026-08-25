import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  InsertUser,
  promiseAmendments,
  promiseEvents,
  promiseParticipants,
  promises,
  reminderPreferences,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { nextPromiseState, PromiseEventAction, PromiseState } from "./promiseState";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

export async function createPromiseForUser(input: {
  userId: number;
  title: string;
  dueAt?: Date;
  completionCondition?: string;
  context?: string;
  recipientUserId?: number;
  recipientEmail?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const created = await db.insert(promises).values({
    creatorId: input.userId,
    title: input.title,
    dueAt: input.dueAt,
    completionCondition: input.completionCondition,
    context: input.context,
    status: input.recipientUserId || input.recipientEmail ? "proposed" : "active",
  });
  const promiseId = Number(created[0].insertId);
  await db.insert(promiseParticipants).values({
    promiseId,
    userId: input.userId,
    role: "promisor",
    confirmationStatus: "accepted",
  });
  if (input.recipientUserId || input.recipientEmail) {
    await db.insert(promiseParticipants).values({
      promiseId,
      userId: input.recipientUserId,
      inviteEmail: input.recipientEmail,
      inviteToken: nanoid(32),
      role: "recipient",
      confirmationStatus: "pending",
    });
  }
  await db.insert(promiseEvents).values({ promiseId, actorUserId: input.userId, type: "created", detail: "A promise was created." });
  if (input.recipientUserId || input.recipientEmail) {
    await db.insert(promiseEvents).values({ promiseId, actorUserId: input.userId, type: "invited", detail: "A recipient was invited to confirm the agreement." });
  }
  return promiseId;
}

export async function listPromisesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ promise: promises, participant: promiseParticipants })
    .from(promiseParticipants)
    .innerJoin(promises, eq(promiseParticipants.promiseId, promises.id))
    .where(eq(promiseParticipants.userId, userId))
    .orderBy(desc(promises.updatedAt));
}

export async function getPromiseDetailForUser(promiseId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const access = await db.select({ participantId: promiseParticipants.id }).from(promiseParticipants).where(and(eq(promiseParticipants.promiseId, promiseId), eq(promiseParticipants.userId, userId))).limit(1);
  if (!access[0]) return undefined;
  const promise = (await db.select().from(promises).where(eq(promises.id, promiseId)).limit(1))[0];
  if (!promise) return undefined;
  const participants = await db.select({
    id: promiseParticipants.id,
    promiseId: promiseParticipants.promiseId,
    userId: promiseParticipants.userId,
    inviteEmail: promiseParticipants.inviteEmail,
    role: promiseParticipants.role,
    confirmationStatus: promiseParticipants.confirmationStatus,
    createdAt: promiseParticipants.createdAt,
    updatedAt: promiseParticipants.updatedAt,
    name: users.name,
    email: users.email,
  }).from(promiseParticipants).leftJoin(users, eq(promiseParticipants.userId, users.id)).where(eq(promiseParticipants.promiseId, promiseId));
  const events = await db.select().from(promiseEvents).where(eq(promiseEvents.promiseId, promiseId)).orderBy(desc(promiseEvents.createdAt));
  const amendments = await db.select().from(promiseAmendments).where(eq(promiseAmendments.promiseId, promiseId)).orderBy(desc(promiseAmendments.createdAt));
  return { promise, participants, events, amendments };
}

export async function respondToPromiseInvitation(input: {
  promiseId: number;
  userId: number;
  response: "accepted" | "counterproposed" | "declined" | "clarification_requested";
  detail?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const participant = (await db.select().from(promiseParticipants).where(and(eq(promiseParticipants.promiseId, input.promiseId), eq(promiseParticipants.userId, input.userId))).limit(1))[0];
  if (!participant || participant.role !== "recipient") throw new Error("Only the invited recipient can respond to this invitation");
  await db.update(promiseParticipants).set({ confirmationStatus: input.response }).where(eq(promiseParticipants.id, participant.id));
  const nextStatus = input.response === "accepted" ? "active" : input.response === "counterproposed" ? "renegotiation_proposed" : input.response === "declined" ? "declined" : "proposed";
  await db.update(promises).set({ status: nextStatus }).where(eq(promises.id, input.promiseId));
  await db.insert(promiseEvents).values({ promiseId: input.promiseId, actorUserId: input.userId, type: input.response, detail: input.detail });
}

export async function addPromiseEventForUser(input: {
  promiseId: number;
  userId: number;
  type: PromiseEventAction;
  detail?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const access = await db.select({ id: promiseParticipants.id }).from(promiseParticipants).where(and(eq(promiseParticipants.promiseId, input.promiseId), eq(promiseParticipants.userId, input.userId))).limit(1);
  if (!access[0]) throw new Error("You do not have access to this promise");
  const currentPromise = (await db.select({ status: promises.status }).from(promises).where(eq(promises.id, input.promiseId)).limit(1))[0];
  if (!currentPromise) throw new Error("Promise not found");
  const status = nextPromiseState(currentPromise.status as PromiseState, input.type);
  if (status) await db.update(promises).set({ status }).where(eq(promises.id, input.promiseId));
  await db.insert(promiseEvents).values({ promiseId: input.promiseId, actorUserId: input.userId, type: input.type, detail: input.detail });
}

export async function exportPromisesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await listPromisesForUser(userId);
  return Promise.all(rows.map(async ({ promise }) => ({
    promise,
    events: await db.select().from(promiseEvents).where(eq(promiseEvents.promiseId, promise.id)).orderBy(desc(promiseEvents.createdAt)),
  })));
}

export async function getGuestInvite(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const row = (await db.select({ participant: promiseParticipants, promise: promises }).from(promiseParticipants).innerJoin(promises, eq(promiseParticipants.promiseId, promises.id)).where(eq(promiseParticipants.inviteToken, token)).limit(1))[0];
  if (!row) return undefined;
  return row;
}

export async function respondToGuestInvite(input: { token: string; response: "accepted" | "counterproposed" | "declined"; detail?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const invite = await getGuestInvite(input.token);
  if (!invite) throw new Error("Invitation not found");
  if (invite.participant.confirmationStatus !== "pending") throw new Error("This invitation has already received a response");
  const status = input.response === "accepted" ? "active" : input.response === "counterproposed" ? "renegotiation_proposed" : "declined";
  await db.update(promiseParticipants).set({ confirmationStatus: input.response }).where(eq(promiseParticipants.id, invite.participant.id));
  await db.update(promises).set({ status }).where(eq(promises.id, invite.promise.id));
  await db.insert(promiseEvents).values({ promiseId: invite.promise.id, type: input.response, detail: input.detail ?? "Guest responded before signing in." });
  return { promiseId: invite.promise.id, status };
}

async function getDeletedAccountUserId() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const existing = (await db.select().from(users).where(eq(users.openId, "promiseos-deleted-account")).limit(1))[0];
  if (existing) return existing.id;
  const created = await db.insert(users).values({ openId: "promiseos-deleted-account", name: "Deleted participant", loginMethod: "system", role: "user" });
  return Number(created[0].insertId);
}

export async function deleteAccountForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const participantRows = await db.select().from(promiseParticipants).where(eq(promiseParticipants.userId, userId));
  const deletedAccountUserId = await getDeletedAccountUserId();
  for (const participant of participantRows) {
    const allParticipants = await db.select().from(promiseParticipants).where(eq(promiseParticipants.promiseId, participant.promiseId));
    if (allParticipants.length === 1) {
      await db.delete(promiseEvents).where(eq(promiseEvents.promiseId, participant.promiseId));
      await db.delete(promiseAmendments).where(eq(promiseAmendments.promiseId, participant.promiseId));
      await db.delete(promiseParticipants).where(eq(promiseParticipants.promiseId, participant.promiseId));
      await db.delete(promises).where(eq(promises.id, participant.promiseId));
    } else {
      await db.update(promises).set({ creatorId: deletedAccountUserId, context: "A participant deleted their account." }).where(and(eq(promises.id, participant.promiseId), eq(promises.creatorId, userId)));
      await db.update(promiseEvents).set({ actorUserId: null }).where(and(eq(promiseEvents.promiseId, participant.promiseId), eq(promiseEvents.actorUserId, userId)));
      await db.update(promiseAmendments).set({ proposedByUserId: deletedAccountUserId }).where(and(eq(promiseAmendments.promiseId, participant.promiseId), eq(promiseAmendments.proposedByUserId, userId)));
      await db.delete(promiseParticipants).where(eq(promiseParticipants.id, participant.id));
    }
  }
  await db.delete(reminderPreferences).where(eq(reminderPreferences.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

export async function getReliabilitySummaryForUser(userId: number, otherUserId?: number) {
  const db = await getDb();
  if (!db) return { completed: 0, renegotiated: 0, blocked: 0, open: 0, acknowledged: 0 };
  let sharedPromiseIds = (await db.select({ promiseId: promiseParticipants.promiseId }).from(promiseParticipants).where(eq(promiseParticipants.userId, userId))).map(row => row.promiseId);
  if (otherUserId) {
    const otherIds = (await db.select({ promiseId: promiseParticipants.promiseId }).from(promiseParticipants).where(eq(promiseParticipants.userId, otherUserId))).map(row => row.promiseId);
    sharedPromiseIds = sharedPromiseIds.filter(id => otherIds.includes(id));
  }
  if (!sharedPromiseIds.length) return { completed: 0, renegotiated: 0, blocked: 0, open: 0, acknowledged: 0 };
  const rows = await db.select({ status: promises.status, count: sql<number>`count(*)` }).from(promises).where(inArray(promises.id, sharedPromiseIds)).groupBy(promises.status);
  const get = (status: string) => Number(rows.find(row => row.status === status)?.count ?? 0);
  return {
    completed: get("complete"),
    renegotiated: get("renegotiated") + get("renegotiation_proposed"),
    blocked: get("blocked"),
    open: get("active") + get("at_risk") + get("proposed"),
    acknowledged: get("acknowledged"),
  };
}

export async function getRelationshipSummariesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const mine = await db.select({ promiseId: promiseParticipants.promiseId }).from(promiseParticipants).where(eq(promiseParticipants.userId, userId));
  const ids = mine.map(row => row.promiseId);
  if (!ids.length) return [];
  const partnerRows = (await db.select().from(promiseParticipants).where(inArray(promiseParticipants.promiseId, ids))).filter(row => row.userId !== userId);
  const promiseRows = await db.select({ id: promises.id, status: promises.status }).from(promises).where(inArray(promises.id, ids));
  const userIds = partnerRows.map(row => row.userId).filter((id): id is number => Boolean(id));
  const people = userIds.length ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, userIds)) : [];
  const labels = new Map(people.map(person => [person.id, person.name || person.email || "Private participant"]));
  const statusByPromise = new Map(promiseRows.map(row => [row.id, row.status]));
  const groups = new Map<string, { label: string; open: number; completed: number; renegotiated: number; blocked: number; acknowledged: number }>();
  partnerRows.forEach(row => {
    const key = row.userId ? `user-${row.userId}` : `email-${row.inviteEmail ?? row.id}`;
    const label = row.userId ? labels.get(row.userId) ?? "Private participant" : row.inviteEmail ?? "Pending invitation";
    const current = groups.get(key) ?? { label, open: 0, completed: 0, renegotiated: 0, blocked: 0, acknowledged: 0 };
    const status = statusByPromise.get(row.promiseId);
    if (status === "complete") current.completed += 1;
    else if (status === "acknowledged") current.acknowledged += 1;
    else if (status === "renegotiated" || status === "renegotiation_proposed") current.renegotiated += 1;
    else if (status === "blocked") current.blocked += 1;
    else if (status && !["declined", "archived", "disputed"].includes(status)) current.open += 1;
    groups.set(key, current);
  });
  return Array.from(groups.values());
}

export async function getReminderPreferencesForUser(userId: number) {
  const db = await getDb();
  const defaults = {
    userId,
    invitationReminders: true,
    dueDateReminders: true,
    renegotiationReminders: true,
    completionReminders: true,
    browserNotifications: false,
    emailSummaries: false,
  };
  if (!db) return defaults;
  return (await db.select().from(reminderPreferences).where(eq(reminderPreferences.userId, userId)).limit(1))[0] ?? defaults;
}

export async function updateReminderPreferencesForUser(userId: number, values: Partial<typeof reminderPreferences.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(reminderPreferences).values({ userId, ...values }).onDuplicateKeyUpdate({ set: values });
  return getReminderPreferencesForUser(userId);
}
