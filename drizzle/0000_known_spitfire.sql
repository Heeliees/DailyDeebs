CREATE TABLE `results` (
	`player` text NOT NULL,
	`day` integer NOT NULL,
	`score` integer NOT NULL,
	PRIMARY KEY(`player`, `day`)
);
--> statement-breakpoint
CREATE INDEX `results_day` ON `results` (`day`);