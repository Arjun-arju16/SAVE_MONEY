import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';



// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Time-locked savings table
export const lockedSavings = sqliteTable('locked_savings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  amount: integer('amount', { mode: 'number' }).notNull(),
  lockDays: integer('lock_days').notNull(),
  lockedAt: integer('locked_at', { mode: 'timestamp' }).notNull(),
  unlockAt: integer('unlock_at', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Products table
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: integer('price', { mode: 'number' }).notNull(),
  imageUrl: text('image_url'),
  description: text('description'),
  available: integer('available', { mode: 'boolean' }).notNull().default(true),
});

// Orders table - migrated structure
export const ordersV2 = sqliteTable('orders_v2', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  productName: text('product_name').notNull(),
  productPrice: integer('product_price', { mode: 'number' }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  totalAmount: integer('total_amount', { mode: 'number' }).notNull(),
  status: text('status').notNull().default('pending'),
  shippingAddress: text('shipping_address'),
  trackingNumber: text('tracking_number'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// Transactions table - migrated structure
export const transactionsV2 = sqliteTable('transactions_v2', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  amount: integer('amount', { mode: 'number' }).notNull(),
  penalty: integer('penalty', { mode: 'number' }),
  status: text('status').notNull().default('completed'),
  lockDays: integer('lock_days'),
  savingsId: integer('savings_id').references(() => lockedSavings.id),
  orderId: integer('order_id').references(() => ordersV2.id),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Goals table
export const goals = sqliteTable('goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  productName: text('product_name').notNull(),
  productImage: text('product_image'),
  targetAmount: integer('target_amount', { mode: 'number' }).notNull(),
  currentAmount: integer('current_amount', { mode: 'number' }).notNull().default(0),
  dailyTarget: integer('daily_target', { mode: 'number' }).notNull(),
  status: text('status').notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// Rewards table
export const rewards = sqliteTable('rewards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  rewardType: text('reward_type').notNull(),
  rewardName: text('reward_name').notNull(),
  rewardDescription: text('reward_description'),
  earnedAt: integer('earned_at', { mode: 'timestamp' }).notNull(),
});

// User rewards table
export const userRewards = sqliteTable('user_rewards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull(),
  productName: text('product_name').notNull(),
  productPrice: integer('product_price', { mode: 'number' }).notNull(),
  claimedAt: integer('claimed_at', { mode: 'timestamp' }).notNull(),
  orderId: integer('order_id').references(() => ordersV2.id),
});