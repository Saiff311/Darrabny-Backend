import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { roles } from "../../utils/enums.js";
import { validation } from "../../middleware/validation.js";
import * as JV from "./internshipReport.validation.js";
import * as JS from "./internshipReport.service.js";

const internshipReportRouter = Router();

internshipReportRouter.get("/internship/:id/report-prefill",
  auth([roles.student, roles.company]),  // student, company
  validation(JV.reportPrefillSchema),
  JS.getReportPrefill
);

internshipReportRouter.post("/internship/:id",
  auth([roles.company]), //  company only
  validation(JV.createReportSchema),
  JS.createReport
);

internshipReportRouter.patch("/:id",
  auth([roles.company]), //  company only
  validation(JV.updateReportSchema),
  JS.updateReport
);

internshipReportRouter.get("/:id",
  auth([roles.student, roles.company, roles.admin, roles.college]), // student, company, admin, college
  validation(JV.getReportDetailsSchema),
  JS.getReportDetails
);

internshipReportRouter.patch("/:id/status",
  auth([roles.company]),   //  company only
  validation(JV.updateReportStatusSchema),
  JS.updateReportStatus
);

internshipReportRouter.get("/:id/pdf",
  auth([roles.company, roles.student, roles.admin]),   //  company, student, admin
  validation(JV.downloadReportPDFSchema),
  JS.downloadReportPDF
);

export default internshipReportRouter;