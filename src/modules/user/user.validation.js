import { genders } from "../../utils/enums.js";
import { generalRules } from "../../utils/generalRules.js";
import joi from "joi"

export const UpdateAccountSchema = 
   joi.object({
        firstName : joi.string().min(3).max(15).alphanum(),
        lastName : joi.string().min(3).max(15).alphanum(),
        gender : joi.string().valid(genders.male,genders.female),
        mobileNumber : joi.string().regex(/^01[0125][0-9]{8}$/),
        DOB:joi.date(),
    }).required()

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
