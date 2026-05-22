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

export const workOrderEstimatesTable = pgTable("work_order_estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  l3EstimateId: varchar("l3_estimate_id").references(() => estimatesTable.id, { onDelete: "set null" }),
  subcontractor: varchar("subcontractor", { length: 256 }).notNull(),
  workPackage: varchar("work_package", { length: 256 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  totalBoqAmount: numeric("total_boq_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  totalNegotiatedAmount: numeric("total_negotiated_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdById: varchar("created_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
export type WorkOrderEstimate = typeof workOrderEstimatesTable.$inferSelect;

export const workOrderEstimateItemsTable = pgTable("work_order_estimate_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderEstimateId: varchar("work_order_estimate_id")
    .notNull()
    .references(() => workOrderEstimatesTable.id, { onDelete: "cascade" }),
  boqItemId: varchar("boq_item_id").references(() => boqItemsTable.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 3 }).notNull().default("0"),
  boqRate: numeric("boq_rate", { precision: 18, scale: 2 }).notNull().default("0"),
  negotiatedRate: numeric("negotiated_rate", { precision: 18, scale: 2 }).notNull().default("0"),
  negotiatedAmount: numeric("negotiated_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
});
export type WorkOrderEstimateItem = typeof workOrderEstimateItemsTable.$inferSelect;

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

// ─────────────────────────────────────────────
// Phase 3 — Financial Core
// ─────────────────────────────────────────────

export const BILL_STATUSES = [
  "draft", "submitted", "technical_check", "qs_scrutiny", "pm_certification",
  "auto_deductions", "gst_invoice", "finance_approval", "payment_released", "closed",
] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

export const DEDUCTION_TYPES = [
  "tds_194c", "advance_recovery", "retention", "material_issued", "penalty", "lwf",
] as const;
export type DeductionType = (typeof DEDUCTION_TYPES)[number];

export const PAYMENT_MODES = ["neft", "rtgs", "upi", "cheque"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const LEDGER_ACCOUNT_TYPES = [
  "asset", "liability", "capital", "revenue", "expenditure", "tax",
] as const;
export type LedgerAccountType = (typeof LEDGER_ACCOUNT_TYPES)[number];

export const CLIENT_INVOICE_STATUSES = [
  "draft", "sent", "acknowledged", "paid", "overdue",
] as const;
export type ClientInvoiceStatus = (typeof CLIENT_INVOICE_STATUSES)[number];

export const contractorBillsTable = pgTable("contractor_bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  workOrderId: varchar("work_order_id").references(() => workOrderEstimatesTable.id, { onDelete: "set null" }),
  billNumber: varchar("bill_number", { length: 32 }).notNull(),
  billDate: timestamp("bill_date", { withTimezone: true }).notNull().defaultNow(),
  periodFrom: timestamp("period_from", { withTimezone: true }),
  periodTo: timestamp("period_to", { withTimezone: true }),
  grossAmount: numeric("gross_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  totalDeductions: numeric("total_deductions", { precision: 18, scale: 2 }).notNull().default("0"),
  gstAmount: numeric("gst_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  netPayable: numeric("net_payable", { precision: 18, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  invoiceUrl: varchar("invoice_url"),
  measurementUrl: varchar("measurement_url"),
  irnNumber: varchar("irn_number", { length: 128 }),
  remarks: text("remarks"),
  technicalRemarks: text("technical_remarks"),
  qsRemarks: text("qs_remarks"),
  pmRemarks: text("pm_remarks"),
  submittedById: varchar("submitted_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  technicalCheckedById: varchar("technical_checked_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  qsScrutinizedById: varchar("qs_scrutinized_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  pmCertifiedById: varchar("pm_certified_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  financeApprovedById: varchar("finance_approved_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  utr: varchar("utr", { length: 64 }),
  paymentMode: varchar("payment_mode", { length: 16 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  technicalCheckedAt: timestamp("technical_checked_at", { withTimezone: true }),
  qsScrutinizedAt: timestamp("qs_scrutinized_at", { withTimezone: true }),
  pmCertifiedAt: timestamp("pm_certified_at", { withTimezone: true }),
  financeApprovedAt: timestamp("finance_approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
export type ContractorBill = typeof contractorBillsTable.$inferSelect;

export const billDeductionsTable = pgTable("bill_deductions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull().references(() => contractorBillsTable.id, { onDelete: "cascade" }),
  deductionType: varchar("deduction_type", { length: 32 }).notNull(),
  description: varchar("description", { length: 256 }).notNull(),
  rate: numeric("rate", { precision: 6, scale: 3 }).notNull().default("0"),
  baseAmount: numeric("base_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  legalRef: varchar("legal_ref", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type BillDeduction = typeof billDeductionsTable.$inferSelect;

export const paymentVouchersTable = pgTable("payment_vouchers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id").notNull().references(() => contractorBillsTable.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  voucherNumber: varchar("voucher_number", { length: 32 }).notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  mode: varchar("mode", { length: 16 }).notNull().default("neft"),
  bankName: varchar("bank_name", { length: 128 }),
  accountNumber: varchar("account_number", { length: 32 }),
  ifscCode: varchar("ifsc_code", { length: 16 }),
  utr: varchar("utr", { length: 64 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  releasedById: varchar("released_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type PaymentVoucher = typeof paymentVouchersTable.$inferSelect;

export const ledgerAccountsTable = pgTable("ledger_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organisationId: varchar("organisation_id").references(() => organisationsTable.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projectsTable.id, { onDelete: "cascade" }),
  accountCode: varchar("account_code", { length: 16 }).notNull(),
  accountName: varchar("account_name", { length: 128 }).notNull(),
  accountType: varchar("account_type", { length: 32 }).notNull(),
  parentAccountId: varchar("parent_account_id"),
  openingBalance: numeric("opening_balance", { precision: 18, scale: 2 }).notNull().default("0"),
  currentBalance: numeric("current_balance", { precision: 18, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type LedgerAccount = typeof ledgerAccountsTable.$inferSelect;

export const ledgerEntriesTable = pgTable("ledger_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  entryNumber: varchar("entry_number", { length: 32 }).notNull(),
  entryDate: timestamp("entry_date", { withTimezone: true }).notNull().defaultNow(),
  entityType: varchar("entity_type", { length: 32 }),
  entityId: varchar("entity_id"),
  narration: text("narration").notNull(),
  debitAccountId: varchar("debit_account_id").references(() => ledgerAccountsTable.id, { onDelete: "set null" }),
  creditAccountId: varchar("credit_account_id").references(() => ledgerAccountsTable.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  createdById: varchar("created_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type LedgerEntry = typeof ledgerEntriesTable.$inferSelect;

export const clientInvoicesTable = pgTable("client_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  invoiceNumber: varchar("invoice_number", { length: 32 }).notNull(),
  clientName: varchar("client_name", { length: 256 }).notNull(),
  invoiceDate: timestamp("invoice_date", { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  milestoneId: varchar("milestone_id").references(() => milestonesTable.id, { onDelete: "set null" }),
  grossAmount: numeric("gross_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  cgstRate: numeric("cgst_rate", { precision: 5, scale: 2 }).notNull().default("9"),
  sgstRate: numeric("sgst_rate", { precision: 5, scale: 2 }).notNull().default("9"),
  igstRate: numeric("igst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  gstAmount: numeric("gst_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  netAmount: numeric("net_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  retentionHeld: numeric("retention_held", { precision: 18, scale: 2 }).notNull().default("0"),
  amountReceived: numeric("amount_received", { precision: 18, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  irnNumber: varchar("irn_number", { length: 128 }),
  reraReference: varchar("rera_reference", { length: 64 }),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
export type ClientInvoice = typeof clientInvoicesTable.$inferSelect;

export const gstEntriesTable = pgTable("gst_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 32 }).notNull(),
  entityId: varchar("entity_id").notNull(),
  invoiceNumber: varchar("invoice_number", { length: 32 }).notNull(),
  invoiceDate: timestamp("invoice_date", { withTimezone: true }).notNull().defaultNow(),
  partyGstin: varchar("party_gstin", { length: 32 }),
  partyName: varchar("party_name", { length: 256 }).notNull(),
  taxableValue: numeric("taxable_value", { precision: 18, scale: 2 }).notNull().default("0"),
  cgstRate: numeric("cgst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  cgstAmount: numeric("cgst_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  sgstRate: numeric("sgst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  sgstAmount: numeric("sgst_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  igstRate: numeric("igst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  igstAmount: numeric("igst_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  totalGst: numeric("total_gst", { precision: 18, scale: 2 }).notNull().default("0"),
  hsnCode: varchar("hsn_code", { length: 16 }),
  entryType: varchar("entry_type", { length: 16 }).notNull().default("purchase"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type GstEntry = typeof gstEntriesTable.$inferSelect;

export const tdsEntriesTable = pgTable("tds_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  billId: varchar("bill_id").references(() => contractorBillsTable.id, { onDelete: "set null" }),
  vendorName: varchar("vendor_name", { length: 256 }).notNull(),
  pan: varchar("pan", { length: 16 }),
  sectionCode: varchar("section_code", { length: 16 }).notNull().default("194C"),
  grossAmount: numeric("gross_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  tdsRate: numeric("tds_rate", { precision: 5, scale: 3 }).notNull().default("1"),
  tdsAmount: numeric("tds_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  depositedAt: timestamp("deposited_at", { withTimezone: true }),
  challanNumber: varchar("challan_number", { length: 32 }),
  quarter: varchar("quarter", { length: 8 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type TdsEntry = typeof tdsEntriesTable.$inferSelect;

export const retentionLedgerTable = pgTable("retention_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  workOrderId: varchar("work_order_id").references(() => workOrderEstimatesTable.id, { onDelete: "set null" }),
  billId: varchar("bill_id").references(() => contractorBillsTable.id, { onDelete: "set null" }),
  transactionType: varchar("transaction_type", { length: 32 }).notNull(),
  retentionHeld: numeric("retention_held", { precision: 18, scale: 2 }).notNull().default("0"),
  retentionReleased: numeric("retention_released", { precision: 18, scale: 2 }).notNull().default("0"),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("0"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type RetentionLedger = typeof retentionLedgerTable.$inferSelect;

export const advanceLedgerTable = pgTable("advance_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  workOrderId: varchar("work_order_id").references(() => workOrderEstimatesTable.id, { onDelete: "set null" }),
  billId: varchar("bill_id").references(() => contractorBillsTable.id, { onDelete: "set null" }),
  transactionType: varchar("transaction_type", { length: 32 }).notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull().default("0"),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("0"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type AdvanceLedger = typeof advanceLedgerTable.$inferSelect;

export const _zUserRole = z.enum(USER_ROLES);
