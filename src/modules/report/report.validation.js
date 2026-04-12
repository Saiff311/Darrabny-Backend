import joi from "joi";
import { generalRules } from "../../utils/generalRules.js";

export const addReportCommentSchema = joi.object({
  id: generalRules.id.required(),
  message: joi.string().trim().min(1).max(2000).required(),
}).required();

export const uploadReportAttachmentSchema = joi.object({
  id: generalRules.id.required(),
  file: generalRules.file.required(),
}).required();

export const deleteReportAttachmentSchema = joi.object({
  id: generalRules.id.required(),
  attachmentId: generalRules.id.required(),
}).required();