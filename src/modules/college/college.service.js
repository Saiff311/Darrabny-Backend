import collegeModel from "../../DB/models/college.model.js";
import internshipApprovalModel from "../../DB/models/internshipApproval.model.js";
import applicationModel from "../../DB/models/application.model.js";
import internshipModel from "../../DB/models/internship.model.js";
import companyModel from "../../DB/models/company.model.js";
import cloudinary from "../../utils/cloudinary.js";
import { internshipStatus, appStatus, roles } from "../../utils/enums.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";
import jwt from "jsonwebtoken";
import { compare } from "../../utils/security/hashing.js";

export const addCollege = asyncHandler(async (req, res, next) => {
  const { collegeName, collegeEmail } = req.body;
  if (
    await collegeModel.findOne({ $or: [{ collegeName }, { collegeEmail }] })
  ) {
    return next(
      new Error("College email or name already exists!", { cause: 409 }),
    );
  }
  req.body.createdBy = req.user._id;
  // req.body.numberOfEmployees = JSON.parse(req.body.numberOfEmployees)
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "college-attachments",
    },
  );
  const attachment = {
    secure_url,
    public_id,
  };
  req.body.legalAttachment = attachment;
  const newCollege = await collegeModel.create(req.body);
  return res.json({ msg: "College added successfully", newCollege });
});

export const updateCollege = asyncHandler(async (req, res, next) => {
  const { collegeId } = req.params;
  const { collegeName, collegeEmail } = req.body;
  const college = await collegeModel.findById({
    _id: collegeId,
    createdBy: req.user._id,
    deletedAt: {
      $exists: false,
    },
  });
  if (college.bannedAt) {
    return next(new Error("College is banned", { cause: 403 }));
  }
  if (collegeEmail && collegeEmail !== college.collegeEmail) {
    const existCollege = await collegeModel.findOne({ collegeEmail });
    if (existCollege) {
      return next(new Error("College email already exists!", { cause: 409 }));
    }
  }
  if (collegeName && collegeName !== college.collegeName) {
    const existCollege = await collegeModel.findOne({ collegeName });
    if (existCollege) {
      return next(new Error("College name already exists!", { cause: 409 }));
    }
  }
  Object.assign(college, req.body);
  await college.save();
  return res.json({ msg: "College updated successfully", college });
});

export const softDeleteCollege = asyncHandler(async (req, res, next) => {
  const { collegeId } = req.params;
  const college = await collegeModel.findById({
    _id: collegeId,
    deletedAt: {
      $exists: false,
    },
  });
  if (!college) {
    return next(new Error("College not found", { cause: 404 }));
  }
  if (
    req.user.role !== roles.admin &&
    req.user._id.toString() !== college.createdBy.toString()
  ) {
    return next(
      new Error("You are not authorized to perform this action!", {
        cause: 403,
      }),
    );
  }
  college.deletedAt = new Date();
  await college.save();
  return res.json({ msg: "College deleted successfully", college });
});

export const getCollege = asyncHandler(async (req, res, next) => {
  const { collegeId } = req.params;
  const college = await collegeModel
    .findById({
      _id: collegeId,
      deletedAt: {
        $exists: false,
      },
    })
    .populate({
      path: "jobs",
      match: {
        deletedAt: { $exists: false },
      },
    });
  if (!college) {
    return next(new Error("College not found!", { cause: 404 }));
  }
  return res.json({ msg: "College fetched successfully", college });
});

export const getCollegeByName = asyncHandler(async (req, res, next) => {
  const { name } = req.query;
  const college = await collegeModel.find({
    collegeName: {
      $regex: name,
      $options: "i",
    },
    deletedAt: {
      $exists: false,
    },
  });
  if (!college) {
    return next(new Error("College not found!", { cause: 404 }));
  }
  return res.json({ msg: "College fetched successfully", college });
});

export const uploadCollegeLogo = asyncHandler(async (req, res, next) => {
  const { collegeId } = req.params;
  const college = await collegeModel.findOne({
    _id: collegeId,
    deletedAt: {
      $exists: false,
    },
    createdBy: req.user._id,
  });
  if (!college) {
    return next(new Error("College not found!", { cause: 404 }));
  }
  if (college.bannedAt) {
    return next(new Error("College is banned!", { cause: 403 }));
  }
  if (college.logo.public_id) {
    await cloudinary.uploader.destroy(college.logo.public_id);
  }
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "logo pics",
    },
  );
  const logo = { secure_url, public_id };
  await collegeModel.updateOne({ _id: collegeId }, { logo });
  return res.status(200).json({ msg: "Logo Pic uploaded successfully" });
});

