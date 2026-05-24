import { Router, type IRouter, type Request, type Response } from "express";
import { db, approvalsTable, projectsTable, usersTable } from "@workspace/db";
import { and, eq, desc, inArray } from "drizzle-orm";
import { requireAuth, requireRole, ROLE_GROUPS } from "../middlewares/requireAuth";
import { dReq, d } from "../lib/serialize";
import { getAccessCtx, getAccessibleProjectIds, PROJECT_ACCESS_BYPASS_ROLES } from "../lib/access";

const router: IRouter = Router();

function serializeApproval(a: any, projectName: string | null, requesterName: string | null) {
  const createdAt = a.createdAt ? new Date(a.createdAt) : new Date();
  const ageDays = Math.max(
    0,
    Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)),
  );
  return {
    id: a.id,
    projectId: a.projectId ?? null,
    projectName,
    entityType: a.entityType,
    entityId: a.entityId,
    title: a.title,
    requestedById: a.requestedById ?? null,
    requestedByName: requesterName,
    assignedToRole: a.assignedToRole,
    status: a.status,
    createdAt: dReq(a.createdAt),
    resolvedAt: d(a.resolvedAt),
    ageDays,
  };
}

router.get("/approvals", requireAuth, async (req: Request, res: Response) => {
  // Scope:
  //   - admin/owner: every pending approval in projects they can see.
  //   - other roles: only pending approvals targeting their role, in projects they're assigned to.
  // This makes /approvals a per-user inbox safe to poll from the header bell.
  const ctx = await getAccessCtx(req);
  const accessibleIds = await getAccessibleProjectIds(ctx);
  const isBypass = !!ctx.role && PROJECT_ACCESS_BYPASS_ROLES.has(ctx.role);

  // Empty access set → return empty list immediately (avoids inArray with no values).
  if (accessibleIds.length === 0) {
    res.json([]);
    return;
  }

  const whereParts = [
    eq(approvalsTable.status, "pending"),
    inArray(approvalsTable.projectId, accessibleIds),
  ];
  if (!isBypass && ctx.role) {
    whereParts.push(eq(approvalsTable.assignedToRole, ctx.role));
  }

  const rows = await db
    .select({
      a: approvalsTable,
      projectName: projectsTable.name,
      requesterFirst: usersTable.firstName,
      requesterLast: usersTable.lastName,
      requesterEmail: usersTable.email,
    })
    .from(approvalsTable)
    .leftJoin(projectsTable, eq(approvalsTable.projectId, projectsTable.id))
    .leftJoin(usersTable, eq(approvalsTable.requestedById, usersTable.id))
    .where(and(...whereParts))
    .orderBy(desc(approvalsTable.createdAt));
  res.json(
    rows.map((r) =>
      serializeApproval(
        r.a,
        r.projectName ?? null,
        [r.requesterFirst, r.requesterLast].filter(Boolean).join(" ") ||
          r.requesterEmail ||
          null,
      ),
    ),
  );
});

router.post(
  "/approvals/:approvalId/resolve",
  requireAuth,
  requireRole(...ROLE_GROUPS.OWNER_PM_FINANCE),
  async (req: Request, res: Response) => {
    const b = req.body ?? {};
    if (b.decision !== "approved" && b.decision !== "rejected") {
      res.status(400).json({ error: "decision must be approved|rejected" });
      return;
    }
    const [row] = await db
      .update(approvalsTable)
      .set({ status: b.decision, resolvedAt: new Date() })
      .where(eq(approvalsTable.id, req.params.approvalId))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    let projectName: string | null = null;
    if (row.projectId) {
      const [p] = await db
        .select({ name: projectsTable.name })
        .from(projectsTable)
        .where(eq(projectsTable.id, row.projectId));
      projectName = p?.name ?? null;
    }
    res.json(serializeApproval(row, projectName, null));
  },
);

export default router;
