import applicationModel from "../../DB/models/application.model.js";
import companyModel from "../../DB/models/company.model.js";
import internshipModel from "../../DB/models/internship.model.js";
import reviewModel from "../../DB/models/review.model.js";
import userModel from "../../DB/models/user.model.js";
import studentModel from "../../DB/models/student.model.js";
import companySupervisorModel from "../../DB/models/company_supervisor.model.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";
import { emailEvent } from "../../services/sendEmail/email.event.js";
import { escapeRegex } from "../../utils/security/escapeRegax.js";
import { internshipStatus, roles } from "../../utils/enums.js";
import cloudinary from "../../utils/cloudinary.js";
import mongoose from "mongoose";
// ========================== Add Internship ==========================
export const addInternship = asyncHandler(async (req, res, next) => {
  const company = req.company;

  if (!company) {
    return next(new Error("Company authentication required", { cause: 401 }));
  }

  if (!company.approvedByAdmin) {
    return next(new Error("Company is not approved by admin yet", { cause: 403 }));
  }

  if (company.deletedAt || company.bannedAt) {
    return next(new Error("Company is deleted or banned", { cause: 403 }));
  }

  let thumbnailUrl = null;

  if (req.file) {
    const { secure_url } = await cloudinary.uploader.upload(req.file.path, {
      folder: "internships",
    });
    thumbnailUrl = secure_url;
  }

  let technicalSkillsArr = [];
  if (typeof req.body.technicalSkills === "string") {
    technicalSkillsArr = req.body.technicalSkills.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(req.body.technicalSkills)) {
    technicalSkillsArr = req.body.technicalSkills;
  }

  let softSkillsArr = [];
  if (typeof req.body.softSkills === "string") {
    softSkillsArr = req.body.softSkills.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(req.body.softSkills)) {
    softSkillsArr = req.body.softSkills;
  }

  if (req.body.supervisorId) {
    const supervisor = await companySupervisorModel.findById(req.body.supervisorId);
    if (!supervisor) {
      return next(new Error("Supervisor not found", { cause: 404 }));
    }
    if (supervisor.companyId.toString() !== company._id.toString()) {
      return next(new Error("Supervisor does not belong to this company", { cause: 403 }));
    }
  }

  const internship = await internshipModel.create({
    ...req.body,
    companyId: company._id,
    technicalSkills: technicalSkillsArr,
    softSkills: softSkillsArr,
    thumbnail: thumbnailUrl,
  });

  return res.status(201).json({
    success: true,
    message: "Internship added successfully",
    data: internship,
  });
});

// ========================== Update Internship ==========================
export const updateInternship = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;
  const companyId = req.company._id;
  req.body.updatedBy = companyId;

  const internship = await internshipModel.findOneAndUpdate(
    { _id: internshipId, companyId },
    req.body,
    { new: true }
  );

  if (!internship) {
    return next(new Error("Internship not found", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    message: "Internship updated successfully",
    data: internship,
  });
});

// ========================== Delete Internship ==========================
export const deleteInternship = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;
  const companyId = req.company._id;

  const internship = await internshipModel.findById(internshipId);
  if (!internship) {
    return next(new Error("Internship not found", { cause: 404 }));
  }

  if (internship.companyId.toString() !== companyId.toString()) {
    return next(new Error("You are not authorized to delete this internship", { cause: 403 }));
  }

  await internship.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Internship deleted successfully",
  });
});

