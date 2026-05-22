import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  projectsTable,
  wbsActivitiesTable,
  milestonesTable,
  sitePhotosTable,
  approvalsTable,
  dprsTable,
  usersTable,
  userProfilesTable,
  jsaEntriesTable,
  qualityTestsTable,
} from "@workspace/db";
import { eq, desc, and, gt, gte, asc, sql, inArray, or } from "drizzle-orm";
import { requireAuth, loadRole } from "../middlewares/requireAuth";
import {
  serializeProject,
  serializeMilestone,
  serializePhoto,
  n,
  dReq,
} from "../lib/serialize";

const router: IRouter = Router();

router.get("/dashboard/portfolio", requireAuth, async (_req, res: Response) => {
  const projects = await db.select().from(projectsTable);
  const pending = await db
    .select({ id: approvalsTable.id })
    .from(approvalsTable)
    .where(eq(approvalsTable.status, "pending"));

  let totalContractValue = 0;
  let totalCostToDate = 0;
  let totalBudgetToDate = 0;
  let weightedCpiNumer = 0;
  let weightedCpiDenom = 0;
  const counts = { not_started: 0, on_track: 0, at_risk: 0, delayed: 0, on_hold: 0, completed: 0 };

  for (const p of projects) {
    const cv = n(p.contractValue);
    const cost = n(p.costToDate);
    const bud = n(p.budgetToDate);
    const cpi = n(p.cpi);
    totalContractValue += cv;
    totalCostToDate += cost;
    totalBudgetToDate += bud;
    if (cv > 0) {
      weightedCpiNumer += cpi * cv;
      weightedCpiDenom += cv;
    }
    const s = (p.status as keyof typeof counts) ?? "not_started";
    if (counts[s] !== undefined) counts[s]++;
  }

  res.json({
    kpi: {
      totalProjects: projects.length,
      onTrack: counts.on_track,
      atRisk: counts.at_risk,
      delayed: counts.delayed,
      completed: counts.completed,
      pendingApprovals: pending.length,
      totalContractValue,
      totalCostToDate,
      totalBudgetToDate,
      weightedCpi: weightedCpiDenom > 0 ? weightedCpiNumer / weightedCpiDenom : 1,
    },
    projects: projects.map(serializeProject),
  });
});

router.get("/dashboard/activity-feed", requireAuth, async (_req, res: Response) => {
  const dprs = await db
    .select({
      id: dprsTable.id,
      projectId: dprsTable.projectId,
      projectName: projectsTable.name,
      reportDate: dprsTable.reportDate,
      status: dprsTable.status,
      submittedAt: dprsTable.submittedAt,
      createdAt: dprsTable.createdAt,
      actorFirst: usersTable.firstName,
      actorLast: usersTable.lastName,
      actorEmail: usersTable.email,
    })
    .from(dprsTable)
    .leftJoin(projectsTable, eq(dprsTable.projectId, projectsTable.id))
    .leftJoin(usersTable, eq(dprsTable.submittedById, usersTable.id))
    .orderBy(desc(dprsTable.createdAt))
    .limit(15);

  const photos = await db
    .select({
      id: sitePhotosTable.id,
      projectId: sitePhotosTable.projectId,
      projectName: projectsTable.name,
      caption: sitePhotosTable.caption,
      capturedAt: sitePhotosTable.capturedAt,
      actorFirst: usersTable.firstName,
      actorLast: usersTable.lastName,
      actorEmail: usersTable.email,
    })
    .from(sitePhotosTable)
    .leftJoin(projectsTable, eq(sitePhotosTable.projectId, projectsTable.id))
    .leftJoin(usersTable, eq(sitePhotosTable.uploadedById, usersTable.id))
    .orderBy(desc(sitePhotosTable.capturedAt))
    .limit(15);

  const approvals = await db
    .select({
      id: approvalsTable.id,
      projectId: approvalsTable.projectId,
      projectName: projectsTable.name,
      title: approvalsTable.title,
      status: approvalsTable.status,
      createdAt: approvalsTable.createdAt,
      resolvedAt: approvalsTable.resolvedAt,
    })
    .from(approvalsTable)
    .leftJoin(projectsTable, eq(approvalsTable.projectId, projectsTable.id))
    .orderBy(desc(approvalsTable.createdAt))
    .limit(15);

  const actorName = (f?: string | null, l?: string | null, e?: string | null) =>
    [f, l].filter(Boolean).join(" ") || e || null;

  const items = [
    ...dprs.map((r) => ({
      id: `dpr-${r.id}`,
      kind: r.status === "submitted" ? "dpr_submitted" : "dpr_created",
      projectId: r.projectId,
      projectName: r.projectName ?? null,
      title: `DPR for ${new Date(r.reportDate).toISOString().slice(0, 10)} ${r.status}`,
      actorName: actorName(r.actorFirst, r.actorLast, r.actorEmail),
      occurredAt: dReq(r.submittedAt ?? r.createdAt),
    })),
    ...photos.map((r) => ({
      id: `photo-${r.id}`,
      kind: "photo_uploaded",
      projectId: r.projectId,
      projectName: r.projectName ?? null,
      title: r.caption || "Site photo uploaded",
      actorName: actorName(r.actorFirst, r.actorLast, r.actorEmail),
      occurredAt: dReq(r.capturedAt),
    })),
    ...approvals.map((r) => ({
      id: `approval-${r.id}`,
      kind: `approval_${r.status}`,
      projectId: r.projectId ?? null,
      projectName: r.projectName ?? null,
      title: r.title,
      actorName: null,
      occurredAt: dReq(r.resolvedAt ?? r.createdAt),
    })),
  ]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 25);

  res.json(items);
});

