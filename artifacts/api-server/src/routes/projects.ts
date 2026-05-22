import { Router, type IRouter, type Request, type Response } from "express";
import { db, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { serializeProject } from "../lib/serialize";

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

router.get("/projects", requireAuth, async (_req, res: Response) => {
  const rows = await db.select().from(projectsTable);
  res.json(rows.map(serializeProject));
});

router.post("/projects", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.organisationId || !b.code || !b.name) {
    res.status(400).json({ error: "organisationId, code, name required" });
    return;
  }
  const [row] = await db
    .insert(projectsTable)
    .values(parseProjectBody(b) as any)
    .returning();
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

router.patch("/projects/:projectId", requireAuth, async (req: Request, res: Response) => {
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

router.delete("/projects/:projectId", requireAuth, async (req: Request, res: Response) => {
  await db.delete(projectsTable).where(eq(projectsTable.id, req.params.projectId));
  res.status(204).end();
});

export default router;
