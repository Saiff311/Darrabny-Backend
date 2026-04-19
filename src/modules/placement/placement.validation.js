import joi from "joi";
import { generalRules } from "../../utils/generalRules.js";


export const placementIdSchema = joi.object({
  id: generalRules.id.required(),
});