import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import themesRouter from "./themes";
import lotsRouter from "./lots";
import bidsRouter from "./bids";
import stickersRouter from "./stickers";
import newsRouter from "./news";
import activityRouter from "./activity";
import adminRouter from "./admin";
import cartRouter from "./cart";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(themesRouter);
router.use(lotsRouter);
router.use(bidsRouter);
router.use(stickersRouter);
router.use(newsRouter);
router.use(activityRouter);
router.use(adminRouter);
router.use(cartRouter);
router.use(profileRouter);

export default router;