router.get(
  "/projects/:projectId/dashboard",
  requireAuth,
  async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId));
    if (!project) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const activities = await db
      .select()
      .from(wbsActivitiesTable)
      .where(eq(wbsActivitiesTable.projectId, projectId))
      .orderBy(asc(wbsActivitiesTable.sortOrder), asc(wbsActivitiesTable.code));

    const counts = {
      not_started: 0,
      on_track: 0,
      at_risk: 0,
      delayed: 0,
      on_hold: 0,
      completed: 0,
    };
    for (const a of activities) {
      const s = (a.status as keyof typeof counts) ?? "not_started";
      if (counts[s] !== undefined) counts[s]++;
    }

    const recentPhotos = await db
      .select()
      .from(sitePhotosTable)
      .where(eq(sitePhotosTable.projectId, projectId))
      .orderBy(desc(sitePhotosTable.capturedAt))
      .limit(6);

    const pendingApprovals = await db
      .select()
      .from(approvalsTable)
      .where(
        and(eq(approvalsTable.projectId, projectId), eq(approvalsTable.status, "pending")),
      )
      .orderBy(asc(approvalsTable.createdAt))
      .limit(10);

    const now = Date.now();
    const pendingActions = pendingApprovals.map((a) => {
      const ageDays = Math.max(
        0,
        Math.floor((now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      );
      return {
        id: a.id,
        kind: a.entityType,
        title: a.title,
        ageDays,
        severity: ageDays > 3 ? "high" : ageDays > 1 ? "medium" : "low",
      };
    });

    const [nextMs] = await db
      .select()
      .from(milestonesTable)
      .where(
        and(
          eq(milestonesTable.projectId, projectId),
          gt(milestonesTable.targetDate, new Date()),
        ),
      )
      .orderBy(asc(milestonesTable.targetDate))
      .limit(1);

    const plannedPercent = n(project.plannedPercent);
    const actualPercent = n(project.actualPercent);
    const contractValue = n(project.contractValue);
    const costToDate = n(project.costToDate);
    const budgetToDate = n(project.budgetToDate);
    const cpi = n(project.cpi);

    res.json({
      project: serializeProject(project),
      health: {
        plannedPercent,
        actualPercent,
        variancePercent: actualPercent - plannedPercent,
        status: project.status,
      },
      cost: {
        budgetToDate,
        costToDate,
        contractValue,
        cpi,
        overrunPercent: budgetToDate > 0 ? ((costToDate - budgetToDate) / budgetToDate) * 100 : 0,
      },
      miniGantt: activities.slice(0, 8).map((a) => ({
        activityId: a.id,
        code: a.code,
        name: a.name,
        plannedStart: a.plannedStart ? new Date(a.plannedStart).toISOString() : null,
        plannedEnd: a.plannedEnd ? new Date(a.plannedEnd).toISOString() : null,
        actualStart: a.actualStart ? new Date(a.actualStart).toISOString() : null,
        actualEnd: a.actualEnd ? new Date(a.actualEnd).toISOString() : null,
        plannedPercent: n(a.plannedPercent),
        actualPercent: n(a.actualPercent),
        status: a.status,
      })),
      activityStatusCounts: counts,
      recentPhotos: recentPhotos.map(serializePhoto),
      pendingActions,
      nextMilestone: nextMs ? serializeMilestone(nextMs) : null,
    });

    void sql;
  },
);