export const UploadCollegeCover = asyncHandler(async (req, res, next) => {
  const { collegeId } = req.params;
  const college = await collegeModel.findOne({
    _id: collegeId,
    deletedAt: {
      $exists: false,
    },
    createdBy: req.user._id,
  });
  if (!college) {
    return next(new Error("College not found!", { cause: 404 }));
  }
  if (college.bannedAt) {
    return next(new Error("College is banned!", { cause: 403 }));
  }
  if (college.coverPic.public_id) {
    await cloudinary.uploader.destroy(college.coverPic.public_id);
  }
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "coverCollege pics",
    },
  );
  const coverPic = { secure_url, public_id };
  await collegeModel.updateOne({ _id: collegeId }, { coverPic });
  return res.status(200).json({ msg: "Logo Pic uploaded successfully" });
});

export const deleteCollegeLogo = asyncHandler(async (req, res, next) => {
  const { collegeId } = req.params;
  const college = await collegeModel.findOne({
    _id: collegeId,
    deletedAt: {
      $exists: false,
    },
    createdBy: req.user._id,
  });
  if (!college) {
    return next(new Error("College not found!", { cause: 404 }));
  }
  if (college.bannedAt) {
    return next(new Error("College is banned!", { cause: 403 }));
  }
  if (college.logo.public_id) {
    await cloudinary.uploader.destroy(college.logo.public_id);
  }
  await collegeModel.updateOne({ _id: collegeId }, { $unset: { logo: "" } });
  return res.status(200).json({ msg: "Logo deleted successfully" });
});

export const deleteCollegeCover = asyncHandler(async (req, res, next) => {
  const { collegeId } = req.params;
  const college = await collegeModel.findOne({
    _id: collegeId,
    deletedAt: {
      $exists: false,
    },
    createdBy: req.user._id,
  });
  if (!college) {
    return next(new Error("College not found!", { cause: 404 }));
  }
  if (college.bannedAt) {
    return next(new Error("College is banned!", { cause: 403 }));
  }
  if (college.coverPic.public_id) {
    await cloudinary.uploader.destroy(college.coverPic.public_id);
  }
  await collegeModel.updateOne(
    { _id: collegeId },
    { $unset: { coverPic: "" } },
  );
  return res.status(200).json({ msg: "Cover Pic deleted successfully" });
});

export const collegeSignup = asyncHandler(async (req, res, next) => {
  const {
    collegeName,
    collegeEmail,
    password,
    confirmPassword,
    address,
    departments,
  } =
    req.body;

  const existingCollege = await collegeModel.findOne({
    $or: [{ collegeName }, { collegeEmail }],
  });

  if (existingCollege) {
    return next(
      new Error("College email or name already exists!", { cause: 409 }),
    );
  }

  if (password !== confirmPassword) {
    return next(
      new Error("Password and confirm password must match", { cause: 400 }),
    );
  }

  delete req.body.confirmPassword;

  const college = await collegeModel.create({
    collegeName,
    collegeEmail,
    password,
    address,
    departments,
  });

  return res.status(201).json({
    success: true,
    message: "College registered successfully.",
    data: {
      id: college._id,
      collegeName: college.collegeName,
      collegeEmail: college.collegeEmail,
      isVerified: college.isVerified,
    },
  });
});

export const collegeSignin = asyncHandler(async (req, res, next) => {
  const { collegeEmail, password } = req.body;
  const role = "college";

  const college = await collegeModel.findOne({
    collegeEmail,
    deletedAt: { $exists: false },
  });

  if (!college) {
    return next(new Error("Invalid email or password", { cause: 401 }));
  }

  if (college.bannedAt) {
    return next(new Error("College is banned", { cause: 403 }));
  }

  const isMatch = await compare(password, college.password);

  if (!isMatch) {
    return next(new Error("Invalid email or password", { cause: 401 }));
  }

  if (!process.env.COLLEGE_SECRET_KEY) {
    return next(
      new Error("COLLEGE_SECRET_KEY is not configured", { cause: 500 }),
    );
  }

  const token = jwt.sign(
    { id: college._id, role },
    process.env.COLLEGE_SECRET_KEY,
    { expiresIn: "7d" },
  );

  res.cookie("collegeToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    data: {
      id: college._id,
      collegeName: college.collegeName,
      collegeEmail: college.collegeEmail,
      role,
    },
  });
});


