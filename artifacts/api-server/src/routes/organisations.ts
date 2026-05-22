import { Router, type IRouter, type Request, type Response } from "express";
import { db, organisationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, ROLE_GROUPS, loadRole } from "../middlewares/requireAuth";
import { serializeOrg, serializeOrgPublic } from "../lib/serialize";

const router: IRouter = Router();

const ORG_FIELDS = ["name", "legalName", "gstin", "pan", "address", "city", "state", "pincode", "logoUrl"] as const;

function parseOrgBody(b: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of ORG_FIELDS) {
    if (b[k] !== undefined) out[k] = b[k];
  }
  return out;
}

async function isAdmin(req: Request): Promise<boolean> {
  const role = req.userRole ?? (await loadRole(req.user!.id));
  req.userRole = role ?? undefined;
  return role === "admin";
}

router.get("/organisations", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.select().from(organisationsTable);
  const admin = await isAdmin(req);
  res.json(rows.map(admin ? serializeOrg : serializeOrgPublic));
});

router.post("/organisations", requireAuth, requireRole(...ROLE_GROUPS.ADMIN), async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.name || typeof b.name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [row] = await db
    .insert(organisationsTable)
    .values(parseOrgBody(b) as any)
    .returning();
  res.status(201).json(serializeOrg(row));
});

router.get("/organisations/:organisationId", requireAuth, async (req: Request, res: Response) => {
  const [row] = await db
    .select()
    .from(organisationsTable)
    .where(eq(organisationsTable.id, req.params.organisationId));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const admin = await isAdmin(req);
  res.json((admin ? serializeOrg : serializeOrgPublic)(row));
});

router.patch(
  "/organisations/:organisationId",
  requireAuth,
  requireRole(...ROLE_GROUPS.ADMIN),
  async (req: Request, res: Response) => {
    const update = parseOrgBody(req.body ?? {});
    if (!Object.keys(update).length) {
      const [row] = await db
        .select()
        .from(organisationsTable)
        .where(eq(organisationsTable.id, req.params.organisationId));
      if (!row) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      res.json(serializeOrg(row));
      return;
    }
    const [row] = await db
      .update(organisationsTable)
      .set(update as any)
      .where(eq(organisationsTable.id, req.params.organisationId))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(serializeOrg(row));
  },
);

export default router;
