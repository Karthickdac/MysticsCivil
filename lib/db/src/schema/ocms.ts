import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const USER_ROLES = [
  "owner",
  "pm",
  "site_engineer",
  "qs",
  "finance",
  "contractor",
  "qc",
  "store",
  "hr",
  "admin",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROJECT_STATUSES = [
  "not_started",
  "on_track",
  "at_risk",
  "delayed",
  "on_hold",
  "completed",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const ACTIVITY_STATUSES = PROJECT_STATUSES;
export const DPR_STATUSES = ["draft", "submitted", "approved", "rejected"] as const;
export type DprStatus = (typeof DPR_STATUSES)[number];

export const MILESTONE_STATUSES = [
  "pending",
  "on_track",
  "at_risk",
  "delayed",
  "completed",
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const ISSUE_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const userProfilesTable = pgTable("user_profiles", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 32 }).notNull().default("site_engineer"),
  organisationId: varchar("organisation_id"),
  phone: varchar("phone", { length: 32 }),
  designation: varchar("designation", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
export type UserProfile = typeof userProfilesTable.$inferSelect;

export const organisationsTable = pgTable("organisations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 256 }).notNull(),
  legalName: varchar("legal_name", { length: 256 }),
  gstin: varchar("gstin", { length: 32 }),
  pan: varchar("pan", { length: 32 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 128 }),
  pincode: varchar("pincode", { length: 16 }),
  logoUrl: varchar("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Organisation = typeof organisationsTable.$inferSelect;
export const insertOrganisationSchema = createInsertSchema(organisationsTable).omit({
  id: true,
  createdAt: true,
});

export const projectsTable = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organisationId: varchar("organisation_id")
    .notNull()
    .references(() => organisationsTable.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  clientName: varchar("client_name", { length: 256 }),
  description: text("description"),
  location: varchar("location", { length: 256 }),
  latitude: numeric("latitude", { precision: 10, scale: 6 }),
  longitude: numeric("longitude", { precision: 10, scale: 6 }),
  reraNumber: varchar("rera_number", { length: 64 }),
  contractValue: numeric("contract_value", { precision: 18, scale: 2 }).notNull().default("0"),
  startDate: timestamp("start_date", { withTimezone: true }),
  targetEndDate: timestamp("target_end_date", { withTimezone: true }),
  forecastEndDate: timestamp("forecast_end_date", { withTimezone: true }),
  status: varchar("status", { length: 32 }).notNull().default("not_started"),
  plannedPercent: numeric("planned_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  actualPercent: numeric("actual_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  costToDate: numeric("cost_to_date", { precision: 18, scale: 2 }).notNull().default("0"),
  budgetToDate: numeric("budget_to_date", { precision: 18, scale: 2 }).notNull().default("0"),
  cpi: numeric("cpi", { precision: 6, scale: 3 }).notNull().default("1"),
  spi: numeric("spi", { precision: 6, scale: 3 }).notNull().default("1"),
  pmId: varchar("pm_id").references(() => usersTable.id),
  coverImageUrl: varchar("cover_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
export type Project = typeof projectsTable.$inferSelect;
export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  cpi: true,
  spi: true,
});

export const wbsActivitiesTable = pgTable("wbs_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id"),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  unit: varchar("unit", { length: 32 }),
  plannedQuantity: numeric("planned_quantity", { precision: 18, scale: 3 }).notNull().default("0"),
  actualQuantity: numeric("actual_quantity", { precision: 18, scale: 3 }).notNull().default("0"),
  plannedStart: timestamp("planned_start", { withTimezone: true }),
  plannedEnd: timestamp("planned_end", { withTimezone: true }),
  actualStart: timestamp("actual_start", { withTimezone: true }),
  actualEnd: timestamp("actual_end", { withTimezone: true }),
  plannedPercent: numeric("planned_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  actualPercent: numeric("actual_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  plannedCost: numeric("planned_cost", { precision: 18, scale: 2 }).notNull().default("0"),
  actualCost: numeric("actual_cost", { precision: 18, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 32 }).notNull().default("not_started"),
  weight: numeric("weight", { precision: 6, scale: 3 }).notNull().default("1"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type WbsActivity = typeof wbsActivitiesTable.$inferSelect;
export const insertWbsActivitySchema = createInsertSchema(wbsActivitiesTable).omit({
  id: true,
  createdAt: true,
});

export const milestonesTable = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  targetDate: timestamp("target_date", { withTimezone: true }).notNull(),
  forecastDate: timestamp("forecast_date", { withTimezone: true }),
  actualDate: timestamp("actual_date", { withTimezone: true }),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  certificateIssued: boolean("certificate_issued").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Milestone = typeof milestonesTable.$inferSelect;
export const insertMilestoneSchema = createInsertSchema(milestonesTable).omit({
  id: true,
  createdAt: true,
});

export const dprsTable = pgTable("dprs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  reportDate: timestamp("report_date", { withTimezone: true }).notNull(),
  weather: varchar("weather", { length: 64 }),
  temperature: numeric("temperature", { precision: 5, scale: 2 }),
  manpowerCount: integer("manpower_count").notNull().default(0),
  summary: text("summary"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  submittedById: varchar("submitted_by_id").references(() => usersTable.id),
  approvedById: varchar("approved_by_id").references(() => usersTable.id),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Dpr = typeof dprsTable.$inferSelect;
export const insertDprSchema = createInsertSchema(dprsTable).omit({
  id: true,
  createdAt: true,
  submittedAt: true,
  approvedAt: true,
  submittedById: true,
  approvedById: true,
  status: true,
});

export const dprItemsTable = pgTable("dpr_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dprId: varchar("dpr_id")
    .notNull()
    .references(() => dprsTable.id, { onDelete: "cascade" }),
  activityId: varchar("activity_id")
    .notNull()
    .references(() => wbsActivitiesTable.id, { onDelete: "cascade" }),
  quantityToday: numeric("quantity_today", { precision: 18, scale: 3 }).notNull().default("0"),
  cumulativeQuantity: numeric("cumulative_quantity", { precision: 18, scale: 3 })
    .notNull()
    .default("0"),
  remarks: text("remarks"),
});
export type DprItem = typeof dprItemsTable.$inferSelect;
export const insertDprItemSchema = createInsertSchema(dprItemsTable).omit({ id: true });

export const sitePhotosTable = pgTable("site_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  activityId: varchar("activity_id").references(() => wbsActivitiesTable.id, {
    onDelete: "set null",
  }),
  dprId: varchar("dpr_id").references(() => dprsTable.id, { onDelete: "set null" }),
  url: varchar("url").notNull(),
  caption: text("caption"),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  latitude: numeric("latitude", { precision: 10, scale: 6 }),
  longitude: numeric("longitude", { precision: 10, scale: 6 }),
  uploadedById: varchar("uploaded_by_id").references(() => usersTable.id),
  tag: varchar("tag", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type SitePhoto = typeof sitePhotosTable.$inferSelect;
export const insertSitePhotoSchema = createInsertSchema(sitePhotosTable).omit({
  id: true,
  createdAt: true,
});

export const documentsTable = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  category: varchar("category", { length: 64 }),
  url: varchar("url").notNull(),
  version: integer("version").notNull().default(1),
  uploadedById: varchar("uploaded_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Document = typeof documentsTable.$inferSelect;
export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true,
  createdAt: true,
});

export const issuesTable = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  dprId: varchar("dpr_id").references(() => dprsTable.id, { onDelete: "set null" }),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  severity: varchar("severity", { length: 32 }).notNull().default("medium"),
  status: varchar("status", { length: 32 }).notNull().default("open"),
  raisedById: varchar("raised_by_id").references(() => usersTable.id),
  assignedToId: varchar("assigned_to_id").references(() => usersTable.id),
  raisedAt: timestamp("raised_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
});
export type Issue = typeof issuesTable.$inferSelect;
export const insertIssueSchema = createInsertSchema(issuesTable).omit({
  id: true,
  raisedAt: true,
  resolvedAt: true,
  raisedById: true,
});

export const approvalsTable = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projectsTable.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 32 }).notNull(),
  entityId: varchar("entity_id").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  requestedById: varchar("requested_by_id").references(() => usersTable.id),
  assignedToRole: varchar("assigned_to_role", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});
export type Approval = typeof approvalsTable.$inferSelect;

// ─────────────────────────────────────────────
// Phase 2 — Estimation Engine
// ─────────────────────────────────────────────

export const ESTIMATE_LEVELS = ["L0", "L1", "L2", "L3", "L4", "L5"] as const;
export type EstimateLevel = (typeof ESTIMATE_LEVELS)[number];

export const ESTIMATE_STATUSES = ["draft", "submitted", "approved", "locked"] as const;
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export const VO_STATUSES = ["draft", "submitted", "approved", "rejected"] as const;
export type VoStatus = (typeof VO_STATUSES)[number];

export const RATE_COMPONENT_TYPES = ["material", "labour", "plant", "overhead"] as const;
export type RateComponentType = (typeof RATE_COMPONENT_TYPES)[number];

export const BOQ_LEVEL_TYPES = ["L2", "L3"] as const;

export const dsrRatesTable = pgTable("dsr_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 32 }).notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  trade: varchar("trade", { length: 64 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  state: varchar("state", { length: 64 }).notNull(),
  cityTier: varchar("city_tier", { length: 16 }).notNull().default("T2"),
  rate: numeric("rate", { precision: 18, scale: 2 }).notNull(),
  effectiveYear: integer("effective_year").notNull().default(2024),
  source: varchar("source", { length: 64 }).notNull().default("DSR"),
  createdById: varchar("created_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
export type DsrRate = typeof dsrRatesTable.$inferSelect;

export const estimatesTable = pgTable("estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  level: varchar("level", { length: 8 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  totalAmount: numeric("total_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdById: varchar("created_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  approvedById: varchar("approved_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
export type Estimate = typeof estimatesTable.$inferSelect;

export const estimateCostHeadsTable = pgTable("estimate_cost_heads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  estimateId: varchar("estimate_id")
    .notNull()
    .references(() => estimatesTable.id, { onDelete: "cascade" }),
  headCode: varchar("head_code", { length: 16 }).notNull(),
  headName: varchar("head_name", { length: 128 }).notNull(),
  percentage: numeric("percentage", { precision: 6, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
});
export type EstimateCostHead = typeof estimateCostHeadsTable.$inferSelect;

export const boqItemsTable = pgTable("boq_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  estimateId: varchar("estimate_id")
    .notNull()
    .references(() => estimatesTable.id, { onDelete: "cascade" }),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  wbsActivityId: varchar("wbs_activity_id").references(() => wbsActivitiesTable.id, { onDelete: "set null" }),
  dsrRateId: varchar("dsr_rate_id").references(() => dsrRatesTable.id, { onDelete: "set null" }),
  levelType: varchar("level_type", { length: 4 }).notNull().default("L3"),
  trade: varchar("trade", { length: 64 }).notNull(),
  itemCode: varchar("item_code", { length: 32 }),
  description: text("description").notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 3 }).notNull().default("0"),
  rate: numeric("rate", { precision: 18, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  actualQuantity: numeric("actual_quantity", { precision: 18, scale: 3 }).notNull().default("0"),
  actualAmount: numeric("actual_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  hsnCode: varchar("hsn_code", { length: 16 }),
  gstRate: numeric("gst_rate", { precision: 5, scale: 2 }).notNull().default("18"),
  locked: boolean("locked").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type BoqItem = typeof boqItemsTable.$inferSelect;

export const rateAnalysisComponentsTable = pgTable("rate_analysis_components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boqItemId: varchar("boq_item_id")
    .notNull()
    .references(() => boqItemsTable.id, { onDelete: "cascade" }),
  componentType: varchar("component_type", { length: 16 }).notNull(),
  description: varchar("description", { length: 256 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 3 }).notNull().default("0"),
  marketRate: numeric("market_rate", { precision: 18, scale: 2 }).notNull().default("0"),
  dsrRate: numeric("dsr_rate", { precision: 18, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
});
export type RateAnalysisComponent = typeof rateAnalysisComponentsTable.$inferSelect;

export const variationOrdersTable = pgTable("variation_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  estimateId: varchar("estimate_id").references(() => estimatesTable.id, { onDelete: "set null" }),
  voNumber: varchar("vo_number", { length: 32 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  scopeChange: text("scope_change"),
  costImpact: numeric("cost_impact", { precision: 18, scale: 2 }).notNull().default("0"),
  programmeImpactDays: integer("programme_impact_days").notNull().default(0),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  raisedById: varchar("raised_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  approvedById: varchar("approved_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});
export type VariationOrder = typeof variationOrdersTable.$inferSelect;

export const _zUserRole = z.enum(USER_ROLES);
