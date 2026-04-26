import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import * as AS from "./application.service.js";
import * as AV from "./application.validation.js";
import { auth } from "../../middleware/auth.js";
import { roles } from "../../utils/enums.js";

const applicationRouter = Router();

// Update Application Status - Creates placement if accepted
applicationRouter.patch(
  "/:id/status",
//   auth([roles.admin, roles.academic_supervisor]),
  validation(AV.createPlacementSchema),
  AS.updateApplicationStatus
);

export default applicationRouter;