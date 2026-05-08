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

export const createInternEvaluationSchema = joi.object({
  placementId: generalRules.id.required(),
  performanceScore: joi.number().min(0).max(100).required(),
  attendance: joi.number().min(0).max(100).required(),
  feedback: joi.string().trim().allow("", null),
  reportDate: joi.date().optional(),
}).required();