// ========================== Get All Universities ==========================
export const getAllUniversities = asyncHandler(async (req, res, next) => {
  const { name } = req.query;

  const query = {
    deletedAt: { $exists: false },
    bannedAt: { $exists: false },
  };

  if (name?.trim()) {
    query.collegeName = { $regex: name.trim(), $options: "i" };
  }

  const universities = await collegeModel
    .find(query)
    .select("_id collegeName collegeEmail logo address role")
    .sort({ collegeName: 1 })
    .lean();

  return res.status(200).json({
    success: true,
    message: "Universities fetched successfully",
    data: universities,
  });
});

//get pending endorsement requests for the authenticated university
export const getPendingEndorsements = asyncHandler(async (req, res, next) => {
  const universityId = req.college?._id;

  if (!universityId) {
    return next(new Error("College authentication required", { cause: 401 }));
  }

  const endorsements = await internshipApprovalModel
    .find({
      universityId,
      status: "pending",
    })
    .populate({
      path: "companyId",
      select: "companyName logo",
    })
    .populate({
      path: "internshipId",
      select:
        "internshipTittle internshipDescription internshipLocation workingTime technicalSkills softSkills startDate endDate durationInMonths thumbnail status",
    })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    message: "Pending endorsement requests fetched successfully",
    data: endorsements,
  });
});


//respond to endorsement request (approve/reject) by university
export const respondToEndorsementRequest = asyncHandler(async (req, res, next) => {
  const universityId = req.college?._id;
  const { requestId } = req.params;
  const { status } = req.body;
  if (!universityId) {
    return next(new Error("College authentication required", { cause: 401 }));
  }

  // 1. التأكد إن الـ status اللي مبعوتة صحيحة
  if (!["approved", "rejected"].includes(status)) {
    return next(new Error("Invalid status. Must be 'approved' or 'rejected'", { cause: 400 }));
  }

  // 2. البحث عن الطلب والتأكد إنه يخص هذه الجامعة بالذات
  const request = await internshipApprovalModel.findOne({
    _id: requestId,
    universityId,
    status: "pending", // مسموح للكلية ترد بس لو الحالة لسه pending
  });

  if (!request) {
    return next(
      new Error("Endorsement request not found, already processed, or not authorized", {
        cause: 404,
      })
    );
  }

  // 3. تحديث الحالة
  request.status = status;
  await request.save();

  // (اختياري) ممكن هنا تعمل Log أو تبعت Notification للشركة إن طلبها اترد عليه

  return res.status(200).json({
    success: true,
    message: `Internship endorsement has been ${status} successfully`,
    data: request,
  });
});

export const getCollegeInternsReports = asyncHandler(async (req, res, next) => {
  const universityId = req.college?._id;

  if (!universityId) {
    return next(new Error("College authentication required", { cause: 401 }));
  }

  const approvedInternships = await internshipApprovalModel
    .find({
      universityId,
      status: "approved",
    })
    .populate({
      path: "internshipId",
      select:
        "internshipTittle internshipDescription internshipLocation workingTime technicalSkills softSkills startDate endDate durationInMonths thumbnail status companyId",
      populate: {
        path: "reports",
        select:
          "studentId title periodStart periodEnd status keyAchievements challengesFaced learningOutcomes technicalSkillScore problemSolvingScore communicationScore initiativeScore internalNote approvedAt createdAt updatedAt",
        populate: {
          path: "studentId",
          select: "firstName lastName email profilePic skills",
        },
      },
    });

  if (!approvedInternships.length) {
    return res.status(200).json({
      success: true,
      message: "No approved internships found for this college",
      data: [],
    });
  }

  const internshipIds = approvedInternships
    .map((item) => item.internshipId?._id)
    .filter(Boolean);

  const applications = await applicationModel
    .find({
      internshipId: { $in: internshipIds },
    })
    .populate({
      path: "userId",
      select: "firstName lastName email profilePic skills",
    })
    .lean();

  const acceptedApplications = applications.filter((application) => {
    const latestStatus = application.timeline?.[application.timeline.length - 1]?.status;
    return latestStatus === appStatus.accepted;
  });

  const data = approvedInternships
    .map((approval) => {
      const internship = approval.internshipId;

      if (!internship) {
        return null;
      }

      const internshipApplications = acceptedApplications.filter(
        (application) => String(application.internshipId) === String(internship._id),
      );

      const internshipReports = internship.reports || [];

      const interns = internshipApplications.map((application) => {
        const studentId = String(application.userId?._id || application.userId);

        const reports = internshipReports.filter((report) => {
          const reportStudentId = String(report.studentId?._id || report.studentId);
          return reportStudentId === studentId;
        });

        return {
          applicationId: application._id,
          student: application.userId
            ? {
              id: application.userId._id,
              fullName: `${application.userId.firstName} ${application.userId.lastName}`,
              firstName: application.userId.firstName,
              lastName: application.userId.lastName,
              email: application.userId.email,
              profilePic: application.userId.profilePic,
              skills: application.userId.skills || [],
            }
            : null,
          reports,
        };
      });

      return {
        internship: {
          id: internship._id,
          title: internship.internshipTittle,
          description: internship.internshipDescription,
          location: internship.internshipLocation,
          workingTime: internship.workingTime,
          technicalSkills: internship.technicalSkills,
          softSkills: internship.softSkills,
          startDate: internship.startDate,
          endDate: internship.endDate,
          durationInMonths: internship.durationInMonths,
          thumbnail: internship.thumbnail,
          status: internship.status,
        },
        interns,
      };
    })
    .filter(Boolean);

  return res.status(200).json({
    success: true,
    message: "College interns reports fetched successfully",
    data,
  });
});

