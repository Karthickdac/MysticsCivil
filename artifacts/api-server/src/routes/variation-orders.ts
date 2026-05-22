import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  variationOrdersTable,
  approvalsTable,
  projectsTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, requireRole, ROLE_GROUPS } from "../middlewares/requireAuth";
import { n, d, dReq } from "../lib/serialize";

const router: IRouter = Router();

function serializeVo(v: any) {
  return {
    id: v.id,
    projectId: v.projectId,
    estimateId: v.estimateId ?? null,
    voNumber: v.voNumber,
    title: v.title,
    description: v.description ?? null,
    scopeChange: v.scopeChange ?? null,
    costImpact: n(v.costImpact),
    programmeImpactDays: v.programmeImpactDays ?? 0,
    status: v.status,
    raisedById: v.raisedById ?? null,
    approvedById: v.approvedById ?? null,
    createdAt: dReq(v.createdAt),
    approvedAt: d(v.approvedAt),
  };
}

router.get(
  "/projects/:projectId/variation-orders",
  requireAuth,
  async (req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(variationOrdersTable)
      .where(eq(variationOrdersTable.projectId, req.params.projectId))
      .orderBy(desc(variationOrdersTable.createdAt));
    res.json(rows.map(serializeVo));
  },
);

router.post(
  "/projects/:projectId/variation-orders",
  requireAuth,
  requireRole(...ROLE_GROUPS.OWNER_PM_QS),
  async (req: Request, res: Response) => {
    const b = req.body ?? {};
    if (!b.title) {
      res.status(400).json({ error: "title required" });
      return;
    }
    const count = await db
      .select({ count: variationOrdersTable.id })
      .from(variationOrdersTable)
      .where(eq(variationOrdersTable.projectId, req.params.projectId));
    const voNumber = `VO-${String(count.length + 1).padStart(3, "0")}`;
    const [vo] = await db.insert(variationOrdersTable).values({
      projectId: req.params.projectId,
      estimateId: b.estimateId ?? null,
      voNumber,
      title: b.title,
      description: b.description ?? null,
      scopeChange: b.scopeChange ?? null,
      costImpact: String(n(b.costImpact ?? 0)),
      programmeImpactDays: b.programmeImpactDays ?? 0,
      status: "draft",
      raisedById: req.user!.id,
    }).returning();

    await db.insert(approvalsTable).values({
      projectId: req.params.projectId,
      entityType: "variation_order",
      entityId: vo.id,
      title: `${voNumber}: ${b.title}`,
      assignedToRole: "owner",
      status: "pending",
      requestedById: req.user!.id,
    });

    res.status(201).json(serializeVo(vo));
  },
);

router.get(
  "/variation-orders/:voId",
  requireAuth,
  async (req: Request, res: Response) => {
    const [vo] = await db.select().from(variationOrdersTable).where(eq(variationOrdersTable.id, req.params.voId));
    if (!vo) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeVo(vo));
  },
);

router.patch(
  "/variation-orders/:voId",
  requireAuth,
  requireRole(...ROLE_GROUPS.OWNER_PM_QS),
  async (req: Request, res: Response) => {
    const b = req.body ?? {};
    const update: Record<string, unknown> = {};
    for (const k of ["title", "description", "scopeChange", "estimateId"]) {
      if (b[k] !== undefined) update[k] = b[k];
    }
    if (b.costImpact !== undefined) update.costImpact = String(n(b.costImpact));
    if (b.programmeImpactDays !== undefined) update.programmeImpactDays = b.programmeImpactDays;
    if (b.status !== undefined) {
      update.status = b.status;
      if (b.status === "approved") {
        update.approvedById = req.user!.id;
        update.approvedAt = new Date();
        await db.update(approvalsTable)
          .set({ status: "approved", resolvedAt: new Date() })
          .where(and(eq(approvalsTable.entityId, req.params.voId), eq(approvalsTable.entityType, "variation_order")));
      }
    }
    const [vo] = await db.update(variationOrdersTable).set(update as any).where(eq(variationOrdersTable.id, req.params.voId)).returning();
    if (!vo) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeVo(vo));
  },
);

export default router;
