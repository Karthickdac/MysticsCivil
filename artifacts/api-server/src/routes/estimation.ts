import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  estimatesTable,
  estimateCostHeadsTable,
  boqItemsTable,
  rateAnalysisComponentsTable,
  dsrRatesTable,
  wbsActivitiesTable,
} from "@workspace/db";
import { eq, asc, and } from "drizzle-orm";
import { requireAuth, requireRole, ROLE_GROUPS } from "../middlewares/requireAuth";
import { n, nOrNull, d, dReq } from "../lib/serialize";

const router: IRouter = Router();

const DEFAULT_L1_HEADS = [
  { code: "CIV", name: "Civil Works", pct: 35, sort: 0 },
  { code: "FIN", name: "Finishing", pct: 18, sort: 1 },
  { code: "MEP", name: "MEP Services", pct: 15, sort: 2 },
  { code: "EXT", name: "External Development", pct: 5, sort: 3 },
  { code: "PRE", name: "Preliminaries", pct: 7, sort: 4 },
  { code: "FEE", name: "Professional Fees", pct: 4, sort: 5 },
  { code: "STA", name: "Statutory Charges", pct: 3, sort: 6 },
  { code: "IDC", name: "Interest During Construction", pct: 4, sort: 7 },
  { code: "CON", name: "Contingency", pct: 5, sort: 8 },
  { code: "GST", name: "GST", pct: 4, sort: 9 },
];

function serializeEstimate(e: any) {
  return {
    id: e.id,
    projectId: e.projectId,
    level: e.level,
    name: e.name,
    status: e.status,
    totalAmount: n(e.totalAmount),
    notes: e.notes ?? null,
    metadata: e.metadata ?? null,
    createdById: e.createdById ?? null,
    approvedById: e.approvedById ?? null,
    approvedAt: d(e.approvedAt),
    createdAt: dReq(e.createdAt),
    updatedAt: dReq(e.updatedAt),
  };
}

function serializeCostHead(h: any) {
  return {
    id: h.id,
    estimateId: h.estimateId,
    headCode: h.headCode,
    headName: h.headName,
    percentage: n(h.percentage),
    amount: n(h.amount),
    sortOrder: h.sortOrder ?? 0,
  };
}

function serializeBoqItem(i: any) {
  return {
    id: i.id,
    estimateId: i.estimateId,
    projectId: i.projectId,
    wbsActivityId: i.wbsActivityId ?? null,
    dsrRateId: i.dsrRateId ?? null,
    levelType: i.levelType,
    trade: i.trade,
    itemCode: i.itemCode ?? null,
    description: i.description,
    unit: i.unit,
    quantity: n(i.quantity),
    rate: n(i.rate),
    amount: n(i.amount),
    actualQuantity: n(i.actualQuantity),
    actualAmount: n(i.actualAmount),
    hsnCode: i.hsnCode ?? null,
    gstRate: n(i.gstRate),
    locked: !!i.locked,
    sortOrder: i.sortOrder ?? 0,
    createdAt: dReq(i.createdAt),
  };
}

function serializeRaComponent(c: any) {
  return {
    id: c.id,
    boqItemId: c.boqItemId,
    componentType: c.componentType,
    description: c.description,
    unit: c.unit,
    quantity: n(c.quantity),
    marketRate: n(c.marketRate),
    dsrRate: n(c.dsrRate),
    amount: n(c.amount),
    sortOrder: c.sortOrder ?? 0,
  };
}

// ── Estimates ──────────────────────────────────────────────────

router.get(
  "/projects/:projectId/estimates",
  requireAuth,
  async (req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(estimatesTable)
      .where(eq(estimatesTable.projectId, req.params.projectId))
      .orderBy(asc(estimatesTable.createdAt));
    res.json(rows.map(serializeEstimate));
  },
);

