import { asyncHandler } from "../../utils/globalErrorHandling.js";
import cloudinary from "../../utils/cloudinary.js";
import userModel from "../../DB/models/user.model.js";
import { compare } from "../../utils/security/hashing.js";
import { decrypt } from "../../utils/security/encryption.js";
import internshipModel from "../../DB/models/internship.model.js";
import applicationModel from "../../DB/models/application.model.js";
import { appStatus } from "../../utils/enums.js";
import mongoose from "mongoose";

//--------------------------------Etoo--------------------------------------------------------
export const UpdateAccount = asyncHandler( async (req, res, next)=>{
    //update account via this way so the encryption hook works (doesn't work with updateOne())
    const { fullName, email, mobileNumber, address } = req.body;

    const user = await userModel.findById(req.user._id);
    
    if (fullName) {
        const nameParts = fullName.trim().split(" ");
        user.firstName = nameParts.shift();
        user.lastName = nameParts.join(" ");
    }

    if (email) {
        user.email = email;
    }

    if (mobileNumber) {
        user.mobileNumber = mobileNumber;
    }

    if (address && typeof address === "object") {
        user.address = {
        country: address.country ?? user.address?.country,
        city: address.city ?? user.address?.city,
        };
    }

    await user.save();

    return res.status(200).json({
        msg: "User account updated successfully",
        user
    });
})
// --------------------------------------Etoo--------------------------------------------------------
export const getLoginUser = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    //decrypt mobile number
    user.mobileNumber = await decrypt(user.mobileNumber)
    return res.status(200).json({msg: "My Profile",
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.mobileNumber,
        address: user.address,
        notifications:{
            "email": true,
            "push": true
        }
    }) 
})
// --------------------------------------Etoo--------------------------------------------------------
export const myNotifications = asyncHandler( async (req, res, next)=>{
    const {email, push} = req.body
    const user = await userModel.findById(req.user._id)
    user.notifications = {email, push}
    await user.save()
    return res.status(200).json({msg: "Notifications updated successfully", notifications: user.notifications}) 
})

export const getAnotherUser = asyncHandler( async (req, res, next)=>{
    const {id} = req.params
    //U should select first & last name so the userName appears!
    const doc = await userModel.findById(id).select("firstName lastName mobileNumber profilePic coverPic")
    //show user name
    const user = doc.toObject({virtuals: true})
    if (!user) {
        return res.status(404).json({ msg: "User not found" });
    }
    //decrypt mobile number
    user.mobileNumber = await decrypt(user.mobileNumber)
    return res.status(200).json({msg: "My Profile", user}) 
})

export const updatePassword = asyncHandler( async (req, res, next)=>{
    const {oldPassword, newPassword} = req.body
    if(! await compare(oldPassword, req.user.password)){
        return next(new Error("Invalid old password", {cause: 400}))
    }
    //update password via this way so the hashing hook works (doesn't work with updateOne())
    const user = await userModel.findById(req.user._id);
    user.password = newPassword;
    user.changePassword = Date.now()
    await user.save(); // 
    return res.status(200).json({msg: "Password updated successfully"})
})

export const UploadProfilePic = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    //delete old profile pic
    if(user.profilePic.public_id){
        await cloudinary.uploader.destroy(user.profilePic.public_id)
    }
    //upload profile pic to cloudinary
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile pics"
    })
    console.log("file:" + req.file);
    
    const profilePic = {secure_url, public_id}
    await userModel.updateOne({_id: req.user._id}, {profilePic})
    return res.status(200).json({msg: "Profile Pic uploaded successfully"})
})

export const UploadCoverPic = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    //delete old profile pic
    if(user.coverPic.public_id){
        await cloudinary.uploader.destroy(user.coverPic.public_id)
    }
    //upload profile pic to cloudinary
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
        folder: "cover pics"
    })
    const coverPic = {secure_url, public_id}
    await userModel.updateOne({_id: req.user._id}, {coverPic})
    return res.status(200).json({msg: "Cover Pic uploaded successfully"})
})

export const deleteProfilePic = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    if (!user.profilePic.public_id) {
        return next(new Error("Profile picture not found!", { cause: 404 }));
    }
    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy( user.profilePic.public_id);    
    if (result.result !== "ok") {
        return next(new Error("Failed to delete image from Cloudinary", { cause: 500 }));
    }
    await userModel.updateOne({_id: req.user._id}, {$unset: {profilePic:""}})
    return res.status(200).json({msg: "Profile Pic deleted successfully"})
})

export const deleteCoverPic = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    if (!user.coverPic.public_id) {
        return next(new Error("Cover picture not found!", { cause: 404 }));
    }
    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(user.coverPic.public_id);
    if (result.result !== "ok") {
        return next(new Error("Failed to delete image from Cloudinary", { cause: 500 }));
    }
    await userModel.updateOne({_id: req.user._id}, {$unset: {coverPic:""}})
    return res.status(200).json({msg: "Cover Pic deleted successfully"})
})

export const softDelete = asyncHandler(async (req, res, next) => {
    
    await userModel.updateOne({_id: req.user._id}, {isDeleted: true, deletedAt: Date.now()})

    return res.status(200).json({ msg: "Account Deleted Successfully", });
});

