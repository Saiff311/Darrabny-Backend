import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { roles } from "../../utils/enums.js";
import { validation } from "../../middleware/validation.js";
import { hostMulter, fileTypes } from "../../middleware/multer.js";
import * as JV from "./internshipReport.validation.js";
import * as JS from "./internshipReport.service.js";

const internshipReportRouter = Router();

const allowedMimeTypes = [
  ...fileTypes.pdf,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  ...fileTypes.image,
];

const certificateMimeTypes = [
  ...fileTypes.pdf,
  ...fileTypes.image,
];

const uploadAttachmentMulter = hostMulter(allowedMimeTypes, 10);
const uploadCertificateMulter = hostMulter(certificateMimeTypes, 10);

// -----------------Upload Certificate------------------
internshipReportRouter.post(
  "/upload-certificate",
  auth([roles.company]),
  uploadCertificateMulter.single("file"),
  JS.uploadCertificate
);

// -----------------Create intern evaluation------------------
internshipReportRouter.post(
  "/evaluation",
  auth([roles.company]),
  validation(JV.createInternEvaluationSchema),
  JS.createInternEvaluation
);


// -----------------add report comment------------------
internshipReportRouter.post(
  "/:id/comments",
  auth(Object.values(roles)),
  validation(JV.addReportCommentSchema),
  JS.addReportComments
);

// -----------------Upload Report Attachment------------
internshipReportRouter.post(
  "/:id/attachments",
  auth(Object.values(roles)),
  uploadAttachmentMulter.single("attachment"),
  // validation(JV.uploadReportAttachmentSchema),
  JS.uploadReportAttachment
);

// -----------------Delete Report Attachment-----------------
internshipReportRouter.delete(
  "/:id/attachments/:attachmentId",
  auth(Object.values(roles)),
  validation(JV.deleteReportAttachmentSchema),
  JS.deleteReportAttachment
);



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
  auth([roles.company, roles.student, roles.admin, roles.college]),   //  company, student, admin, college
  validation(JV.downloadReportPDFSchema),
  JS.downloadReportPDF
);

export default internshipReportRouter;