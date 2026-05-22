import { Router, type IRouter, type Request, type Response } from "express";
import { db, organisationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { serializeOrg } from "../lib/serialize";

const router: IRouter = Router();

router.get("/organisations", requireAuth, async (_req, res: Response) => {
  const rows = await db.select().from(organisationsTable);
  res.json(rows.map(serializeOrg));
});

router.post("/organisations", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.name || typeof b.name !== "string") {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [row] = await db
    .insert(organisationsTable)
    .values({
      name: b.name,
      legalName: b.legalName,
      gstin: b.gstin,
      pan: b.pan,
      address: b.address,
      city: b.city,
      state: b.state,
      pincode: b.pincode,
      logoUrl: b.logoUrl,
    })
    .returning();
  res.status(201).json(serializeOrg(row));
});

export default router;