// export const saveInternship = asyncHandler(async(req,res,next)=>{})

 export const GetStudentDashboard = asyncHandler(
  async (req, res, next) => {

    const studentId = req.user._id;
    const activeLimit = parseInt(req.query.activeLimit) || 5;
    const savedLimit = parseInt(req.query.savedLimit) || 5;

    /* ================================
    Get Active Internships
    ================================= */
    const activeInternshipsRaw = await internshipModel
      .find({
        closed: false,
        acceptedStudents: studentId
      })
      .limit(activeLimit)
      .populate("companyId", "name")
      .lean();

    const activeInternships = activeInternshipsRaw.map((i) => ({
      id: i._id,
      title: i.internshipTittle,
      company: {
        id: i.companyId?._id,
        name: i.companyId?.name
      },
      location: i.internshipLocation,
      workMode: i.workingTime,
      isPaid: i.isPaid || false,
      salary: i.salary || 0,
      salaryType: i.salaryType || "month",
      thumbnail: i.thumbnail || "",
      progress: 0 
    }));


    /* ================================
    Get Saved Internships
    ================================= */
    const user = await userModel
      .findById(studentId)
      .populate({
        path: "savedInternships",
        options: { limit: savedLimit },
        populate: { path: "companyId", select: "name" }
      })
      .lean();

    const savedInternships = (user?.savedInternships || []).map((s) => ({
      id: s._id,
      title: s.internshipTittle,
      company: {
        id: s.companyId?._id,
        name: s.companyId?.name
      }
    }));



    // completed internships
    const internshipsCompleted = await internshipModel.countDocuments({
      closed: true,
      acceptedStudents: studentId
    });

    // average company rating
    const completedInternships = await internshipModel
      .find({
        closed: true,
        acceptedStudents: studentId
      })
      .select("evaluations")
      .lean();

    let totalRating = 0;
    let ratingCount = 0;

    completedInternships.forEach((internship) => {
      if (internship.evaluations?.length) {
        internship.evaluations.forEach((evaluation) => {
          if (evaluation.companyRating) {
            totalRating += evaluation.companyRating;
            ratingCount++;
          }
        });
      }
    });

    const averageCompanyRating =
      ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(1)) : 0;


    /* ================================
    Final Response
    ================================= */

    return res.status(200).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.profilePic?.secure_url || ""
      },
      activeInternships: activeInternships || [],
      stats: {
        internshipsCompleted,
        averageCompanyRating
      },
      savedInternships: savedInternships || []
    });
  }
);

export const GetStudentApplications = asyncHandler(async (req, res, next) => {
  const studentId = req.user._id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const statusQuery = req.query.status || "all";

  // Map frontend status query to actual currentStatus
  const statusMap = {
    active: appStatus.accepted,
    "under-review": appStatus.inconsideration,
    closed: appStatus.rejected,
    all: null
  };

  if (!statusMap.hasOwnProperty(statusQuery)) {
    return next(new Error("Invalid status value", { cause: 400 }));
  }

  const filterStatus = statusMap[statusQuery];

  // Aggregation pipeline
  const pipeline = [
    { $match: { userId: new mongoose.Types.ObjectId(studentId) } },
    // Compute currentStatus as last timeline entry
    {
      $addFields: {
        currentStatus: { $arrayElemAt: ["$timeline.status", -1] },
        timeline: {
          $map: {
            input: { $sortArray: { input: "$timeline", sortBy: { date: 1 } } },
            as: "t",
            in: { status: "$$t.status", date: "$$t.date" }
          }
        }
      }
    },
  ];

  // Apply status filter if not 'all'
  if (filterStatus) {
    pipeline.push({
      $match: { currentStatus: filterStatus }
    });
  }

  // Join internship
  pipeline.push({
    $lookup: {
      from: "internships",
      localField: "internshipId",
      foreignField: "_id",
      as: "internship"
    }
  });
  pipeline.push({ $unwind: { path: "$internship", preserveNullAndEmptyArrays: true } });

  // Join company inside internship
  pipeline.push({
    $lookup: {
      from: "companies",
      localField: "internship.companyId",
      foreignField: "_id",
      as: "company"
    }
  });
  pipeline.push({ $unwind: { path: "$company", preserveNullAndEmptyArrays: true } });

  // Facet for pagination + total count
  pipeline.push({
    $facet: {
      data: [
        { $sort: { appliedAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $project: {
            id: "$_id",
            internship: {
              id: "$internship._id",
              title: "$internship.internshipTittle",
              company: {
                id: "$company._id",
                name: "$company.name"
              }
            },
            appliedAt: 1,
            currentStatus: 1,
            timeline: 1
          }
        }
      ],
      totalCount: [{ $count: "total" }]
    }
  });

  const result = await applicationModel.aggregate(pipeline);

  const applications = result[0].data;
  const total = result[0].totalCount[0]?.total || 0;

  return res.status(200).json({
    total,
    page,
    pages: Math.ceil(total / limit),
    applications
  });
});