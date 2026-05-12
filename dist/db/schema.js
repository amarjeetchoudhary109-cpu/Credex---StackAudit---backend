"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricesTable = exports.productsTable = exports.subscriptionsTable = exports.paymentsTable = exports.stripeCustomersTable = exports.pricingSnapshotsTable = exports.leadsTable = exports.recommendationsTable = exports.auditToolsTable = exports.auditsTable = exports.subscriptionStatusEnum = exports.paymentStatusEnum = exports.auditStatusEnum = exports.supportedToolEnum = exports.useCaseEnum = exports.organizationsTable = exports.usersTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
/* ─── 1. Users ─── */
exports.usersTable = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }),
    /** Credential auth (bcrypt hash); omit on SSO-only accounts later */
    passwordHash: (0, pg_core_1.varchar)("password_hash", { length: 255 }),
    imageUrl: (0, pg_core_1.text)("image_url"),
    role: (0, pg_core_1.varchar)("role", { length: 50 }).default("user"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
/* ─── 2. Organizations ─── */
exports.organizationsTable = (0, pg_core_1.pgTable)("organizations", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    industry: (0, pg_core_1.varchar)("industry", { length: 120 }),
    companySize: (0, pg_core_1.integer)("company_size"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
/* ─── 3. Enums ─── */
exports.useCaseEnum = (0, pg_core_1.pgEnum)("use_case", [
    "coding",
    "writing",
    "data",
    "research",
    "mixed",
]);
exports.supportedToolEnum = (0, pg_core_1.pgEnum)("supported_tool", [
    "cursor",
    "github_copilot",
    "claude",
    "chatgpt",
    "anthropic_api",
    "openai_api",
    "gemini",
    "windsurf",
]);
exports.auditStatusEnum = (0, pg_core_1.pgEnum)("audit_status", [
    "pending",
    "analyzing",
    "completed",
    "failed",
]);
exports.paymentStatusEnum = (0, pg_core_1.pgEnum)("payment_status", [
    "pending",
    "processing",
    "succeeded",
    "failed",
    "canceled",
    "refunded",
]);
exports.subscriptionStatusEnum = (0, pg_core_1.pgEnum)("subscription_status", [
    "active",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "past_due",
    "unpaid",
    "trialing",
]);
/* ─── 4. Audits ─── */
exports.auditsTable = (0, pg_core_1.pgTable)("audits", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id").references(() => exports.usersTable.id, {
        onDelete: "cascade",
    }),
    organizationId: (0, pg_core_1.uuid)("organization_id").references(() => exports.organizationsTable.id, { onDelete: "cascade" }),
    shareId: (0, pg_core_1.varchar)("share_id", { length: 32 }).notNull().unique(),
    /** Anonymized intake + engine output for public replay (no PII). */
    toolsSnapshot: (0, pg_core_1.jsonb)("tools_snapshot").$type(),
    /** Short LLM paragraph; math stays in recommendations + numerics. */
    aiSummary: (0, pg_core_1.text)("ai_summary"),
    teamSize: (0, pg_core_1.integer)("team_size").notNull(),
    primaryUseCase: (0, exports.useCaseEnum)("primary_use_case").notNull(),
    /** Modeled total current monthly spend (sum of tools at submission) */
    totalMonthlySpend: (0, pg_core_1.numeric)("total_monthly_spend", {
        precision: 12,
        scale: 2,
    }).notNull(),
    /** Estimated unused-license waste per month (heuristic) */
    unusedLicenseMonthlyWaste: (0, pg_core_1.numeric)("unused_license_monthly_waste", {
        precision: 12,
        scale: 2,
    }),
    monthlySavings: (0, pg_core_1.numeric)("monthly_savings", {
        precision: 12,
        scale: 2,
    }).notNull(),
    annualSavings: (0, pg_core_1.numeric)("annual_savings", {
        precision: 12,
        scale: 2,
    }).notNull(),
    efficiencyScore: (0, pg_core_1.integer)("efficiency_score").notNull(),
    summary: (0, pg_core_1.text)("summary"),
    status: (0, exports.auditStatusEnum)("status").default("completed").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
/* ─── 5. Audit tools (inputs / inventory per audit) ─── */
exports.auditToolsTable = (0, pg_core_1.pgTable)("audit_tools", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    auditId: (0, pg_core_1.uuid)("audit_id")
        .references(() => exports.auditsTable.id, { onDelete: "cascade" })
        .notNull(),
    tool: (0, exports.supportedToolEnum)("tool").notNull(),
    /** Vendor plan label from intake form */
    planName: (0, pg_core_1.varchar)("plan_name", { length: 120 }).notNull(),
    monthlyCost: (0, pg_core_1.numeric)("monthly_cost", {
        precision: 12,
        scale: 2,
    }).notNull(),
    seats: (0, pg_core_1.integer)("seats").notNull(),
    utilizationScore: (0, pg_core_1.integer)("utilization_score"),
    active: (0, pg_core_1.boolean)("active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
/* ─── 6. Recommendations ─── */
exports.recommendationsTable = (0, pg_core_1.pgTable)("recommendations", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    auditId: (0, pg_core_1.uuid)("audit_id")
        .references(() => exports.auditsTable.id, { onDelete: "cascade" })
        .notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    estimatedSavings: (0, pg_core_1.numeric)("estimated_savings", {
        precision: 12,
        scale: 2,
    }),
    priority: (0, pg_core_1.varchar)("priority", { length: 50 }),
    implemented: (0, pg_core_1.boolean)("implemented").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
/* ─── 7. Leads ─── */
exports.leadsTable = (0, pg_core_1.pgTable)("leads", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    auditId: (0, pg_core_1.uuid)("audit_id").references(() => exports.auditsTable.id, {
        onDelete: "set null",
    }),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull(),
    companyName: (0, pg_core_1.varchar)("company_name", { length: 255 }),
    role: (0, pg_core_1.varchar)("role", { length: 120 }),
    teamSize: (0, pg_core_1.integer)("team_size"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
/** Optional append-only pricing reference for impressing reviewers / audits. */
exports.pricingSnapshotsTable = (0, pg_core_1.pgTable)("pricing_snapshots", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    label: (0, pg_core_1.varchar)("label", { length: 120 }).notNull(),
    payload: (0, pg_core_1.jsonb)("payload").$type().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
/* ─── 8. Stripe Customers ─── */
exports.stripeCustomersTable = (0, pg_core_1.pgTable)("stripe_customers", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id").references(() => exports.usersTable.id, {
        onDelete: "cascade",
    }),
    stripeCustomerId: (0, pg_core_1.varchar)("stripe_customer_id", { length: 255 }).notNull().unique(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
/* ─── 9. Payments ─── */
exports.paymentsTable = (0, pg_core_1.pgTable)("payments", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id").references(() => exports.usersTable.id, {
        onDelete: "cascade",
    }),
    auditId: (0, pg_core_1.uuid)("audit_id").references(() => exports.auditsTable.id, {
        onDelete: "set null",
    }),
    stripePaymentIntentId: (0, pg_core_1.varchar)("stripe_payment_intent_id", { length: 255 }).notNull().unique(),
    stripeCustomerId: (0, pg_core_1.varchar)("stripe_customer_id", { length: 255 }),
    amount: (0, pg_core_1.integer)("amount").notNull(), // Amount in cents
    currency: (0, pg_core_1.varchar)("currency", { length: 3 }).default("usd").notNull(),
    status: (0, exports.paymentStatusEnum)("status").default("pending").notNull(),
    description: (0, pg_core_1.text)("description"),
    metadata: (0, pg_core_1.text)("metadata"), // JSON string for additional data
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
/* ─── 10. Subscriptions ─── */
exports.subscriptionsTable = (0, pg_core_1.pgTable)("subscriptions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id").references(() => exports.usersTable.id, {
        onDelete: "cascade",
    }),
    stripeSubscriptionId: (0, pg_core_1.varchar)("stripe_subscription_id", { length: 255 }).notNull().unique(),
    stripeCustomerId: (0, pg_core_1.varchar)("stripe_customer_id", { length: 255 }).notNull(),
    stripePriceId: (0, pg_core_1.varchar)("stripe_price_id", { length: 255 }).notNull(),
    status: (0, exports.subscriptionStatusEnum)("status").default("active").notNull(),
    currentPeriodStart: (0, pg_core_1.timestamp)("current_period_start", { withTimezone: true }),
    currentPeriodEnd: (0, pg_core_1.timestamp)("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: (0, pg_core_1.boolean)("cancel_at_period_end").default(false),
    metadata: (0, pg_core_1.text)("metadata"), // JSON string for additional data
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
/* ─── 11. Products (for Stripe products/services) ─── */
exports.productsTable = (0, pg_core_1.pgTable)("products", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    stripeProductId: (0, pg_core_1.varchar)("stripe_product_id", { length: 255 }).notNull().unique(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    active: (0, pg_core_1.boolean)("active").default(true),
    metadata: (0, pg_core_1.text)("metadata"), // JSON string for additional data
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
/* ─── 12. Prices (for Stripe prices) ─── */
exports.pricesTable = (0, pg_core_1.pgTable)("prices", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    productId: (0, pg_core_1.uuid)("product_id").references(() => exports.productsTable.id, {
        onDelete: "cascade",
    }),
    stripePriceId: (0, pg_core_1.varchar)("stripe_price_id", { length: 255 }).notNull().unique(),
    unitAmount: (0, pg_core_1.integer)("unit_amount"), // Amount in cents
    currency: (0, pg_core_1.varchar)("currency", { length: 3 }).default("usd").notNull(),
    recurring: (0, pg_core_1.boolean)("recurring").default(false),
    recurringInterval: (0, pg_core_1.varchar)("recurring_interval", { length: 20 }), // month, year
    active: (0, pg_core_1.boolean)("active").default(true),
    metadata: (0, pg_core_1.text)("metadata"), // JSON string for additional data
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
//# sourceMappingURL=schema.js.map