// ========================== Get College Dashboard ==========================
export const getCollegeDashboard = asyncHandler(async (req, res, next) => {
  const collegeId = req.college?._id;

  const college = await collegeModel.findById(collegeId);
  if (!college) {
    return next(new Error("College not found", { cause: 404 }));
  }

  // ================================
  // STEP 1: Get internships scope
  // ================================
  const approvedInternships = await internshipApprovalModel
    .find({
      universityId: collegeId,
      status: "approved",
    })
    .select("internshipId")
    .lean();

  const internshipIds = approvedInternships.map((i) => i.internshipId);

  // لو مفيش internships
  if (!internshipIds.length) {
    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalApplicants: 0,
          totalCompletedTrainees: 0,
          acceptanceRate: 0,
        },
        verificationStatus: {
          isVerified: college.isVerified,
          approvedByAdmin: college.approvedByAdmin,
          validUntil: college.validUntil || null,
        },
        ongoingInternships: [],
        academicPartners: [],
      },
    });
  }

  // ================================
  // STEP 2: SINGLE AGGREGATION (applications)
  // ================================
  const statsAgg = await applicationModel.aggregate([
    {
      $match: {
        internshipId: { $in: internshipIds },
      },
    },

    {
      $facet: {
        total: [{ $count: "count" }],

        accepted: [
          { $match: { "timeline.status": appStatus.accepted } },
          { $count: "count" },
        ],
      },
    },
  ]);

  const totalApplications = statsAgg[0]?.total[0]?.count || 0;
  const acceptedApplications = statsAgg[0]?.accepted[0]?.count || 0;

  const acceptanceRate =
    totalApplications === 0
      ? 0
      : Math.round((acceptedApplications / totalApplications) * 100);

  // ================================
  // STEP 3: Completed Trainees (1 query)
  // ================================
  const totalCompletedTrainees = await internshipModel.countDocuments({
    _id: { $in: internshipIds },
    status: internshipStatus.completed,
  });

  // ================================
  // STEP 4: Ongoing Internships (lean + populate)
  // ================================
  const ongoingInternships = await internshipModel
    .find({
      _id: { $in: internshipIds },
      status: { $ne: internshipStatus.completed },
    })
    .populate("companyId", "companyName logo industry")
    .lean();

  // ================================
  // STEP 5: Academic Partners (unique companies)
  // ================================
  const companyIds = [
    ...new Set(ongoingInternships.map((i) => i.companyId?._id)),
  ];

  const academicPartners = await companyModel
    .find({
      _id: { $in: companyIds },
      deletedAt: { $exists: false },
    })
    .select("companyName logo industry")
    .lean();


  // ================================
  // STEP 6: number of applicants per internship 
  // ================================
  const applicantsPerInternship = await applicationModel.aggregate([
    {
      $match: {
        internshipId: { $in: internshipIds },
      },
    },
    {
      $group: {
        _id: "$internshipId",
        count: { $sum: 1 },
      },
    },
  ]);

  const applicantsMap = new Map(
    applicantsPerInternship.map((i) => [i._id.toString(), i.count]),
  );

  // ================================
  // STEP 7: RESPONSE
  // ================================
  return res.status(200).json({
    success: true,
    data: {
      stats: {
        totalApplicants: totalApplications,
        totalCompletedTrainees,
        acceptanceRate,
      },

      verificationStatus: {
        isVerified: college.isVerified,
        approvedByAdmin: college.approvedByAdmin,
        validUntil: college.validUntil || null,
      },

      ongoingInternships: ongoingInternships.map((i) => ({
        id: i._id,
        title: i.internshipTittle,
        status: i.status,
        company: i.companyId,
        applicantsCount: applicantsMap.get(i._id.toString()) || 0,
      })),

      academicPartners,
    },
  });
});