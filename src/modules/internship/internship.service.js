import applicationModel from "../../DB/models/application.model.js";
import companyModel from "../../DB/models/company.model.js";
import internshipModel from "../../DB/models/internship.model.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";
import { emailEvent } from "../../services/sendEmail/email.event.js";
import { escapeRegex } from "../../utils/security/escapeRegax.js";
import userModel from "../../DB/models/user.model.js";


export const addInternship = asyncHandler(async(req,res,next)=>{
    const {companyId} = req.params
    const user = req.user
    const company = await companyModel.findById(companyId)
    
    if(!company){
        return next(new Error("Company not found",{cause:404}))
    }
    if(company.createdBy.toString() !== user._id .toString() && !company.HRs.includes(user._id)){
        return next(new Error("You are not authorized to add internship",{cause:403}))
    }
    if(!company.approvedByAdmin){
        return next(new Error("Company is not approved by admin yet",{cause:403}))
    }
    if(company.deletedAt || company.bannedAt){
        return next(new Error("Company is deleted or banned",{cause:403}))
    }
    req.body.addedBy = user._id
    const internship = await internshipModel.create({
        ...req.body,
        createdBy: user._id,
        companyId})
    return res.status(201).json({
        success: true,
        message: "internship added successfully",
        data: internship
    })
})

export const updateInternship = asyncHandler(async(req,res,next)=>{
    const {internshipId} = req.params
    req.body.updatedBy = req.user._id

    const internship = await internshipModel.findOneAndUpdate({_id: internshipId, addedBy:req.user._id},req.body,{new:true})
    if(!internship){
        return next(new Error("internship not found",{cause:404}))
    }
    return res.status(201).json({
        success: true,
        message: "internship updated successfully",
        data: internship
    })
})

export const deleteInternship = asyncHandler(async(req,res,next)=>{
    const {internshipId, companyId} = req.params
    const company = await companyModel.findById(companyId)
    if(!company){
        return next(new Error("Company not found",{cause:404}))
    }
    const internship = await internshipModel.findById(internshipId)
    if(!internship){
        return next(new Error("internship not found",{cause:404}))
    }
    if(company.createdBy.toString() !== req.user._id.toString() && !company.HRs.includes(req.user._id)){
        return next(new Error("You are not authorized to delete internship",{cause:403}))
    }
    if(company._id.toString() != internship.companyId.toString()){
        return next(new Error("You are not authorized to delete internship",{cause:403}))
    }
    await internship.deleteOne()
    return res.status(201).json({
        success: true,
        message: "internship deleted successfully"
    })
})

export const getCompanyInternships = asyncHandler(async(req,res,next)=>{
    const {companyId} = req.params
    const {page=1, limit=6, sort="-createdAt",companyName} = req.query
    const skip = (page-1)*limit
    let query = {companyId}
    //check saved internships by user
    const user = await userModel.findById(req.user._id).select("savedInternships");
    const savedInternshipsIds = user?.savedInternships || [];
    //search by company name
    if(companyName){
        const company = await companyModel.findOne({
            companyName:{$regex: escapeRegex(companyName), $options:"i"},
            deletedAt:{$exists:false}
        })
        if(!company){
            return next(new Error("Company not found",{cause:404}))
        }
        query.companyId = company._id
    }
    const internships = await internshipModel.find(query).sort(sort).skip(skip).limit(limit)
        .populate("companyId", "companyName").aggregate([
        {
        $addFields: {
            isSaved: { $in: ["$_id", savedInternshipsIds] }
            }
        }
    ])
    const totalCount = await internshipModel.countDocuments(query)
    if(internships.length === 0){
        return next(new Error("No internships found",{cause:404}))
    }
    return res.status(200).json({
        success: true,
        message: "internships fetched successfully",
        data: internships,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount/limit),
            totalCount
        }
    })                                    
})
//view internship details
export const getInternshipById = asyncHandler(async(req,res,next)=>{
    const {internshipId} = req.params
    //check saved internships by user
    const user = await userModel.findById(req.user._id).select("savedInternships");
    const savedInternshipsIds = user?.savedInternships || [];

    const internship = await internshipModel.findById(internshipId)
        .populate("companyId", "companyName").aggregate([
            {
            $addFields: {
                isSaved: { $in: ["$_id", savedInternshipsIds] }
                }
            }
        ])

    if(!internship){
        return next(new Error("internship not found",{cause:404}))
    }
    return res.status(200).json({
        success: true,
        message: "internship fetched successfully",
        data: internship
    })
})

