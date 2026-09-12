import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
export const results = sqliteTable("results", {
 player: text("player").notNull(), day: integer("day").notNull(), score: integer("score").notNull()
}, t => [primaryKey({columns:[t.player,t.day]}),index("results_day").on(t.day)]);
