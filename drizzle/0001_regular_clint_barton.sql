CREATE TABLE `linked_wallets` (
	`viewer_id` text NOT NULL,
	`address` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`viewer_id`, `address`)
);
--> statement-breakpoint
CREATE TABLE `wallet_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`viewer_id` text NOT NULL,
	`address` text NOT NULL,
	`message` text NOT NULL,
	`issued_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_challenges_viewer_address` ON `wallet_challenges` (`viewer_id`,`address`);--> statement-breakpoint
CREATE INDEX `idx_challenges_viewer_issued` ON `wallet_challenges` (`viewer_id`,`issued_at`);