import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actor: text("actor").notNull(),
  nickname: text("nickname").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),
}, table => [index("idx_messages_actor_created").on(table.actor, table.createdAt)]);
export const linkedWallets=sqliteTable("linked_wallets",{
 viewerId:text("viewer_id").notNull(),address:text("address").notNull(),createdAt:integer("created_at").notNull(),
},table=>[primaryKey({columns:[table.viewerId,table.address]})]);
export const walletChallenges=sqliteTable("wallet_challenges",{
 id:text("id").primaryKey(),viewerId:text("viewer_id").notNull(),address:text("address").notNull(),message:text("message").notNull(),issuedAt:integer("issued_at").notNull(),expiresAt:integer("expires_at").notNull(),consumedAt:integer("consumed_at"),
},table=>[uniqueIndex("idx_challenges_viewer_address").on(table.viewerId,table.address),index("idx_challenges_viewer_issued").on(table.viewerId,table.issuedAt)]);