router.get("/dashboard/safety-trends", requireAuth, async (req: Request, res: Response) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const overdueCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Org-scope: explicitly resolve role + org from user_profiles (do not trust req.userRole,
  // which is only populated by requireRole, not requireAuth). Non-admins MUST have an org.
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthenticated" }); return; }
  const [profile] = await db.select({
    role: userProfilesTable.role,
    organisationId: userProfilesTable.organisationId,
  }).from(userProfilesTable).where(eq(userProfilesTable.userId, userId));
  const role = profile?.role ?? (await loadRole(userId));
  const isAdmin = role === "admin";
  if (!isAdmin && !profile?.organisationId) {
    res.status(403).json({ error: "Forbidden — no organisation" });
    return;
  }
  const projects = isAdmin
    ? await db.select({ id: projectsTable.id, name: projectsTable.name }).from(projectsTable)
    : await db.select({ id: projectsTable.id, name: projectsTable.name })
        .from(projectsTable).where(eq(projectsTable.organisationId, profile!.organisationId!));
  const projectIds = projects.map((p) => p.id);
  const projectName = new Map(projects.map((p) => [p.id, p.name]));

  const empty = {
    jsaMonth: { approved: 0, draft: 0, draftOverdue24h: 0, monthStart: monthStart.toISOString() },
    qcLast30: { pass: 0, fail: 0, total: 0, passRate: 1 },
    weeklyPassRate: [] as Array<{ weekStart: string; pass: number; total: number; rate: number }>,
    perProject: [] as Array<{ projectId: string; projectName: string; draftOverdue: number; passRate30: number; totalTests30: number }>,
  };
  if (projectIds.length === 0) { res.json(empty); return; }

  const jsas = await db
    .select({
      id: jsaEntriesTable.id,
      projectId: jsaEntriesTable.projectId,
      status: jsaEntriesTable.status,
      createdAt: jsaEntriesTable.createdAt,
    })
    .from(jsaEntriesTable)
    .where(and(inArray(jsaEntriesTable.projectId, projectIds), gte(jsaEntriesTable.createdAt, monthStart)));

  let approvedM = 0, draftM = 0, draftOverdueM = 0;
  const overduePerProject = new Map<string, number>();
  for (const j of jsas) {
    if (j.status === "approved") approvedM++;
    else if (j.status === "draft") {
      draftM++;
      if (j.createdAt && new Date(j.createdAt) < overdueCutoff) {
        draftOverdueM++;
        overduePerProject.set(j.projectId, (overduePerProject.get(j.projectId) ?? 0) + 1);
      }
    }
  }

  // Pre-filter on createdAt OR testDate to capture late-entered tests with old testDates,
  // then bucket by effective date (testDate ?? createdAt) to keep window semantics consistent.
  const tests = await db
    .select({
      projectId: qualityTestsTable.projectId,
      passed: qualityTestsTable.passed,
      testDate: qualityTestsTable.testDate,
      createdAt: qualityTestsTable.createdAt,
    })
    .from(qualityTestsTable)
    .where(and(
      inArray(qualityTestsTable.projectId, projectIds),
      or(gte(qualityTestsTable.testDate, day30), gte(qualityTestsTable.createdAt, day30)),
    ));

  let pass30 = 0, fail30 = 0;
  const perProjectQc = new Map<string, { pass: number; total: number }>();
  // 5 weekly buckets (oldest -> newest), each 6 days wide → covers full 30-day window.
  const BUCKETS = 5;
  const BUCKET_DAYS = 6;
  const weekStarts: Date[] = [];
  for (let i = BUCKETS - 1; i >= 0; i--) {
    weekStarts.push(new Date(now.getTime() - (i + 1) * BUCKET_DAYS * 24 * 60 * 60 * 1000));
  }
  const weekly = weekStarts.map((ws) => ({ weekStart: ws.toISOString(), pass: 0, total: 0, rate: 1 }));

  for (const t of tests) {
    if (t.passed === null || t.passed === undefined) continue;
    const effective = t.testDate ? new Date(t.testDate) : new Date(t.createdAt);
    if (effective < day30) continue; // strict 30-day window on effective date
    const finalised = t.passed === true;
    if (finalised) pass30++; else fail30++;
    const pp = perProjectQc.get(t.projectId) ?? { pass: 0, total: 0 };
    pp.total++;
    if (finalised) pp.pass++;
    perProjectQc.set(t.projectId, pp);
    for (let i = weekStarts.length - 1; i >= 0; i--) {
      if (effective >= weekStarts[i]) {
        weekly[i].total++;
        if (finalised) weekly[i].pass++;
        break;
      }
    }
  }
  for (const w of weekly) w.rate = w.total > 0 ? w.pass / w.total : 1;

  const total30 = pass30 + fail30;

  const concerningIds = new Set<string>([...overduePerProject.keys(), ...perProjectQc.keys()]);
  const perProject = [...concerningIds]
    .map((pid) => {
      const qc = perProjectQc.get(pid) ?? { pass: 0, total: 0 };
      return {
        projectId: pid,
        projectName: projectName.get(pid) ?? "—",
        draftOverdue: overduePerProject.get(pid) ?? 0,
        passRate30: qc.total > 0 ? qc.pass / qc.total : 1,
        totalTests30: qc.total,
      };
    })
    .sort((a, b) => {
      // worst first: most overdue, then lowest pass rate (only when there are tests)
      if (b.draftOverdue !== a.draftOverdue) return b.draftOverdue - a.draftOverdue;
      const ar = a.totalTests30 > 0 ? a.passRate30 : 2;
      const br = b.totalTests30 > 0 ? b.passRate30 : 2;
      return ar - br;
    })
    .slice(0, 5);

  res.json({
    jsaMonth: { approved: approvedM, draft: draftM, draftOverdue24h: draftOverdueM, monthStart: monthStart.toISOString() },
    qcLast30: { pass: pass30, fail: fail30, total: total30, passRate: total30 > 0 ? pass30 / total30 : 1 },
    weeklyPassRate: weekly,
    perProject,
  });
});

export default router;
