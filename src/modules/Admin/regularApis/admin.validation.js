import { generalRules } from "../../../utils/generalRules.js";
import joi from "joi"


export const idSchema = joi.object({
    id: generalRules.id.required()
})