router.post(
  "/projects/:projectId/estimates",
  requireAuth,
  requireRole(...ROLE_GROUPS.OWNER_PM_QS),
  async (req: Request, res: Response) => {
    const b = req.body ?? {};
    if (!b.level || !b.name) {
      res.status(400).json({ error: "level and name required" });
      return;
    }
    const [est] = await db
      .insert(estimatesTable)
      .values({
        projectId: req.params.projectId,
        level: b.level,
        name: b.name,
        notes: b.notes ?? null,
        metadata: b.metadata ?? null,
        totalAmount: b.totalAmount !== undefined ? String(b.totalAmount) : "0",
        createdById: req.user!.id,
      })
      .returning();

    if (b.level === "L1" && !b.skipDefaultHeads) {
      const total = n(est.totalAmount);
      await db.insert(estimateCostHeadsTable).values(
        DEFAULT_L1_HEADS.map((h) => ({
          estimateId: est.id,
          headCode: h.code,
          headName: h.name,
          percentage: String(h.pct),
          amount: String((total * h.pct) / 100),
          sortOrder: h.sort,
        })),
      );
    }
    res.status(201).json(serializeEstimate(est));
  },
);

router.get(
  "/estimates/:estimateId",
  requireAuth,
  async (req: Request, res: Response) => {
    const [est] = await db
      .select()
      .from(estimatesTable)
      .where(eq(estimatesTable.id, req.params.estimateId));
    if (!est) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeEstimate(est));
  },
);

router.patch(
  "/estimates/:estimateId",
  requireAuth,
  requireRole(...ROLE_GROUPS.OWNER_PM_QS),
  async (req: Request, res: Response) => {
    const b = req.body ?? {};
    const update: Record<string, unknown> = {};
    if (b.name !== undefined) update.name = b.name;
    if (b.notes !== undefined) update.notes = b.notes;
    if (b.status !== undefined) update.status = b.status;
    if (b.totalAmount !== undefined) update.totalAmount = String(b.totalAmount);
    if (b.metadata !== undefined) update.metadata = b.metadata;
    if (b.status === "approved") {
      update.approvedById = req.user!.id;
      update.approvedAt = new Date();
    }
    const [est] = await db
      .update(estimatesTable)
      .set(update as any)
      .where(eq(estimatesTable.id, req.params.estimateId))
      .returning();
    if (!est) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeEstimate(est));
  },
);

router.delete(
  "/estimates/:estimateId",
  requireAuth,
  requireRole(...ROLE_GROUPS.OWNER_PM),
  async (req: Request, res: Response) => {
    await db.delete(estimatesTable).where(eq(estimatesTable.id, req.params.estimateId));
    res.status(204).end();
  },
);

// ── Cost Heads (L1) ────────────────────────────────────────────

router.get(
  "/estimates/:estimateId/cost-heads",
  requireAuth,
  async (req: Request, res: Response) => {
    const heads = await db
      .select()
      .from(estimateCostHeadsTable)
      .where(eq(estimateCostHeadsTable.estimateId, req.params.estimateId))
      .orderBy(asc(estimateCostHeadsTable.sortOrder));
    res.json(heads.map(serializeCostHead));
  },
);

router.put(
  "/estimates/:estimateId/cost-heads",
  requireAuth,
  requireRole(...ROLE_GROUPS.OWNER_PM_QS),
  async (req: Request, res: Response) => {
    const heads: any[] = Array.isArray(req.body) ? req.body : [];
    await db.transaction(async (tx) => {
      await tx.delete(estimateCostHeadsTable).where(eq(estimateCostHeadsTable.estimateId, req.params.estimateId));
      if (heads.length) {
        await tx.insert(estimateCostHeadsTable).values(
          heads.map((h, i) => ({
            estimateId: req.params.estimateId,
            headCode: h.headCode,
            headName: h.headName,
            percentage: String(h.percentage ?? 0),
            amount: String(h.amount ?? 0),
            sortOrder: i,
          })),
        );
      }
      const total = heads.reduce((s, h) => s + n(h.amount), 0);
      await tx
        .update(estimatesTable)
        .set({ totalAmount: String(total) })
        .where(eq(estimatesTable.id, req.params.estimateId));
    });
    const result = await db
      .select()
      .from(estimateCostHeadsTable)
      .where(eq(estimateCostHeadsTable.estimateId, req.params.estimateId))
      .orderBy(asc(estimateCostHeadsTable.sortOrder));
    res.json(result.map(serializeCostHead));
  },
);

