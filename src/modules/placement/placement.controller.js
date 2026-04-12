import { Router } from "express";
import * as PS from "./placement.service.js";
import * as PV from "./placement.validation.js";
import { validation } from "../../middleware/validation.js";
import { auth } from "../../middleware/auth.js";
import { roles } from "../../utils/enums.js";

const placementRouter = Router();
// ------------------get progress------------------ 
placementRouter.get(
    "/:id/progress",
    auth(Object.values(roles)),
    validation(PV.placementIdSchema),
    PS.getPlacementProgress
)
// ------------------get details------------------
placementRouter.get(
    "/:id",
    auth(Object.values(roles)),
    validation(PV.placementIdSchema),
    PS.getPlacementDetails
)

export default placementRouter