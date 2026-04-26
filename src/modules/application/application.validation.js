import joi from "joi";
import { generalRules } from "../../utils/generalRules.js";



export const createPlacementSchema = joi.object({
    id: generalRules.id.required(),
    status: joi.string().valid("accepted", "active", "viewed", "inconsideration","rejected").required()
}).required()
