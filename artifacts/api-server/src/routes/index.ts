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

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(meRouter);
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

export default router;
