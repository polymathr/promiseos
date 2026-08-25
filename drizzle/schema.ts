import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const promises = mysqlTable("promises", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull().references(() => users.id),
  title: varchar("title", { length: 280 }).notNull(),
  dueAt: timestamp("dueAt"),
  completionCondition: text("completionCondition"),
  context: text("context"),
  status: mysqlEnum("status", [
    "proposed",
    "active",
    "at_risk",
    "blocked",
    "renegotiation_proposed",
    "renegotiated",
    "complete",
    "acknowledged",
    "disputed",
    "declined",
    "archived",
  ]).notNull().default("proposed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("promises_creator_idx").on(table.creatorId), index("promises_status_idx").on(table.status)]);

export const promiseParticipants = mysqlTable("promise_participants", {
  id: int("id").autoincrement().primaryKey(),
  promiseId: int("promiseId").notNull().references(() => promises.id),
  userId: int("userId").references(() => users.id),
  inviteEmail: varchar("inviteEmail", { length: 320 }),
  inviteToken: varchar("inviteToken", { length: 96 }).unique(),
  role: mysqlEnum("role", ["promisor", "recipient", "observer"]).notNull(),
  confirmationStatus: mysqlEnum("confirmationStatus", ["pending", "accepted", "counterproposed", "declined", "clarification_requested"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("promise_participants_promise_idx").on(table.promiseId),
  index("promise_participants_user_idx").on(table.userId),
  uniqueIndex("promise_participant_unique").on(table.promiseId, table.userId),
]);

export const promiseAmendments = mysqlTable("promise_amendments", {
  id: int("id").autoincrement().primaryKey(),
  promiseId: int("promiseId").notNull().references(() => promises.id),
  proposedByUserId: int("proposedByUserId").notNull().references(() => users.id),
  proposedDueAt: timestamp("proposedDueAt"),
  proposedCompletionCondition: text("proposedCompletionCondition"),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "accepted", "declined", "withdrawn"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
}, table => [index("promise_amendments_promise_idx").on(table.promiseId)]);

export const promiseEvents = mysqlTable("promise_events", {
  id: int("id").autoincrement().primaryKey(),
  promiseId: int("promiseId").notNull().references(() => promises.id),
  actorUserId: int("actorUserId").references(() => users.id),
  type: mysqlEnum("type", [
    "created",
    "invited",
    "accepted",
    "counterproposed",
    "declined",
    "clarification_requested",
    "activated",
    "progress_added",
    "blocked",
    "unblocked",
    "renegotiation_proposed",
    "renegotiation_accepted",
    "renegotiation_declined",
    "marked_complete",
    "acknowledged",
    "disputed",
    "archived",
  ]).notNull(),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("promise_events_promise_created_idx").on(table.promiseId, table.createdAt)]);

export const reminderPreferences = mysqlTable("reminder_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  invitationReminders: boolean("invitationReminders").notNull().default(true),
  dueDateReminders: boolean("dueDateReminders").notNull().default(true),
  renegotiationReminders: boolean("renegotiationReminders").notNull().default(true),
  completionReminders: boolean("completionReminders").notNull().default(true),
  browserNotifications: boolean("browserNotifications").notNull().default(false),
  emailSummaries: boolean("emailSummaries").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Promise = typeof promises.$inferSelect;
export type PromiseParticipant = typeof promiseParticipants.$inferSelect;
export type PromiseEvent = typeof promiseEvents.$inferSelect;
