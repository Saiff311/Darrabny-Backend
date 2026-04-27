import joi from "joi";
import { generalRules } from "../../utils/generalRules.js";


export const placementIdSchema = joi.object({
  id: generalRules.id.required(),
});

export const completePlacementSchema = joi
  .object({
    id: generalRules.id.required(),
    finalEvaluation: joi
      .string()
      .valid("excellent", "very good", "good", "acceptable", "poor")
      .required(),
    certificateUrl: joi.string().uri().optional().allow("", null),
  })
  .required();