// ========================== Get Company Internships ==========================
export const getCompanyInternships = asyncHandler(async (req, res, next) => {
  const companyId = req.company._id;
  const { page = 1, limit = 6, sort = "-createdAt", companyName } = req.query;
  const skip = (page - 1) * limit;

  let query = { companyId };

  if (companyName) {
    const company = await companyModel.findOne({
      companyName: { $regex: escapeRegex(companyName), $options: "i" },
      deletedAt: { $exists: false },
    });

    if (!company) {
      return next(new Error("Company not found", { cause: 404 }));
    }
    query.companyId = company._id;
  }

  const internships = await internshipModel
    .find(query)
    .sort(sort)
    .skip(Number(skip))
    .limit(Number(limit))
    .populate("companyId", "companyName")
    .lean();

  const totalCount = await internshipModel.countDocuments(query);

  if (internships.length === 0) {
    return next(new Error("No internships found", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    message: "Internships fetched successfully",
    data: internships,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
});

// ========================== DETAILS ==========================
export const getInternshipById = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;

  let savedIds = [];

  if (req.user) {
    const user = await userModel
      .findById(req.user._id)
      .select("savedInternships")
      .lean();

    savedIds = user?.savedInternships?.map((id) => id.toString()) || [];
  }

  const internship = await internshipModel
    .findById(internshipId)
    .populate("companyId", "companyName logo")
    .lean();

  if (!internship) return next(new Error("Internship not found"));

  const stats = await reviewModel.aggregate([
    {
      $match: {
        internshipId: new mongoose.Types.ObjectId(internshipId),
      },
    },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      ...internship,
      isSaved: savedIds.includes(internshipId),
      reviewSummary: {
        averageRating: stats[0]?.avg || 0,
        totalReviews: stats[0]?.count || 0,
      },
    },
  });
});

// ========================== LANDING: Search Preview ==========================
export const searchPreview = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q?.trim()) {
    return res.json({ success: true, data: [] });
  }

  const results = await internshipModel
    .find({
      $text: { $search: q },
      deletedAt: { $exists: false },
    })
    .select("internshipTitle internshipLocation companyId")
    .limit(7)
    .populate("companyId", "companyName")
    .lean();

  res.json({ success: true, data: results });
});


// ========================== LANDING: Featured Internships ==========================
export const getFeaturedInternships = asyncHandler(async (req, res, next) => {
  const internships = await internshipModel
    .find({
      deletedAt: { $exists: false },
      isFeatured: true,
    })
    .sort("-createdAt")
    .limit(10)
    .populate("companyId", "companyName logo")
    .lean();

  return res.status(200).json({
    success: true,
    data: internships,
  });
});

// ========================== LISTING: Search ==========================
export const searchInternships = asyncHandler(async (req, res) => {
  const {
    q,
    internshipLocation,
    workingTime,
    technicalSkills,
    durationInMonths,
    page = 1,
    limit = 10,
    sort = "-createdAt",
  } = req.query;

  const filter = { deletedAt: { $exists: false } };

  if (q?.trim()) {
    filter.$text = { $search: q };
  }

  if (internshipLocation) filter.internshipLocation = internshipLocation;
  if (workingTime) filter.workingTime = workingTime;
  if (durationInMonths) filter.durationInMonths = Number(durationInMonths);

  if (technicalSkills) {
  const skillsArr = technicalSkills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (skillsArr.length > 0) {
    filter.technicalSkills = {
      $in: skillsArr.map((skill) => new RegExp(skill, "i")),
    };
  }
}

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    internshipModel
      .find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort(sort)
      .populate("companyId", "companyName logo")
      .lean(),

    internshipModel.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data,
    pagination: {
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      total,
    },
  });
});

