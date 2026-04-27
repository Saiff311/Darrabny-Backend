import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import * as AS from "./application.service.js";
import * as AV from "./application.validation.js";
import { auth } from "../../middleware/auth.js";
import { roles } from "../../utils/enums.js";

const applicationRouter = Router();

// Get application details by id
applicationRouter.get(
  "/details/:id",
  auth([roles.company]),
  validation(AV.getApplicationDetailsSchema),
  AS.getApplicationDetails,
);

// Get applications for specific internship (company only)
applicationRouter.get(
  "/:internshipId",
  auth([roles.company]),
  validation(AV.getApplicationsForSpecificInternshipSchema),
  AS.getApplicationsForSpecificInternship,
);

// Update Application Status - Creates placement if accepted
applicationRouter.patch(
  "/:id/status",
  auth([roles.company]),
  validation(AV.createPlacementSchema),
  AS.updateApplicationStatus
);



export default applicationRouter;