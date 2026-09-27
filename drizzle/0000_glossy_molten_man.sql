CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`name` text NOT NULL,
	`company` text,
	`contact` text NOT NULL,
	`interest` text NOT NULL,
	`consent_version` text NOT NULL,
	`consented_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_session_id_unique` ON `leads` (`session_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`intent` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`profile` text,
	`answers` text,
	`quiz_version` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_completed_at` ON `sessions` (`completed_at`);