// ========================== LISTING: Recommended ==========================
export const getRecommendedInternships = asyncHandler(async (req, res, next) => {
  const user = await userModel
    .findById(req.user._id)
    .select("skills address")
    .lean();

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  // normalize user skills
  const userSkills =
    (user.skills || []).map((s) => s.toLowerCase().trim());

  const internships = await internshipModel
    .find({ deletedAt: { $exists: false } })
    .populate("companyId", "companyName logo")
    .lean();

  const scored = internships.map((i) => {
    const internshipSkills =
      (i.technicalSkills || []).map((s) => s.toLowerCase().trim());

    // matching
    const matchedSkills = internshipSkills.filter((skill) =>
      userSkills.includes(skill)
    );

    // skill score
    const skillScore = internshipSkills.length
      ? matchedSkills.length / internshipSkills.length
      : 0;

    // location score
    const locationScore =
      user.address?.city &&
      i.internshipLocation?.toLowerCase() === user.address.city.toLowerCase()
        ? 0.2
        : 0;

    // recency score
    const ageDays =
      (Date.now() - new Date(i.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);

    const recencyScore = Math.max(0, 0.2 - ageDays * 0.001);

    const matchScore = Number(
      (skillScore * 0.6 + locationScore + recencyScore).toFixed(2)
    );

    return {
      ...i,
      matchScore,
      matchedSkills,
      why:
        matchedSkills.length > 0
          ? `Matches your skills: ${matchedSkills.join(", ")}`
          : "Recently added internship",
    };
  });

  const sorted = scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  return res.status(200).json({
    success: true,
    data: sorted,
  });
});

// ========================== REVIEWS: Get Reviews ==========================
export const getReviews = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;

  const internship = await internshipModel.findOne({
    _id: internshipId,
    deletedAt: { $exists: false },
  });

  if (!internship) {
    return next(new Error("Internship not found", { cause: 404 }));
  }

  const reviews = await reviewModel
    .find({ internshipId })
    .populate("userId", "firstName lastName")
    .lean();

  const averageRating =
    reviews.length > 0
      ? Number(
          (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        )
      : 0;

  return res.status(200).json({
    success: true,
    averageRating,
    totalReviews: reviews.length,
    data: reviews,
  });
});

// ========================== REVIEWS: Add Review ==========================
export const addReview = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;

  const internship = await internshipModel.findOne({
    _id: internshipId,
    deletedAt: { $exists: false },
  });

  if (!internship) {
    return next(new Error("Internship not found", { cause: 404 }));
  }

  const application = await applicationModel.findOne({
    internshipId,
    userId: req.user._id,
  });

  if (!application) {
    return next(
      new Error("You can only review internships you have applied to", { cause: 403 })
    );
  }

  const existing = await reviewModel.findOne({ internshipId, userId: req.user._id });
  if (existing) {
    return next(new Error("You have already reviewed this internship", { cause: 409 }));
  }

  const review = await reviewModel.create({
    internshipId,
    userId: req.user._id,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  return res.status(201).json({
    success: true,
    message: "Review added successfully",
    data: review,
  });
});

// ========================== Get Internship Applications ==========================
export const getInternshipApp = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;
  const { page = 1, limit = 5, sort = "-createdAt" } = req.query;
  const skip = (page - 1) * limit;

  const internship = await internshipModel.findById(internshipId);

  if (!internship) {
    return next(new Error("Internship not found", { cause: 404 }));
  }

  const company = await companyModel.findById(internship.companyId);

  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }

  if (
    company.createdBy.toString() !== req.user._id.toString() &&
    !company.HRs.includes(req.user._id)
  ) {
    return next(
      new Error("You are not authorized to perform this action", { cause: 403 })
    );
  }

  const populatedInternship = await internship.populate([
    {
      path: "Applications",
      options: { sort, skip: Number(skip), limit: Number(limit) },
      populate: { path: "userId", select: "username email" },
    },
  ]);

  const totalCount = await applicationModel.countDocuments({ internshipId: internship._id });

  return res.status(200).json({
    success: true,
    message: "Applications fetched successfully",
    data: populatedInternship,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
});

