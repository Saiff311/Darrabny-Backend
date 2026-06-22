import applicationModel from "../../DB/models/application.model.js";
import companyModel from "../../DB/models/company.model.js";
import internshipModel from "../../DB/models/internship.model.js";
import reviewModel from "../../DB/models/review.model.js";
import userModel from "../../DB/models/user.model.js";
import studentModel from "../../DB/models/student.model.js";
import companySupervisorModel from "../../DB/models/company_supervisor.model.js";
import { placementModel } from "../../DB/models/placment.model.js";
import internshipReportModel from "../../DB/models/internshipReport.model.js";
import internshipApprovalModel from "../../DB/models/internshipApproval.model.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";
import { emailEvent } from "../../services/sendEmail/email.event.js";
import { escapeRegex } from "../../utils/security/escapeRegax.js";
import { internshipStatus, roles } from "../../utils/enums.js";
import cloudinary from "../../utils/cloudinary.js";
import { analyzeApplicationWithAI } from "../../services/ai/ai.service.js";
import mongoose from "mongoose";
import reportModel from "../../DB/models/report.model.js";

// ========================== Get Internship Students ==========================
export const getInternshipStudents = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;

  const internship = await internshipModel.findById(internshipId);

  if (!internship) {
    return next(new Error("Internship not found", { cause: 404 }));
  }

  if (
    internship.companyId.toString() !== req.company._id.toString()
  ) {
    return next(
      new Error("You are not authorized to access this internship", {
        cause: 403,
      }),
    );
  }

  const placements = await placementModel
    .find({ internshipId, status: "ongoing" })
    .select("_id currentPerformance studentId")
    .populate({
      path: "studentId",
      select: "major university",
      populate: {
        path: "userId",
        select: "firstName lastName email profilePic address",
      },
    })
    .lean();

  // Reports are stored in internship_report with studentId, so one bulk query can flag all students.
  const studentIds = placements.map((placement) => placement.studentId?._id);
  const studentsWithReports = studentIds.length
    ? await internshipReportModel.distinct("studentId", {
        internshipId,
        studentId: { $in: studentIds },
      })
    : [];
  const studentsWithReportsSet = new Set(
    studentsWithReports.map((studentId) => String(studentId)),
  );

  if (!placements.length) {
    return res.status(200).json({
      success: true,
      message: "No ongoing placements found for this internship",
      data: [],
    });
  }

  const students = placements.map((placement) => ({
    placementId: placement._id,
    studentId: placement.studentId._id,
    userId: placement.studentId.userId._id,
    currentPerformance: placement.currentPerformance || 0,
    reportLabel: studentsWithReportsSet.has(String(placement.studentId._id))
      ? "Has Report"
      : null,
    fullName: `${placement.studentId.userId.firstName} ${placement.studentId.userId.lastName}`,
    email: placement.studentId.userId.email,
    avatar: placement.studentId.userId.profilePic?.secure_url || null,
    university: placement.studentId.university || null,
    major: placement.studentId.major || null,
  }));

  return res.status(200).json({
    success: true,
    message: "Internship students fetched successfully",
    data: students,
  });
});