export const getFilteredInternships = asyncHandler(async(req,res,next)=>{
    const {page=1, limit=6, sort="-createdAt", ...filters} = req.query
    const skip = (page-1)*limit
    //check saved internships by user
    const user = await userModel.findById(req.user._id).select("savedInternships");
    const savedInternshipsIds = user?.savedInternships || [];
    const internships = await internshipModel.find(filters).sort(sort).skip(skip).limit(limit)
    .populate("companyId", "companyName").aggregate([
        {
        $addFields: {
            isSaved: { $in: ["$_id", savedInternshipsIds] }
            }
        }
    ])
    const totalCount = await internshipModel.countDocuments(filters)
    if(internships.length === 0){
        return next(new Error("No internships found",{cause:404}))
    }
    return res.status(200).json({
        success: true,
        message: "internships fetched successfully",
        data: internships,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount/limit),
            totalCount
        }
    })
                                                   
})

export const getInternshipApp = asyncHandler(async(req, res, next)=>{
    const {internshipId} = req.params
    const {page=1, limit=5, sort="-createdAt"} = req.query
    const skip = (page-1)*limit
    let internship = await internshipModel.findById(internshipId)
    if(!internship){
        return next(new Error("internship not found",{cause:404}))
    }
    const company = await companyModel.findById(internship.companyId)
    if(!company){
        return next(new Error("Company not found",{cause:404}))
    }
    if(company.createdBy.toString() !== req.user._id.toString() && !company.HRs.includes(req.user._id)){
        return next(new Error("You are not authorized to preform this action",{cause:403}))
    }
    internship = internship.populate([{
        path: "application",
        options:{sort, skip, limit},
        populate: {
            path: "userId",
            select: "username email"
        }
    }])
    const totalCount = await applicationModel.countDocuments({internshipId: internship._id})
    if(internship.application.length === 0){
        return next(new Error("No applications found",{cause:404}))
    }
    return res.status(200).json({
        success: true,
        message: "Applications fetched successfully",
        data: internship,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount/limit),
            totalCount
        }
    })
                                                   
})

export const ApplyToInternship = asyncHandler(async(req, res, next)=>{
    const {internshipId} = req.params
    const internship = await internshipModel.findById(internshipId)
    if(!internship){
        return next(new Error("internship not found",{cause:404}))
    }
    if(internship.closed){
        return next(new Error("internship is closed",{cause:403}))
    }
    const existApplication = await applicationModel.findOne({internshipId, userId: req.user._id})
    if(existApplication){
        return next(new Error("You have already applied for this internship",{cause:403}))
    }
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
        folder: "internship-application"
    })
    const application = await applicationModel.create({
        internshipId,
        userId: req.user._id,
        userCV: {
            secure_url,
            public_id
        }
    })
    io.to(internship.addedBy).emit("new-application", {message: "New application submitted",application})
    return res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        data: application
    })
})

export const responseApp = asyncHandler(async(req, res, next)=>{
    const {appId} = req.params
    const {status} = req.body
    const application = await applicationModel.findById(appId)
    if(!application){
        return next(new Error("Application not found",{cause:404}))
    }
    if(application.status !== "pending"){
        return next(new Error("Application already responded",{cause:403}))
    }
    await application.populate([
    { path: "userId" },
    {
        path: "internshipId",
        populate: { path: "companyId"}
    }
    ]);
    if(application.internshipId.companyId.createdBy.toString() !== req.user._id.toString() &&
     !application.internshipId.companyId.HRs.includes(req.user._id)){
        return next(new Error("You are not authorized to preform this action",{cause:403}))
    }
    application.status = status
    await application.save()
    emailEvent.on("sendApplicationStatus",application.userID.email,status)
    return res.status(200).json({
        success: true,
        message: "Application responded successfully",
        data: application
    })
})