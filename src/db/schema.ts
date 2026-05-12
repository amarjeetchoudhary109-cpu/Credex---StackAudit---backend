import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* ─── 1. Users ─── */
export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  /** Credential auth (bcrypt hash); omit on SSO-only accounts later */
  passwordHash: varchar("password_hash", { length: 255 }),
  imageUrl: text("image_url"),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─── 2. Organizations ─── */
export const organizationsTable = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 120 }),
  companySize: integer("company_size"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─── 3. Enums ─── */
export const useCaseEnum = pgEnum("use_case", [
  "coding",
  "writing",
  "data",
  "research",
  "mixed",
]);

export const supportedToolEnum = pgEnum("supported_tool", [
  "cursor",
  "github_copilot",
  "claude",
  "chatgpt",
  "anthropic_api",
  "openai_api",
  "gemini",
  "windsurf",
]);

export const auditStatusEnum = pgEnum("audit_status", [
  "pending",
  "analyzing",
  "completed",
  "failed",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "canceled",
  "refunded",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "unpaid",
  "trialing",
]);

/* ─── 4. Audits ─── */
export const auditsTable = pgTable("audits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  organizationId: uuid("organization_id").references(
    () => organizationsTable.id,
    { onDelete: "cascade" }
  ),
  shareId: varchar("share_id", { length: 32 }).notNull().unique(),
  /** Anonymized intake + engine output for public replay (no PII). */
  toolsSnapshot: jsonb("tools_snapshot").$type<Record<string, unknown>>(),
  /** Short LLM paragraph; math stays in recommendations + numerics. */
  aiSummary: text("ai_summary"),
  teamSize: integer("team_size").notNull(),
  primaryUseCase: useCaseEnum("primary_use_case").notNull(),
  /** Modeled total current monthly spend (sum of tools at submission) */
  totalMonthlySpend: numeric("total_monthly_spend", {
    precision: 12,
    scale: 2,
  }).notNull(),
  /** Estimated unused-license waste per month (heuristic) */
  unusedLicenseMonthlyWaste: numeric("unused_license_monthly_waste", {
    precision: 12,
    scale: 2,
  }),
  monthlySavings: numeric("monthly_savings", {
    precision: 12,
    scale: 2,
  }).notNull(),
  annualSavings: numeric("annual_savings", {
    precision: 12,
    scale: 2,
  }).notNull(),
  efficiencyScore: integer("efficiency_score").notNull(),
  summary: text("summary"),
  status: auditStatusEnum("status").default("completed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─── 5. Audit tools (inputs / inventory per audit) ─── */
export const auditToolsTable = pgTable("audit_tools", {
  id: uuid("id").defaultRandom().primaryKey(),
  auditId: uuid("audit_id")
    .references(() => auditsTable.id, { onDelete: "cascade" })
    .notNull(),
  tool: supportedToolEnum("tool").notNull(),
  /** Vendor plan label from intake form */
  planName: varchar("plan_name", { length: 120 }).notNull(),
  monthlyCost: numeric("monthly_cost", {
    precision: 12,
    scale: 2,
  }).notNull(),
  seats: integer("seats").notNull(),
  utilizationScore: integer("utilization_score"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─── 6. Recommendations ─── */
export const recommendationsTable = pgTable("recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  auditId: uuid("audit_id")
    .references(() => auditsTable.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  estimatedSavings: numeric("estimated_savings", {
    precision: 12,
    scale: 2,
  }),
  priority: varchar("priority", { length: 50 }),
  implemented: boolean("implemented").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─── 7. Leads ─── */
export const leadsTable = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  auditId: uuid("audit_id").references(() => auditsTable.id, {
    onDelete: "set null",
  }),
  email: varchar("email", { length: 255 }).notNull(),
  companyName: varchar("company_name", { length: 255 }),
  role: varchar("role", { length: 120 }),
  teamSize: integer("team_size"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Optional append-only pricing reference for impressing reviewers / audits. */
export const pricingSnapshotsTable = pgTable("pricing_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─── 8. Stripe Customers ─── */
export const stripeCustomersTable = pgTable("stripe_customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─── 9. Payments ─── */
export const paymentsTable = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  auditId: uuid("audit_id").references(() => auditsTable.id, {
    onDelete: "set null",
  }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  amount: integer("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  description: text("description"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─── 10. Subscriptions ─── */
export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => usersTable.id, {
    onDelete: "cascade",
  }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─── 11. Products (for Stripe products/services) ─── */
export const productsTable = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  stripeProductId: varchar("stripe_product_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  active: boolean("active").default(true),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ─── 12. Prices (for Stripe prices) ─── */
export const pricesTable = pgTable("prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => productsTable.id, {
    onDelete: "cascade",
  }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull().unique(),
  unitAmount: integer("unit_amount"), // Amount in cents
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  recurring: boolean("recurring").default(false),
  recurringInterval: varchar("recurring_interval", { length: 20 }), // month, year
  active: boolean("active").default(true),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
