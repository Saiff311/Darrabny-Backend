import { generalRules } from "../../../utils/generalRules.js";
import joi from "joi"


export const idSchema = joi.object({
    id: generalRules.id.required()
})

export const emptySchema = joi.object().length(0)

export const updateDocumentStatusSchema = {
    params: joi.object({
        docId: generalRules.id.required(),
    }),
    body: joi.object({
        status: joi.string().valid("approved", "rejected").required(),
        note: joi.string().allow("", null),
    }),
}

export const updateVerificationStatusSchema = {
    params: joi.object({
        requestId: generalRules.id.required(),
    }),
    body: joi.object({
        status: joi.string().valid("approved", "rejected").required(),
        note: joi.string().allow("", null),
    }),
}