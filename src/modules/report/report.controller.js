import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";
import { roles } from "../../utils/enums.js";
import { hostMulter, fileTypes } from "../../middleware/multer.js";
import * as RS from "./report.service.js";
import * as RV from "./report.validation.js";

const reportRouter = Router()

// Multer configuration for report attachments
// Allowed file types: pdf, docx, xlsx, png, jpg
// Max file size: 10 MB
const allowedMimeTypes = [
  ...fileTypes.pdf,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  ...fileTypes.image,
];

const uploadAttachmentMulter = hostMulter(allowedMimeTypes, 10);

// -----------------add report comment------------------
reportRouter.post(
    "/:id/comments",
    auth(Object.values(roles)),
    validation(RV.addReportCommentSchema),
    RS.addReportComments
)
// -----------------Upload Report Attachment------------
reportRouter.post(
    "/:id/attachments",
    auth(Object.values(roles)),
    uploadAttachmentMulter.single("attachment"),
    // validation(RV.uploadReportAttachmentSchema),
    RS.uploadReportAttachment
)
// -----------------Delete Report Attachment-----------------
reportRouter.delete(
    "/:id/attachments/:attachmentId",
    auth(Object.values(roles)),
    validation(RV.deleteReportAttachmentSchema),
    RS.deleteReportAttachment
)

export default reportRouter