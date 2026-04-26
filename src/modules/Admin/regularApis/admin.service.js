import companyModel from "../../../DB/models/company.model.js";
import userModel from "../../../DB/models/user.model.js";
import { asyncHandler } from "../../../utils/globalErrorHandling.js";


// ========================== Verify Company ==========================
export const verifyCompany = asyncHandler(async (req, res, next) => {
    const {id} = req.params 
    const company = await companyModel.findById(id)
    if(!company){
        return next(new Error("Company not found", 404))
    }
    if(company.verificationStatus === "verified"){
        company.verificationStatus = "rejected"
    }else{
        company.verificationStatus = "verified"
    }
    await company.save()
    res.status(200).json({msg: `company ${company.companyName} is ${company.verificationStatus} successfully`})
});

export const banUser = asyncHandler(async (req, res, next) => {
    const {id} = req.params 
    const user = await userModel.findById(id)
    if(!user){
        return next(new Error("User not found", 404))
    }
    if(user.bannedAt){
        user.bannedAt = undefined
    }else{
        user.bannedAt = Date.now()
    }
    await user.save()
    res.status(200).json({msg: `user ${user.userName} is ${user.bannedAt ? "banned" : "unbanned"} successfully`})
});

export const banCompany = asyncHandler(async (req, res, next) => {
    const {id} = req.params 
    const company = await companyModel.findById(id)
    if(!company){
        return next(new Error("company not found", {cause:400}))
    }
    if(company.bannedAt){
        company.bannedAt = undefined
    }else{
        company.bannedAt = Date.now()
    }
    await company.save()
    res.status(200).json({msg: `company ${company.companyName} is ${company.bannedAt ? "banned" : "unbanned"} successfully`})
});
