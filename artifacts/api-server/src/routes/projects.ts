import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectsTable, milestonesTable, organisationsTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import { requireAuth, requireRole, ROLE_GROUPS } from "../middlewares/requireAuth";
import { serializeProject } from "../lib/serialize";
import { getAccessCtx, getAccessibleProjectIds, PROJECT_ACCESS_BYPASS_ROLES, isSuperAdmin } from "../lib/access";

const router: IRouter = Router();

function parseProjectBody(b: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of [
    "organisationId",
    "code",
    "name",
    "clientName",
    "description",
    "location",
    "reraNumber",
    "status",
    "pmId",
    "coverImageUrl",
  ]) {
    if (b[k] !== undefined) out[k] = b[k];
  }
  for (const k of ["latitude", "longitude", "contractValue"]) {
    if (b[k] !== undefined && b[k] !== null) out[k] = String(b[k]);
  }
  for (const k of ["startDate", "targetEndDate", "forecastEndDate"]) {
    if (b[k]) out[k] = new Date(b[k]);
  }
  return out;
}

router.get("/projects", requireAuth, async (req: Request, res: Response) => {
  const ctx = await getAccessCtx(req);
  // super_admin sees every project across every org.
  if (isSuperAdmin(ctx.role)) {
    const rows = await db.select().from(projectsTable);
    res.json(rows.map(serializeProject));
    return;
  }
  // admin/owner bypass: see all in org (or all if no org)
  if (ctx.role && PROJECT_ACCESS_BYPASS_ROLES.has(ctx.role)) {
    const rows = ctx.organisationId
      ? await db.select().from(projectsTable).where(eq(projectsTable.organisationId, ctx.organisationId))
      : await db.select().from(projectsTable);
    res.json(rows.map(serializeProject));
    return;
  }
  const ids = await getAccessibleProjectIds(ctx);
  if (!ids.length) {
    res.json([]);
    return;
  }
  const rows = await db.select().from(projectsTable).where(inArray(projectsTable.id, ids));
  res.json(rows.map(serializeProject));
});

router.post("/projects", requireAuth, requireRole(...ROLE_GROUPS.OWNER_PM), async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.organisationId || !b.code || !b.name) {
    res.status(400).json({ error: "organisationId, code, name required" });
    return;
  }
  // Enforce per-org scoping + maxProjects quota (super_admin bypasses both).
  const ctx = await getAccessCtx(req);
  if (!isSuperAdmin(ctx.role)) {
    // SECURITY: non-super users can only create projects in their own org.
    if (!ctx.organisationId || String(b.organisationId) !== ctx.organisationId) {
      res.status(403).json({
        error: "You can only create projects within your own organisation.",
      });
      return;
    }
    const [org] = await db
      .select({ maxProjects: organisationsTable.maxProjects, name: organisationsTable.name })
      .from(organisationsTable)
      .where(eq(organisationsTable.id, String(b.organisationId)));
    if (!org) {
      res.status(400).json({ error: "Organisation not found" });
      return;
    }
    if (org.maxProjects != null) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(projectsTable)
        .where(eq(projectsTable.organisationId, String(b.organisationId)));
      if (Number(count) >= org.maxProjects) {
        res.status(403).json({
          error: `Project quota reached for ${org.name} (${org.maxProjects}). Ask Super Admin to raise the limit.`,
        });
        return;
      }
    }
  }
  const row = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(projectsTable)
      .values(parseProjectBody(b) as any)
      .returning();
    if (Array.isArray(b.milestones) && b.milestones.length) {
      await tx.insert(milestonesTable).values(
        b.milestones
          .filter((m: any) => m && m.name && m.targetDate)
          .map((m: any, idx: number) => ({
            projectId: created.id,
            name: String(m.name),
            description: m.description ? String(m.description) : null,
            targetDate: new Date(m.targetDate),
            status: "pending",
            sortOrder: idx,
          })),
      );
    }
    return created;
  });
  res.status(201).json(serializeProject(row));
});

router.get("/projects/:projectId", requireAuth, async (req: Request, res: Response) => {
  const [row] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, req.params.projectId));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeProject(row));
});

router.patch("/projects/:projectId", requireAuth, requireRole(...ROLE_GROUPS.OWNER_PM), async (req: Request, res: Response) => {
  const update = parseProjectBody(req.body ?? {});
  const [row] = await db
    .update(projectsTable)
    .set(update as any)
    .where(eq(projectsTable.id, req.params.projectId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeProject(row));
});

router.delete("/projects/:projectId", requireAuth, requireRole(...ROLE_GROUPS.OWNER_PM), async (req: Request, res: Response) => {
  await db.delete(projectsTable).where(eq(projectsTable.id, req.params.projectId));
  res.status(204).end();
});

export default router;
