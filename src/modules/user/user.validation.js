import { genders } from "../../utils/enums.js";
import { generalRules } from "../../utils/generalRules.js";
import joi from "joi"

export const UpdateAccountSchema = joi.object({
    fullName: joi.string()
        .trim()
        .min(2)
        .pattern(/^[A-Za-z\s]+$/)
        .messages({
        "string.pattern.base": "Full name must contain only letters and spaces"
        }),
        email: joi.string()
        .email()
        .lowercase(),

    mobileNumber: joi.string()
        .pattern(/^01[0125][0-9]{8}$/)
        .messages({
        "string.pattern.base": "Mobile number must be between 10 and 15 digits"
        }),

    address: joi.object({
        country: joi.string().trim().min(2).required(),
        city: joi.string().trim().min(2).required(),
    })
}).min(1)
export const myNotificationsSchema = joi.object({
    email: joi.boolean(),
    push: joi.boolean()
})

export const getAnotherUserSchema =  joi.object({
    id : joi.string().length(24).hex().required()
})

export const UploadProfilePicSchema = joi.object({
    file: generalRules.file.required()
})

export const UploadCoverPicSchema = joi.object({
    file: generalRules.file.required()
})

export const updatePasswordSchema = joi.object({
    oldPassword : generalRules.password.required(),
    newPassword : generalRules.password.required(),
    confirmPassword :generalRules.password.required().valid(joi.ref("newPassword")),
})
