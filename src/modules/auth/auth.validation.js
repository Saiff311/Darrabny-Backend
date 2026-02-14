import joi from 'joi'
import { generalRules } from '../../utils/generalRules.js'
import { genders, roles } from '../../utils/enums.js'

export const signupSchema = joi.object({
    //user fields
    firstName : joi.string().min(3).max(15).alphanum().required(),
    lastName : joi.string().min(3).max(15).alphanum().required(),
    email : generalRules.email.required(),
    password : generalRules.password.required(),
    confirmPassword :generalRules.password.valid(joi.ref("password")).required(),
    gender : joi.string().valid(genders.male,genders.female),
    DOB:joi.date(),
    mobileNumber : joi.string().required().regex(/^01[0125][0-9]{8}$/),
    role : joi.string().valid(roles.student, roles.academic_supervisor, roles.company_supervisor, roles.collegeAdmin).required(),
    // student fields
    // collegeId: joi.string()
    //     .when('role', { is: roles.student , then: generalRules.id.optional(), otherwise: joi.forbidden() }),
    // graduationYear: joi.number()
    //     .when('role', { is: roles.student, then: joi.number().integer().min(1940).max(new Date().getFullYear()+10).optional(), otherwise: joi.forbidden() }),
    // major: joi.string()
    //     .when('role', { is: roles.student, then: joi.string().optional(), otherwise: joi.forbidden() }),
    // minor: joi.string()
    //     .when('role', { is: roles.student, then: joi.string().optional(), otherwise: joi.forbidden() }),
    // CGPA: joi.number()
    //     .when('role', { is: roles.student, then: joi.number().min(0).max(4).optional(), otherwise: joi.forbidden() }),
    // academic supervisor fields
    // collegeId: joi.string()
    //     .when('role', { is: roles.academic_supervisor , then: generalRules.id.required(), otherwise: joi.forbidden() }),
    // department: joi.string()
    //     .when('role', { is: roles.academic_supervisor, then: joi.string().required(), otherwise: joi.forbidden() }),
    // title: joi.string()
    //     .when('role', { is: roles.academic_supervisor, then: joi.string().optional(), otherwise: joi.forbidden() }),
    // company supervisor fields
    // companyId: joi.string()
    //     .when('role', { is: roles.company_supervisor, then: generalRules.id.required(), otherwise: joi.forbidden() }),
    // position: joi.string()
    //     .when('role', { is: roles.company_supervisor, then: joi.string().required(), otherwise: joi.forbidden() })
}).required()

export const confirmEmailSchema = joi.object({
    email : generalRules.email.required(),
    code : joi.string().length(4).required()
}).required()

export const loginSchema = joi.object({
    email : generalRules.email.required(),
    password : generalRules.password.required(),
}).required()

export const refreshTokenSchema = joi.object({
    authorization : joi.string().required()
}).required()

export const forgetPasswordSchema = joi.object({
    email : generalRules.email.required()
}).required()

export const resetPasswordSchema = joi.object({
    email : generalRules.email.required(),
    code : joi.string().required().length(4),
    newPassword : generalRules.password.required(),
    confirmPassword :generalRules.password.required().valid(joi.ref("newPassword")),
}).required()