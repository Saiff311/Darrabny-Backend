import joi from "joi";
import { generalRules } from "../../utils/generalRules.js";


export const userIdSchema = joi.object({
    userId : generalRules.id.required()
})
