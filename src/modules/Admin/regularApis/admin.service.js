import companyModel from "../../../DB/models/company.model.js";
import userModel from "../../../DB/models/user.model.js";
import verificationRequestModel from "../../../DB/models/verificationRequest.model.js";
import verificationDocumentModel from "../../../DB/models/verificationDocument.model.js";
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

// ========================== Get Pending Verification Requests ==========================
export const getPendingVerifications = asyncHandler(async (req, res, next) => {
    const requests = await verificationRequestModel
        .find({ status: "pending" })
        .sort({ createdAt: -1 })
        .populate("companyId", "companyName email companyPhone verificationStatus")
        .populate("documents")
        .lean()

    return res.status(200).json({
        msg: "Pending verification requests retrieved",
        data: requests,
    })
});

// ========================== Review Verification Document ==========================
export const updateDocumentStatus = asyncHandler(async (req, res, next) => {
    const { docId } = req.params
    const { status, note } = req.body

    const document = await verificationDocumentModel.findById(docId)
    if(!document){
        return next(new Error("Verification document not found", {cause: 404}))
    }

    document.status = status
    await document.save()

    const request = await verificationRequestModel.findById(document.requestId)
    if(!request){
        return next(new Error("Verification request not found", {cause: 404}))
    }

    request.history.push({
        action: `document_${status}`,
        date: new Date(),
        note: note || null,
    })
    request.status = "pending"
    await request.save()

    return res.status(200).json({
        msg: "Verification document updated successfully",
        document,
    })
});

// ========================== Update Verification Request Status ==========================
export const updateVerificationStatus = asyncHandler(async (req, res, next) => {
    const { requestId } = req.params
    const { status, note } = req.body

    const request = await verificationRequestModel.findById(requestId)
    if(!request){
        return next(new Error("Verification request not found", {cause: 404}))
    }

    let validUntil = null
    if(status === "approved"){
        validUntil = new Date()
        validUntil.setFullYear(validUntil.getFullYear() + 1)
    }

    request.status = status
    request.validUntil = validUntil
    request.history.push({
        action: `request_${status}`,
        date: new Date(),
        note: note || null,
    })
    await request.save()

    if(status === "approved"){
        await companyModel.updateOne(
            { _id: request.companyId },
            { verificationStatus: "verified", validUntil },
        )
    }else{
        await companyModel.updateOne(
            { _id: request.companyId },
            { verificationStatus: "rejected", validUntil: null },
        )
    }

    return res.status(200).json({
        msg: "Verification request status updated successfully",
        data: request,
    })
});
