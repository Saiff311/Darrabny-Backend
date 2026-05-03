import { Router } from "express";
import * as PS from "./placement.service.js";
import * as PV from "./placement.validation.js";
import { validation } from "../../middleware/validation.js";
import { auth } from "../../middleware/auth.js";
import { roles } from "../../utils/enums.js";

const placementRouter = Router();

// ------------------get internship students------------------
placementRouter.get(
  "/internship/:internshipId/students",
  auth(Object.values(roles)),
  validation(PV.internshipIdSchema),
  PS.getInternshipStudents,
);

// ------------------company completed analytics------------------
placementRouter.get(
  "/analytics/completed",
  auth([roles.company]),
  PS.getCompanyCompletedInternshipsAnalytics,
);

// ------------------get progress------------------
placementRouter.get(
  "/:id/progress",
  auth(Object.values(roles)),
  validation(PV.placementIdSchema),
  PS.getPlacementProgress,
);
// ------------------get details------------------
placementRouter.get(
  "/:id",
  auth(Object.values(roles)),
  validation(PV.placementIdSchema),
  PS.getPlacementDetails,
);

// ------------------complete placement------------------
placementRouter.patch(
  "/:id/complete",
  auth([roles.company]),
  validation(PV.completePlacementSchema),
  PS.completePlacement,
);

export default placementRouter;
