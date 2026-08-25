CREATE TABLE `promise_amendments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promiseId` int NOT NULL,
	`proposedByUserId` int NOT NULL,
	`proposedDueAt` timestamp,
	`proposedCompletionCondition` text,
	`reason` text,
	`status` enum('pending','accepted','declined','withdrawn') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	CONSTRAINT `promise_amendments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promise_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promiseId` int NOT NULL,
	`actorUserId` int,
	`type` enum('created','invited','accepted','counterproposed','declined','clarification_requested','activated','progress_added','blocked','unblocked','renegotiation_proposed','renegotiation_accepted','renegotiation_declined','marked_complete','acknowledged','disputed','archived') NOT NULL,
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promise_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promise_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promiseId` int NOT NULL,
	`userId` int,
	`inviteEmail` varchar(320),
	`inviteToken` varchar(96),
	`role` enum('promisor','recipient','observer') NOT NULL,
	`confirmationStatus` enum('pending','accepted','counterproposed','declined','clarification_requested') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promise_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `promise_participants_inviteToken_unique` UNIQUE(`inviteToken`),
	CONSTRAINT `promise_participant_unique` UNIQUE(`promiseId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `promises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(280) NOT NULL,
	`dueAt` timestamp,
	`completionCondition` text,
	`context` text,
	`status` enum('proposed','active','at_risk','blocked','renegotiation_proposed','renegotiated','complete','acknowledged','disputed','declined','archived') NOT NULL DEFAULT 'proposed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminder_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`invitationReminders` boolean NOT NULL DEFAULT true,
	`dueDateReminders` boolean NOT NULL DEFAULT true,
	`renegotiationReminders` boolean NOT NULL DEFAULT true,
	`completionReminders` boolean NOT NULL DEFAULT true,
	`browserNotifications` boolean NOT NULL DEFAULT false,
	`emailSummaries` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminder_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `reminder_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `promise_amendments` ADD CONSTRAINT `promise_amendments_promiseId_promises_id_fk` FOREIGN KEY (`promiseId`) REFERENCES `promises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promise_amendments` ADD CONSTRAINT `promise_amendments_proposedByUserId_users_id_fk` FOREIGN KEY (`proposedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promise_events` ADD CONSTRAINT `promise_events_promiseId_promises_id_fk` FOREIGN KEY (`promiseId`) REFERENCES `promises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promise_events` ADD CONSTRAINT `promise_events_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promise_participants` ADD CONSTRAINT `promise_participants_promiseId_promises_id_fk` FOREIGN KEY (`promiseId`) REFERENCES `promises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promise_participants` ADD CONSTRAINT `promise_participants_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promises` ADD CONSTRAINT `promises_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reminder_preferences` ADD CONSTRAINT `reminder_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `promise_amendments_promise_idx` ON `promise_amendments` (`promiseId`);--> statement-breakpoint
CREATE INDEX `promise_events_promise_created_idx` ON `promise_events` (`promiseId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `promise_participants_promise_idx` ON `promise_participants` (`promiseId`);--> statement-breakpoint
CREATE INDEX `promise_participants_user_idx` ON `promise_participants` (`userId`);--> statement-breakpoint
CREATE INDEX `promises_creator_idx` ON `promises` (`creatorId`);--> statement-breakpoint
CREATE INDEX `promises_status_idx` ON `promises` (`status`);