// ── BOQ Items (L2 / L3) ────────────────────────────────────────

router.get(
  "/estimates/:estimateId/boq-items",
  requireAuth,
  async (req: Request, res: Response) => {
    const items = await db
      .select()
      .from(boqItemsTable)
      .where(eq(boqItemsTable.estimateId, req.params.estimateId))
      .orderBy(asc(boqItemsTable.sortOrder));
    res.json(items.map(serializeBoqItem));
  },
);

router.post(
  "/estimates/:estimateId/boq-items",
  requireAuth,
  requireRole(...ROLE_GROUPS.OWNER_PM_QS),
  async (req: Request, res: Response) => {
    const b = req.body ?? {};
    if (!b.description || !b.unit || !b.trade) {
      res.status(400).json({ error: "description, unit, trade required" });
      return;
    }
    const [est] = await db.select({ projectId: estimatesTable.projectId, locked: estimatesTable.status })
      .from(estimatesTable).where(eq(estimatesTable.id, req.params.estimateId));
    if (!est) { res.status(404).json({ error: "Estimate not found" }); return; }
    if (est.locked === "locked") { res.status(409).json({ error: "Estimate is locked" }); return; }
    const qty = n(b.quantity ?? 0);
    const rate = n(b.rate ?? 0);
    const [item] = await db.insert(boqItemsTable).values({
      estimateId: req.params.estimateId,
      projectId: est.projectId,
      wbsActivityId: b.wbsActivityId ?? null,
      dsrRateId: b.dsrRateId ?? null,
      levelType: b.levelType ?? "L3",
      trade: b.trade,
      itemCode: b.itemCode ?? null,
      description: b.description,
      unit: b.unit,
      quantity: String(qty),
      rate: String(rate),
      amount: String(qty * rate),
      actualQuantity: String(n(b.actualQuantity ?? 0)),
      actualAmount: String(n(b.actualAmount ?? 0)),
      hsnCode: b.hsnCode ?? null,
      gstRate: String(n(b.gstRate ?? 18)),
      sortOrder: b.sortOrder ?? 0,
    }).returning();
    res.status(201).json(serializeBoqItem(item));
  },
);

router.patch(
  "/boq-items/:itemId",
  requireAuth,
  requireRole(...ROLE_GROUPS.OWNER_PM_QS),
  async (req: Request, res: Response) => {
    const b = req.body ?? {};
    const [existing] = await db.select().from(boqItemsTable).where(eq(boqItemsTable.id, req.params.itemId));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.locked && !b.unlockRequested) {
      res.status(409).json({ error: "BOQ item is locked — raise a VO to modify" });
      return;
    }
    const update: Record<string, unknown> = {};
    for (const k of ["description", "unit", "trade", "itemCode", "hsnCode", "levelType", "wbsActivityId", "dsrRateId"]) {
      if (b[k] !== undefined) update[k] = b[k];
    }
    if (b.quantity !== undefined || b.rate !== undefined) {
      const qty = n(b.quantity ?? existing.quantity);
      const rate = n(b.rate ?? existing.rate);
      update.quantity = String(qty);
      update.rate = String(rate);
      update.amount = String(qty * rate);
    }
    if (b.actualQuantity !== undefined || b.actualAmount !== undefined) {
      update.actualQuantity = String(n(b.actualQuantity ?? existing.actualQuantity));
      update.actualAmount = String(n(b.actualAmount ?? existing.actualAmount));
    }
    if (b.gstRate !== undefined) update.gstRate = String(n(b.gstRate));
    if (b.locked !== undefined) update.locked = b.locked;
    const [item] = await db.update(boqItemsTable).set(update as any).where(eq(boqItemsTable.id, req.params.itemId)).returning();
    res.json(serializeBoqItem(item));
  },
);

