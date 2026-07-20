import { Router, type IRouter } from "express";
import healthRouter from "./health";
import docsRouter from "./docs";
import leaderboardRouter from "./leaderboard";
import eventsRouter from "./events";
import npmRouter from "./npm";

const router: IRouter = Router();

router.use(healthRouter);
router.use(docsRouter);
router.use(leaderboardRouter);
router.use(eventsRouter);
router.use(npmRouter);

export default router;