// ========================== Apply To Internship ==========================
export const ApplyToInternship = asyncHandler(async (req, res, next) => {
  const internshipId = req.params.id || req.params.internshipId;
  const { coverLetter, skills } = req.body;

  const internship = await internshipModel
    .findById(internshipId)
    .select("status closed companyId");

  if (!internship) {
    return next(new Error("Internship not found", { cause: 404 }));
  }

  const isOpen = internship.status
    ? ["active", "starting_soon"].includes(internship.status)
    : !internship.closed;

  if (!isOpen) {
    return next(new Error("Internship not open for applications", { cause: 409 }));
  }

  const alreadyApplied = await applicationModel.exists({
    internshipId,
    userId: req.user._id,
  });

  if (alreadyApplied) {
    return next(
      new Error("You have already applied for this internship", { cause: 409 })
    );
  }

  const student = await studentModel
    .findOne({ userId: req.user._id })
    .select("fullName email university skills resume");

  if (!student) {
    return next(new Error("Student not found", { cause: 404 }));
  }

  if (!student.resume?.secure_url || !student.resume?.public_id) {
    return next(
      new Error("Resume is required. Please upload resume first", { cause: 400 })
    );
  }

  let skillsArr = [];
  if (Array.isArray(skills)) {
    skillsArr = skills;
  } else if (typeof skills === "string" && skills.trim()) {
    try {
      const parsed = JSON.parse(skills);
      skillsArr = Array.isArray(parsed) ? parsed : [];
    } catch {
      skillsArr = skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
  } else {
    skillsArr = Array.isArray(student.skills) ? student.skills : [];
  }

  try {
    const application = await applicationModel.create({
      internshipId,
      userId: req.user._id,
      companyId: internship.companyId,
      status: "pending",
      coverLetter: coverLetter?.trim() || null,
      skills: skillsArr,
      resume: {
        secure_url: student.resume.secure_url,
        public_id: student.resume.public_id,
      },
      snapshot: {
        studentName: student.fullName,
        email: student.email,
        university: student.university,
        skills: skillsArr,
        resumeUrl: student.resume.secure_url,
      },
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      applicationId: application._id,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return next(
        new Error("You have already applied for this internship", { cause: 409 })
      );
    }
    throw err;
  }
});

// ========================== Response To Application ==========================
export const responseApp = asyncHandler(async (req, res, next) => {
  const { appId } = req.params;
  const { status } = req.body;

  const application = await applicationModel.findById(appId);

  if (!application) {
    return next(new Error("Application not found", { cause: 404 }));
  }

  if (application.status !== "pending") {
    return next(new Error("Application already responded", { cause: 403 }));
  }

  await application.populate([
    { path: "userId" },
    { path: "internshipId", populate: { path: "companyId" } },
  ]);

  if (
    application.internshipId.companyId.createdBy.toString() !==
      req.user._id.toString() &&
    !application.internshipId.companyId.HRs.includes(req.user._id)
  ) {
    return next(
      new Error("You are not authorized to perform this action", { cause: 403 })
    );
  }

  application.status = status;
  await application.save();

  emailEvent.on("sendApplicationStatus", application.userId.email, status);

  return res.status(200).json({
    success: true,
    message: "Application responded successfully",
    data: application,
  });
});

// ========================== Get Student Internships ==========================
export const getStudentInternships = asyncHandler(async (req, res, next) => {
  const studentId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  const today = new Date();

  let statusFilter = {};
  if (status === internshipStatus.inProgress) {
    statusFilter.endDate = { $gte: today };
  } else if (status === internshipStatus.completed) {
    statusFilter.endDate = { $lt: today };
  }

  const applications = await applicationModel
    .find({ userId: studentId })
    .select("internshipId")
    .lean();

  const internshipIds = applications.map((app) => app.internshipId);

  const totalCount = await internshipModel.countDocuments({
    _id: { $in: internshipIds },
    ...statusFilter,
  });

  const internships = await internshipModel
    .find({ _id: { $in: internshipIds }, ...statusFilter })
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .populate("companyId", "companyName")
    .lean();

  const msPerDay = 24 * 60 * 60 * 1000;

  const data = internships.map((internship) => {
    const start = new Date(internship.startDate);
    const end = new Date(internship.endDate);
    const totalWeeks = Math.ceil((end - start) / msPerDay / 7);
    const currentWeek = Math.min(
      Math.ceil((today - start) / msPerDay / 7),
      totalWeeks
    );
    const progress = Math.round((currentWeek / totalWeeks) * 100);

    return {
      id: internship._id,
      title: internship.internshipTitle,   // ✅ fixed
      company: {
        id: internship.companyId._id,
        name: internship.companyId.companyName,
      },
      location: internship.internshipLocation,
      thumbnail: internship.thumbnail || "",
      startDate: internship.startDate,
      currentWeek,
      totalWeeks,
      progress,
      status: internship.endDate >= today ? "inProgress" : "completed",
    };
  });

  return res.status(200).json({
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: totalCount,
    },
  });
});