// ========================== Add Internship ==========================
export const addInternship = asyncHandler(async (req, res, next) => {
  const company = req.company;

  if (!company) {
    return next(new Error("Company authentication required", { cause: 401 }));
  }

  if (!company.approvedByAdmin) {
    return next(
      new Error("Company is not approved by admin yet", { cause: 403 }),
    );
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
    technicalSkillsArr = req.body.technicalSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (Array.isArray(req.body.technicalSkills)) {
    technicalSkillsArr = req.body.technicalSkills;
  }

  let softSkillsArr = [];
  if (typeof req.body.softSkills === "string") {
    softSkillsArr = req.body.softSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (Array.isArray(req.body.softSkills)) {
    softSkillsArr = req.body.softSkills;
  }

  console.log(req.body);

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

// ========================== Get Internship By ID ==========================
export const getInternship = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;

  const internship = await internshipModel.findById({
    _id: internshipId,
    deletedAt: { $exists: false },
  });

  if (!internship)
    return next(new Error("internship not found!", { cause: 404 }));

  return res.status(201).json({
    success: true,
    message: "internship fetched successfully",
    data: internship,
  });
});

// ========================== Update Internship ==========================
// فوق خالص في الملف لازم تعمل import لمكتبة كلاوديناري لو مش عاملها
// import cloudinary from 'cloudinary'; // (أو مسار ملف إعدادات كلاوديناري بتاعك)

export const updateInternship = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;
  const companyId = req.company._id;
  req.body.updatedBy = companyId;

  // ✅ التعديل هنا: الرفع الفعلي على Cloudinary
  if (req.file) {
    try {
      // بنرفع الملف من المسار المؤقت اللي Multer عمله لـ Cloudinary
      const { secure_url } = await cloudinary.uploader.upload(req.file.path, {
        folder: `intern-app/internships/${internshipId}`, // اختياري: لتنظيم الفولدرات هناك
      });
      
      // دلوقتي بناخد الرابط الحقيقي اللي راجع من كلاوديناري ونحطه في الـ body
      req.body.thumbnail = secure_url;
      
    } catch (error) {
      return next(new Error("Failed to upload image to Cloudinary", { cause: 500 }));
    }
  }

  const internship = await internshipModel.findOneAndUpdate(
    { _id: internshipId, companyId },
    req.body,
    { new: true },
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

  const internship = await internshipModel.findById(internshipId);

  if (!internship) {
    return next(new Error("Internship not found", { cause: 404 }));
  }

  // ✅ لو Company → لازم تكون مالكة الإنترنشيب
  if (req.company) {
    if (
      internship.companyId.toString() !== req.company._id.toString()
    ) {
      return next(
        new Error("You are not authorized to delete this internship", {
          cause: 403,
        }),
      );
    }
  }

  // ✅ لو User → لازم يكون Admin فقط
  else if (req.user?.role !== roles.admin) {
    return next(
      new Error("You are not authorized to delete this internship", {
        cause: 403,
      }),
    );
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

  if (internships.length === 0) {
    return next(new Error("No internships found", { cause: 404 }));
  }

  const internshipIds = internships.map((internship) => internship._id);

  const approvalAggregation = await internshipApprovalModel.aggregate([
    {
      $match: {
        internshipId: { $in: internshipIds },
      },
    },
    {
      $group: {
        _id: "$internshipId",
        approvals: {
          $push: {
            universityId: { $toString: "$universityId" },
            status: "$status",
          },
        },
      },
    },
  ]);

  const approvalsByInternshipId = new Map(
    approvalAggregation.map((item) => [
      item._id.toString(),
      item.approvals || [],
    ]),
  );

  const partnerUniversityIdsMap = new Map();
  const universityStatusesMap = new Map();
  const sentUniversityIdsMap = new Map();

  for (const [internshipId, approvals] of approvalsByInternshipId.entries()) {
    const partnerUniversityIds = [];
    const universityStatuses = {};
    const sentUniversityIds = [];

    for (const approval of approvals) {
      const universityId = approval?.universityId?.toString?.() || approval?.universityId;
      if (!universityId) {
        continue;
      }

      universityStatuses[universityId] = approval.status;

      if (["pending", "approved"].includes(approval.status)) {
        sentUniversityIds.push(universityId);
      }

      if (approval.status === "approved") {
        partnerUniversityIds.push(universityId);
      }
    }

    partnerUniversityIdsMap.set(internshipId, [
      ...new Set(partnerUniversityIds),
    ]);
    universityStatusesMap.set(internshipId, universityStatuses);
    sentUniversityIdsMap.set(internshipId, [...new Set(sentUniversityIds)]);
  }

  // === الجديد هنا: حساب عدد الطلبة والتقارير لكل تدريب بالتوازي ===
  const internshipsWithStats = await Promise.all(
    internships.map(async (internship) => {
      // 1. جمع كل placements النشطة الخاصة بالتدريب الحالي
      const ongoingPlacementIds = await placementModel.distinct("_id", {
        internshipId: internship._id,
        status: "ongoing",
      });

      const studentsCount = ongoingPlacementIds.length;

      // 2. عدد الطلبة الذين لديهم تقرير واحد على الأقل
      const evaluatedPlacementIds =
        studentsCount > 0
          ? await reportModel.distinct("placementId", {
            placementId: { $in: ongoingPlacementIds },
          })
          : [];

      const evaluatedStudentsCount = evaluatedPlacementIds.length;

      // 3. التقارير المعلقة = الطلبة النشطين - الطلبة الذين تم تقييمهم
      const pendingReportsCount = Math.max(
        studentsCount - evaluatedStudentsCount,
        0,
      );

      // دمج الإحصائيات مع بيانات الإنترن الأصلية
      return {
        ...internship,
        studentsCount,
        pendingReportsCount,
        partnerUniversityIds:
          partnerUniversityIdsMap.get(internship._id.toString()) || [],
        sentUniversityIds:
          sentUniversityIdsMap.get(internship._id.toString()) || [],
        universityStatuses:
          universityStatusesMap.get(internship._id.toString()) || {},
      };
    }),
  );
  // ===============================================================

  const totalCount = await internshipModel.countDocuments(query);

  return res.status(200).json({
    success: true,
    message: "Internships fetched successfully",
    data: internshipsWithStats,
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

  // Get saved internships for user
  // const user = await userModel
  //   .findById(req.user._id)
  //   .select("savedInternships");
  // const savedIds = user?.savedInternships?.map((id) => id.toString()) || [];

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
      // isSaved: savedIds.includes(internshipId),
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

// ========================== get Filter Internships ==========================
export const getFilteredInternships = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 6, sort = "-createdAt", ...filters } = req.query;
  const skip = (page - 1) * limit;

  // Get saved internships for user
  const user = await userModel
    .findById(req.user._id)
    .select("savedInternships");
  const savedInternshipsIds = user?.savedInternships || [];

  const internships = await internshipModel
    .find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("companyId", "companyName")
    .aggregate([
      {
        $addFields: {
          isSaved: { $in: ["$_id", savedInternshipsIds] },
        },
      },
    ]);

  const totalCount = await internshipModel.countDocuments(filters);

  if (internships.length === 0) {
    return next(new Error("No internships found", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    message: "internships fetched successfully",
    data: internships,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
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
export const getRecommendedInternships = asyncHandler(
  async (req, res, next) => {
    const user = await userModel
      .findById(req.user._id)
      .select("skills address")
      .lean();

    if (!user) {
      return next(new Error("User not found", { cause: 404 }));
    }

    // normalize user skills
    const userSkills = (user.skills || []).map((s) => s.toLowerCase().trim());

    const internships = await internshipModel
      .find({ deletedAt: { $exists: false } })
      .populate("companyId", "companyName logo")
      .lean();

    const scored = internships.map((i) => {
      const internshipSkills = (i.technicalSkills || []).map((s) =>
        s.toLowerCase().trim(),
      );

      // matching
      const matchedSkills = internshipSkills.filter((skill) =>
        userSkills.includes(skill),
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
        (Date.now() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24);

      const recencyScore = Math.max(0, 0.2 - ageDays * 0.001);

      const matchScore = Number(
        (skillScore * 0.6 + locationScore + recencyScore).toFixed(2),
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
  },
);

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
        (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1),
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
      new Error("You can only review internships you have applied to", {
        cause: 403,
      }),
    );
  }

  const existing = await reviewModel.findOne({
    internshipId,
    userId: req.user._id,
  });
  if (existing) {
    return next(
      new Error("You have already reviewed this internship", { cause: 409 }),
    );
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
      new Error("You are not authorized to perform this action", {
        cause: 403,
      }),
    );
  }

  const populatedInternship = await internship.populate([
    {
      path: "Applications",
      options: { sort, skip: Number(skip), limit: Number(limit) },
      populate: { path: "userId", select: "username email" },
    },
  ]);

  const totalCount = await applicationModel.countDocuments({
    internshipId: internship._id,
  });

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

  // 1. جلب بيانات التدريب والتأكد من وجوده
  const internship = await internshipModel
    .findById(internshipId)
    .select(
      "status closed companyId internshipTitle technicalSkills internshipDescription",
    );

  if (!internship) {
    return next(new Error("Internship not found", { cause: 404 }));
  }

  // 2. التحقق من حالة التدريب
  const isOpen = internship.status
    ? ["onboarding", "active", "starting_soon"].includes(internship.status)
    : !internship.closed;

  if (!isOpen) {
    return next(
      new Error("Internship not open for applications", { cause: 409 }),
    );
  }

  // 3. منع التقديم المتكرر
  const alreadyApplied = await applicationModel.exists({
    internshipId,
    userId: req.user._id,
  });

  if (alreadyApplied) {
    return next(
      new Error("You have already applied for this internship", { cause: 409 }),
    );
  }

  // 4. جلب بيانات الطالب (البروفايل والمشاريع)
  const student = await studentModel
    .findOne({ userId: req.user._id })
    .select("university projects resume skills");

  if (!student) {
    return next(new Error("student profile not found", { cause: 404 }));
  }

  // 5. التحقق من السيرة الذاتية
 // 5. التحقق من السيرة الذاتية وتجهيز الرابط
  let finalResumeUrl = student.resume?.secure_url;

  // لو الطالب رفع ملف جديد في الريكويست ده
  if (req.file) {
    // هنا المفروض تكتب كود الرفع على Cloudinary أو أي Storage
    // const { secure_url } = await cloudinary.uploader.upload(req.file.path, ...);
    // finalResumeUrl = secure_url; 
    
    // مؤقتاً للتبسيط لو بتسيف local:
    finalResumeUrl = req.file.path; 
  }

  if (!finalResumeUrl) {
    return next(new Error("resume is required", { cause: 400 }));
  }

  // 6. تجهيز مصفوفة المهارات (Skills) مع دعم form-data
  let skillsArr = [];
  if (Array.isArray(skills)) {
    skillsArr = skills.map((s) => String(s).trim()).filter(Boolean);
  } else if (typeof skills === "string" && skills.trim()) {
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) {
        skillsArr = parsed.map((s) => String(s).trim()).filter(Boolean);
      } else {
        skillsArr = skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } catch {
      skillsArr = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } else {
    skillsArr = Array.isArray(student.skills)
      ? student.skills.map((s) => String(s).trim()).filter(Boolean)
      : [];
  }

  // 7. إنشاء طلب التقديم (Application)
  try {
    const application = await applicationModel.create({
      internshipId,
      userId: req.user._id,
      companyId: internship.companyId,
      coverLetter: coverLetter?.trim() || null,
      skills: skillsArr,
      snapshot: {
        studentName: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        university: student.university,
        skills: skillsArr,
        resumeUrl: student.resume.secure_url,
      },
    });

    // 🚀 تشغيل الـ AI Analysis في الخلفية (Background Task)
    analyzeApplicationWithAI(
      {
        skills: skillsArr,
        bio: req.user.bio || "",
        projects: student.projects || [],
        university: student.university,
      },
      {
        internshipTitle: internship.internshipTitle,
        technicalSkills: internship.technicalSkills,
        internshipDescription: internship.internshipDescription,
      },
    )
      .then(async (aiResult) => {
        // تحديث الـ Database بالتحليل التفصيلي (Strengths & Areas for review)
        await applicationModel.findByIdAndUpdate(application._id, {
          "aiAnalysis.score": aiResult.score,
          "aiAnalysis.label": aiResult.label,
          "aiAnalysis.keyStrengths": aiResult.keyStrengths, // مصفوفة نقط القوة
          "aiAnalysis.areasForReview": aiResult.areasForReview, // مصفوفة التحذيرات
          "aiAnalysis.summary": aiResult.summary, // الملخص
          "aiAnalysis.processedAt": new Date(),
        });
        console.log(
          `✅ AI Detailed Ranking completed for application: ${application._id}`,
        );
      })
      .catch((err) => {
        console.error("❌ AI Analysis background error:", err);
      });

    // 8. الرد السريع على الطالب
    return res.status(201).json({
      success: true,
      message: "Application submitted. AI is analyzing your profile now.",
      applicationId: application._id,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return next(
        new Error("You have already applied for this internship", {
          cause: 409,
        }),
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

  // Authorization check (guard against missing company owner/HRs fields)
  const requesterId = String(req.user?._id || "");
  const companyData = application?.internshipId?.companyId;
  const ownerId = companyData?.createdBy ? String(companyData.createdBy) : null;
  const hrIds = Array.isArray(companyData?.HRs)
    ? companyData.HRs.map((id) => String(id))
    : [];
  const isAuthorized =
    (ownerId && ownerId === requesterId) || hrIds.includes(requesterId);

  if (!isAuthorized) {
    return next(
      new Error("You are not authorized to perform this action", {
        cause: 403,
      }),
    );
  }

  application.status = status;
  await application.save();

  emailEvent.emit("sendApplicationStatus", application.userId.email, status);

  return res.status(200).json({
    success: true,
    message: "Application responded successfully",
    data: application,
  });
});

// ========================== Get Student Internships ==========================
export const getStudentInternships = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const today = new Date();

  // =========================
  // Get Student Profile
  // =========================
  const studentProfile = await studentModel.findOne({
    userId: req.user._id,
  });

  if (!studentProfile) {
    return next(new Error("Student profile not found", { cause: 404 }));
  }

  // =========================
  // Status Filter
  // =========================
  let statusFilter = {};

  if (status === internshipStatus.inProgress) {
    statusFilter.endDate = { $gte: today };
  } else if (status === internshipStatus.completed) {
    statusFilter.endDate = { $lt: today };
  }

  // =========================
  // Student Applications
  // =========================
  const applications = await applicationModel
    .find({ userId: req.user._id })
    .select("internshipId")
    .lean();

  const internshipIds = applications.map(
    (app) => app.internshipId
  );

  // =========================
  // Total Count
  // =========================
  const totalCount = await internshipModel.countDocuments({
    _id: { $in: internshipIds },
    ...statusFilter,
  });

  // =========================
  // Get Internships
  // =========================
  const internships = await internshipModel
    .find({
      _id: { $in: internshipIds },
      ...statusFilter,
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("companyId", "companyName")
    .lean();

  // =========================
  // Get Reports
  // =========================
  const reports = await internshipReportModel
    .find({
      studentId: studentProfile._id,
    })
    .select(
      "_id internshipId title status createdAt overallRating"
    )
    .lean();

  const reportsMap = new Map();

  reports.forEach((report) => {
    reportsMap.set(
      report.internshipId.toString(),
      report
    );
  });

  // =========================
  // Build Response
  // =========================
  const msPerDay = 24 * 60 * 60 * 1000;

  const data = internships.map((internship) => {
    const start = new Date(internship.startDate);
    const end = new Date(internship.endDate);

    const totalWeeks = Math.ceil(
      (end - start) / msPerDay / 7
    );

    const currentWeek = Math.max(
      0,
      Math.min(
        Math.ceil((today - start) / msPerDay / 7),
        totalWeeks
      )
    );

    const progress =
      totalWeeks > 0
        ? Math.round((currentWeek / totalWeeks) * 100)
        : 0;

    // =========================
    // Report
    // =========================
    const report = reportsMap.get(
      internship._id.toString()
    );

    // =========================
    // Certificate
    // =========================
    const certificate =
      studentProfile.certificates?.find(
        (cert) =>
          cert.internshipId?.toString() ===
          internship._id.toString()
      );

    return {
      id: internship._id,

      title: internship.internshipTitle,

      company: {
        id: internship.companyId?._id,
        name: internship.companyId?.companyName,
      },

      location: internship.internshipLocation,

      thumbnail: internship.thumbnail || "",

      startDate: internship.startDate,

      endDate: internship.endDate,

      currentWeek,

      totalWeeks,

      progress,

      status: report
        ? "completed"
        : internship.endDate >= today
        ? "inProgress"
        : "completed",

      report: report
        ? {
            id: report._id,
            title: report.title,
            status: report.status,
            overallRating: report.overallRating,
            createdAt: report.createdAt,
          }
        : null,

      certificate: certificate
        ? {
            url: certificate.url,
            issuedAt: certificate.date,
          }
        : null,
    };
  });

  return res.status(200).json({
    success: true,
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: totalCount,
    },
  });
});

// ========================== Toggle Save Internship ==========================
export const toggleSaveInternship = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;

  const internship = await internshipModel.findOne({
    _id: internshipId,
    deletedAt: { $exists: false },
  });

  if (!internship) {
    return next(new Error("Internship not found", { cause: 404 }));
  }

  const user = await userModel.findById(req.user._id);

  const alreadySaved = user.savedInternships.some(
    (id) => id.toString() === internshipId
  );

  if (alreadySaved) {
    user.savedInternships = user.savedInternships.filter(
      (id) => id.toString() !== internshipId
    );
  } else {
    user.savedInternships.push(internshipId);
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: alreadySaved
      ? "Internship removed from saved"
      : "Internship saved successfully",
  });
});

// ========================== Get Saved Internships ==========================
export const getSavedInternships = asyncHandler(async (req, res, next) => {
  const user = await userModel
    .findById(req.user._id)
    .populate({
      path: "savedInternships",
      match: { deletedAt: { $exists: false } },
      populate: {
        path: "companyId",
        select: "companyName logo",
      },
    });

  return res.status(200).json({
    success: true,
    data: user.savedInternships,
  });
});