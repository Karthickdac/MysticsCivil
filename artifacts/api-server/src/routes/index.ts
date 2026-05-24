import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import meRouter from "./me";
import organisationsRouter from "./organisations";
import projectsRouter from "./projects";
import wbsRouter from "./wbs";
import milestonesRouter from "./milestones";
import dprsRouter from "./dprs";
import photosRouter from "./photos";
import documentsRouter from "./documents";
import issuesRouter from "./issues";
import dashboardRouter from "./dashboard";
import approvalsRouter from "./approvals";
import estimationRouter from "./estimation";
import dsrRatesRouter from "./dsr-rates";
import rateSourcesRouter from "./rate-sources";
import variationOrdersRouter from "./variation-orders";
import financialRouter from "./financial";
import supplyChainRouter from "./supply-chain";
import workforceRouter from "./workforce";
import storageRouter from "./storage";
import geocodeRouter from "./geocode";
import modulesAccessRouter from "./modules-access";
import reportsRouter from "./reports";
import adminRouter from "./admin";
import { requireProjectAccess } from "../lib/access";

const router: IRouter = Router();

// Gate every /projects/:projectId/... request (incl. GET /projects/:projectId itself).
// admin/owner bypass automatically inside requireProjectAccess via context check.
router.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  const m = req.path.match(/^\/projects\/([^/?]+)(?:\/|$)/);
  if (!m) return next();
  // POST /projects (no :projectId) is excluded by the regex.
  // Inject the captured projectId so the middleware can read it from req.params.
  (req as any).params = { ...(req.params || {}), projectId: m[1] };
  return requireProjectAccess()(req, res, next);
});

router.use(healthRouter);
router.use(authRouter);
router.use(meRouter);
router.use(adminRouter);
router.use(modulesAccessRouter);
router.use(reportsRouter);
router.use(organisationsRouter);
router.use(projectsRouter);
router.use(wbsRouter);
router.use(milestonesRouter);
router.use(dprsRouter);
router.use(photosRouter);
router.use(documentsRouter);
router.use(issuesRouter);
router.use(dashboardRouter);
router.use(approvalsRouter);
router.use(estimationRouter);
router.use(dsrRatesRouter);
router.use(rateSourcesRouter);
router.use(variationOrdersRouter);
router.use(financialRouter);
router.use(supplyChainRouter);
router.use(workforceRouter);
router.use(storageRouter);
router.use(geocodeRouter);

export default router;
