import joi from "joi";
import { generalRules } from "../../utils/generalRules.js";

export const createPlacementSchema = joi
  .object({
    id: generalRules.id.required(),
    status: joi
      .string()
      .valid(
        "accepted",
        "active",
        "viewed",
        "inconsideration",
        "rejected",
        "completed",
      )
      .required(),
  })
  .required();

export const getApplicationsForSpecificInternshipSchema = joi
  .object({
    internshipId: generalRules.id.required(),
    page: joi.number().min(1).default(1),
    limit: joi.number().min(1).max(100).default(5),
    sort: joi.string().default("-aiAnalysis.score"),
  })
  .required();

export const getApplicationDetailsSchema = joi
  .object({
    id: generalRules.id.required(),
  })
  .required();