router.delete(
  "/boq-items/:itemId",
  requireAuth,
  requireRole(...ROLE_GROUPS.OWNER_PM_QS),
  async (req: Request, res: Response) => {
    const [item] = await db.select({ locked: boqItemsTable.locked }).from(boqItemsTable).where(eq(boqItemsTable.id, req.params.itemId));
    if (item?.locked) { res.status(409).json({ error: "Cannot delete locked BOQ item" }); return; }
    await db.delete(boqItemsTable).where(eq(boqItemsTable.id, req.params.itemId));
    res.status(204).end();
  },
);

// ── BOQ vs Actual comparison ───────────────────────────────────

router.get(
  "/projects/:projectId/boq-vs-actual",
  requireAuth,
  async (req: Request, res: Response) => {
    const items = await db
      .select()
      .from(boqItemsTable)
      .where(and(eq(boqItemsTable.projectId, req.params.projectId), eq(boqItemsTable.levelType, "L3")))
      .orderBy(asc(boqItemsTable.trade), asc(boqItemsTable.sortOrder));

    const result = items.map((i) => {
      const boqRate = n(i.rate);
      const actualRate = n(i.actualQuantity) > 0 ? n(i.actualAmount) / n(i.actualQuantity) : 0;
      const variancePct = boqRate > 0 ? ((actualRate - boqRate) / boqRate) * 100 : 0;
      const alert = Math.abs(variancePct) > 10 ? "red" : Math.abs(variancePct) > 5 ? "amber" : "green";
      return {
        ...serializeBoqItem(i),
        actualRate,
        variancePct: parseFloat(variancePct.toFixed(2)),
        alert,
      };
    });
    const counts = { green: 0, amber: 0, red: 0 };
    for (const r of result) counts[r.alert as keyof typeof counts]++;
    res.json({ items: result, counts });
  },
);

// ── Rate Analysis (L4) ─────────────────────────────────────────

router.get(
  "/boq-items/:itemId/rate-analysis",
  requireAuth,
  async (req: Request, res: Response) => {
    const components = await db
      .select()
      .from(rateAnalysisComponentsTable)
      .where(eq(rateAnalysisComponentsTable.boqItemId, req.params.itemId))
      .orderBy(asc(rateAnalysisComponentsTable.sortOrder));
    res.json(components.map(serializeRaComponent));
  },
);

router.put(
  "/boq-items/:itemId/rate-analysis",
  requireAuth,
  requireRole(...ROLE_GROUPS.OWNER_PM_QS),
  async (req: Request, res: Response) => {
    const components: any[] = Array.isArray(req.body) ? req.body : [];
    await db.transaction(async (tx) => {
      await tx.delete(rateAnalysisComponentsTable).where(eq(rateAnalysisComponentsTable.boqItemId, req.params.itemId));
      if (components.length) {
        await tx.insert(rateAnalysisComponentsTable).values(
          components.map((c, i) => ({
            boqItemId: req.params.itemId,
            componentType: c.componentType,
            description: c.description,
            unit: c.unit,
            quantity: String(n(c.quantity)),
            marketRate: String(n(c.marketRate)),
            dsrRate: String(n(c.dsrRate)),
            amount: String(n(c.quantity) * n(c.marketRate)),
            sortOrder: i,
          })),
        );
      }
    });
    const result = await db
      .select()
      .from(rateAnalysisComponentsTable)
      .where(eq(rateAnalysisComponentsTable.boqItemId, req.params.itemId))
      .orderBy(asc(rateAnalysisComponentsTable.sortOrder));
    res.json(result.map(serializeRaComponent));
  },
);

export default router;
