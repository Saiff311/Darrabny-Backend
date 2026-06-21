import collegeModel from "../../DB/models/college.model.js";
import internshipApprovalModel from "../../DB/models/internshipApproval.model.js";
import applicationModel from "../../DB/models/application.model.js";
import internshipModel from "../../DB/models/internship.model.js";
import internshipReportModel from "../../DB/models/internshipReport.model.js";
import studentModel from "../../DB/models/student.model.js";
import companyModel from "../../DB/models/company.model.js";
import partnershipModel from "../../DB/models/partnership.model.js";
import verificationRequestModel from "../../DB/models/verificationRequest.model.js";
import verificationDocumentModel from "../../DB/models/verificationDocument.model.js";
import cloudinary from "../../utils/cloudinary.js";
import { internshipStatus, appStatus, roles } from "../../utils/enums.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";
import jwt from "jsonwebtoken";
import { compare } from "../../utils/security/hashing.js";
import { escapeRegex } from "../../utils/security/escapeRegax.js";

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

export const getUniversityLogo = asyncHandler(async (req, res, next) => {
  const universityId = req.college?._id;

  if (!universityId) {
    return next(new Error("College authentication required", { cause: 401 }));
  }

  const university = await collegeModel
    .findOne({
      _id: universityId,
      deletedAt: { $exists: false },
    })
    .select("logo")
    .lean();

  if (!university) {
    return next(new Error("University not found", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    data: {
      logo: university.logo?.secure_url || null,
    },
  });
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
  const { email, password } = req.body;
  const role = "college";

  const college = await collegeModel.findOne({
    collegeEmail: email,
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
        "internshipTitle internshipDescription internshipLocation workingTime technicalSkills softSkills startDate endDate durationInMonths thumbnail status",
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

  if (status === "approved") {
    const companyId = request.companyId;
    if (companyId) {
      const existingPartnership = await partnershipModel.findOne({
        universityId,
        companyId,
      });
      if (!existingPartnership) {
        await partnershipModel.create({
          universityId,
          companyId,
          status: "active",
        });
      }
    }
  }

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

  const DEBUG = true;

  const log = (...args) => {
    if (DEBUG) console.log(...args);
  };

  // =========================
  // 1. GET APPROVED INTERNSHIPS
  // =========================
  const approvedInternships = await internshipApprovalModel
    .find({
      universityId,
      status: "approved",
    })
    .populate({
      path: "internshipId",
      select:
        "internshipTitle internshipDescription internshipLocation workingTime technicalSkills softSkills startDate endDate durationInMonths thumbnail status companyId",
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

  log("=== INTERNSHIP IDS ===", internshipIds);

  // =========================
  // 2. GET APPLICATIONS & STUDENTS FROM THIS COLLEGE
  // =========================
  const applications = await applicationModel
    .find({
      internshipId: { $in: internshipIds },
    })
    .populate({
      path: "userId",
      select: "firstName lastName email profilePic skills",
    })
    .lean();

  log("=== TOTAL APPLICATIONS ===", applications.length);

  // filter accepted
  const acceptedApplications = applications.filter((application) => {
    const latestStatus =
      application.timeline?.[application.timeline.length - 1]?.status;

    return latestStatus === appStatus.accepted;
  });

  const userIds = acceptedApplications
    .map((application) =>
      application.userId?._id?.toString() || application.userId?._id?.toString(),
    )
    .filter(Boolean);

  // =========================
  // GET STUDENTS (WITH CERTIFICATES)
  // =========================
  const students = await studentModel
    .find({
      userId: { $in: userIds },
      collegeId: universityId,
    })
    .select("userId _id certificates")
    .lean();

  const validStudentIds = students.map((student) => student._id);

  const userToStudentMap = new Map(
    students.map((student) => [
      student.userId?.toString(),
      student._id?.toString(),
    ]),
  );

  const studentMap = new Map(
    students.map((student) => [
      student._id.toString(),
      student,
    ]),
  );

  log("=== ACCEPTED APPLICATIONS FROM THIS COLLEGE ===", students.length);

  // =========================
  // 3. GET REPORTS (FILTERED BY STUDENTS)
  // =========================
  const reports = await internshipReportModel
    .find({
      internshipId: { $in: internshipIds },
      studentId: { $in: validStudentIds },
    })
    .select(
      "internshipId studentId title periodStart periodEnd status keyAchievements challengesFaced learningOutcomes technicalSkillScore problemSolvingScore communicationScore initiativeScore internalNote approvedAt createdAt updatedAt"
    )
    .populate({
      path: "studentId",
      select: "firstName lastName email profilePic skills",
    })
    .lean();

  log("=== TOTAL REPORTS FOR THIS COLLEGE ===", reports.length);

  // =========================
  // 4. INDEX REPORTS BY INTERNSHIP
  // =========================
  const reportsByInternship = new Map();

  for (const report of reports) {
    const internshipIdStr = report.internshipId?.toString();

    if (!internshipIdStr) continue;

    if (!reportsByInternship.has(internshipIdStr)) {
      reportsByInternship.set(internshipIdStr, []);
    }

    reportsByInternship.get(internshipIdStr).push(report);
  }

  // =========================
  // 5. BUILD RESPONSE
  // =========================
  const data = approvedInternships
    .map((approval) => {
      const internship = approval.internshipId;

      if (!internship) return null;

      const internshipIdStr = internship._id?.toString();

      const internshipApplications = acceptedApplications.filter(
        (application) =>
          application.internshipId?.toString() === internshipIdStr
      );

      const internshipReports =
        reportsByInternship.get(internshipIdStr) || [];

      const reportsByStudent = new Map();

      for (const report of internshipReports) {
        const studentIdStr =
          report.studentId?._id?.toString() ||
          report.studentId?.toString();

        if (!studentIdStr) continue;

        if (!reportsByStudent.has(studentIdStr)) {
          reportsByStudent.set(studentIdStr, []);
        }

        reportsByStudent.get(studentIdStr).push(report);
      }

      const interns = internshipApplications
        .map((application) => {
          const userIdStr =
            application.userId?._id?.toString() ||
            application.userId?.toString();

          const studentIdStr = userToStudentMap.get(userIdStr) || null;

          if (!studentIdStr) return null;

          const studentReports = reportsByStudent.get(studentIdStr) || [];

          const studentData = studentMap.get(studentIdStr);

          const reportsWithCertificates = studentReports.map((report) => {
            const certificate =
              studentData?.certificates?.find(
                (cert) =>
                  cert.internshipId?.toString() ===
                  report.internshipId?.toString()
              ) || null;

            return {
              ...report,
              certificate,
            };
          });

          const studentReport = reportsWithCertificates[0] || null;

          return {
            applicationId: application._id,

            student: application.userId
              ? {
                  id: studentIdStr,
                  fullName: `${application.userId.firstName} ${application.userId.lastName}`,
                  firstName: application.userId.firstName,
                  lastName: application.userId.lastName,
                  email: application.userId.email,
                  profilePic: application.userId.profilePic,
                  skills: application.userId.skills || [],
                }
              : null,

            reports: reportsWithCertificates,

            reportId: studentReport ? studentReport._id : null,
          };
        })
        .filter(Boolean);

      if (interns.length === 0) return null;

      return {
        internship: {
          id: internship._id,
          title: internship.internshipTitle,
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

  // =========================
  // FINAL RESPONSE
  // =========================
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
        title: i.internshipTitle,
        status: i.status,
        company: i.companyId,
        applicantsCount: applicantsMap.get(i._id.toString()) || 0,
      })),

      academicPartners,
    },
  });
});

// ========================= Get College Partners =========================
export const getCollegePartners = asyncHandler(async (req, res, next) => {
  // 1. استخراج الـ ID الخاص بالكلية من التوكن
  const collegeId = req.college?._id;

  if (!collegeId) {
    return next(
      new Error("College authentication required", {
        cause: 401,
      }),
    );
  }

  // 2. تجهيز الـ Pagination
  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 10;

  const safePage = page > 0 ? page : 1;
  const safeLimit = limit > 0 ? limit : 10;
  const skip = (safePage - 1) * safeLimit;

  // 3. جلب معرفات الشركات (الشركاء) من جدول الشراكات بناءً على الكلية
  const partnerships = await partnershipModel
    .find({ universityId: collegeId })
    .select("companyId")
    .lean();

  const partnerCompanyIds = partnerships
    .map((item) => item.companyId)
    .filter(Boolean);

  // لو مفيش أي شركاء، نرجع مصفوفة فاضية
  if (!partnerCompanyIds.length) {
    return res.status(200).json({
      success: true,
      data: {
        companies: [],
        pagination: {
          totalCompanies: 0,
          currentPage: safePage,
          totalPages: 0,
        },
      },
    });
  }

  // 4. تجهيز الفلاتر (البحث، الصناعة، الموقع)
  const { search, industry, location } = req.query;
  const companyQuery = {
    _id: { $in: partnerCompanyIds },
    deletedAt: { $exists: false },
  };

  if (search) {
    companyQuery.companyName = {
      $regex: escapeRegex(search),
      $options: "i",
    };
  }

  if (industry) {
    companyQuery.industry = {
      $regex: escapeRegex(industry),
      $options: "i",
    };
  }

  if (location) {
    companyQuery.address = {
      $regex: escapeRegex(location),
      $options: "i",
    };
  }

  // 5. حساب العدد الإجمالي للشركات (عشان الـ Pagination)
  const totalCompanies = await companyModel.countDocuments(companyQuery);

  if (!totalCompanies) {
    return res.status(200).json({
      success: true,
      data: {
        companies: [],
        pagination: {
          totalCompanies: 0,
          currentPage: safePage,
          totalPages: 0,
        },
      },
    });
  }

  // 6. جلب بيانات الشركات بالعدد والصفحة المطلوبة
  const companies = await companyModel
    .find(companyQuery)
    .select("companyName logo industry address")
    .sort({ companyName: 1 })
    .skip(skip)
    .limit(safeLimit)
    .lean();

  const companyIdsPage = companies.map((company) => company._id);

  // 7. جلب التقييمات للشركات دي وحساب المتوسط
  const ratingsAgg = await internshipReportModel.aggregate([
    {
      $match: {
        overallRating: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "internships",
        localField: "internshipId",
        foreignField: "_id",
        as: "internship",
      },
    },
    {
      $unwind: "$internship",
    },
    {
      $match: {
        "internship.companyId": { $in: companyIdsPage },
      },
    },
    {
      $group: {
        _id: "$internship.companyId",
        avgRating: { $avg: "$overallRating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const ratingsMap = new Map(
    ratingsAgg.map((item) => [item._id.toString(), item]),
  );

  // 8. تجميع البيانات النهائية
  const data = companies.map((company) => {
    const ratingInfo = ratingsMap.get(company._id.toString()) || {};
    const rating = ratingInfo.avgRating
      ? Number(ratingInfo.avgRating.toFixed(2))
      : 0;
    const reviewCount = ratingInfo.reviewCount || 0;

    return {
      companyId: company._id,
      companyName: company.companyName,
      logoUrl: company.logo?.secure_url || null,
      rating,
      reviewCount,
      isTopPartner: rating >= 4.5 && reviewCount > 50,
      industry: company.industry || null,
      location: company.address || null,
      coreCompetencies: [], // تقدر تملاها بعدين لو ليها موديل خاص أو موجودة جوه الـ company
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      companies: data,
      pagination: {
        totalCompanies,
        currentPage: safePage,
        totalPages: Math.ceil(totalCompanies / safeLimit),
      },
    },
  });
});

// ========================= Get College Settings =========================
export const getCollegeSettings = asyncHandler(async (req, res, next) => {
  const collegeId = req.college?._id;

  if (!collegeId) {
    return next(new Error("College authentication required", { cause: 401 }));
  }

  const college = await collegeModel
    .findById(collegeId)
    .select("collegeName collegeEmail address notifications");

  if (!college) {
    return next(new Error("College not found", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    data: college,
  });
});

// ========================= Update College Settings =========================
export const updateCollegeSettings = asyncHandler(async (req, res, next) => {
  const collegeId = req.college?._id;
  const { collegeName, collegeEmail, address } = req.body;

  if (!collegeId) {
    return next(new Error("College authentication required", { cause: 401 }));
  }

  const currentCollege = await collegeModel.findById(collegeId);
  if (!currentCollege) {
    return next(new Error("College not found", { cause: 404 }));
  }

  if (currentCollege.deletedAt || currentCollege.bannedAt) {
    return next(new Error("College is deleted or banned", { cause: 403 }));
  }

  if (collegeEmail && collegeEmail !== currentCollege.collegeEmail) {
    const emailExists = await collegeModel.findOne({
      collegeEmail,
      _id: { $ne: collegeId },
    });
    if (emailExists) {
      return next(new Error("Email already exists", { cause: 409 }));
    }
  }

  if (collegeName && collegeName !== currentCollege.collegeName) {
    const nameExists = await collegeModel.findOne({
      collegeName,
      _id: { $ne: collegeId },
    });
    if (nameExists) {
      return next(new Error("College name already exists", { cause: 409 }));
    }
  }

  const updates = {};
  if (collegeName !== undefined) updates.collegeName = collegeName;
  if (collegeEmail !== undefined) updates.collegeEmail = collegeEmail;
  if (address !== undefined) updates.address = address;

  const updatedCollege = await collegeModel.findByIdAndUpdate(
    collegeId,
    updates,
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    success: true,
    message: "College settings updated successfully",
    data: updatedCollege,
  });
});

// ========================= Update Notification Preferences =========================
export const updateNotificationPreferences = asyncHandler(
  async (req, res, next) => {
    const collegeId = req.college?._id;
    const { email, push } = req.body;

    if (!collegeId) {
      return next(new Error("College authentication required", { cause: 401 }));
    }

    const updates = {};
    if (email !== undefined) updates["notifications.email"] = email;
    if (push !== undefined) updates["notifications.push"] = push;

    const updatedCollege = await collegeModel
      .findByIdAndUpdate(
        collegeId,
        { $set: updates },
        {
          new: true,
          runValidators: true,
        },
      )
      .select("collegeName notifications");

    if (!updatedCollege) {
      return next(new Error("College not found", { cause: 404 }));
    }

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      data: updatedCollege,
    });
  },
);

// ========================== Display College Verification ==========================
export const collegeVerification = asyncHandler(async (req, res, next) => {
  const collegeId = req.college._id;

  const request = await verificationRequestModel
    .findOne({ collegeId })
    .sort({ createdAt: -1 })
    .populate("documents")
    .lean();

  if (!request) {
    return res.status(200).json({
      msg: "Verification details retrieved",
      data: {
        status: "not_started",
        validUntil: null,
        history: [],
        documents: [],
      },
    });
  }

  return res.status(200).json({
    msg: "Verification details retrieved",
    data: request,
  });
});

// ========================= Upload College Verification Document =========================
export const uploadCollegeVerificationDocument = asyncHandler(
  async (req, res, next) => {
    const collegeId = req.college._id;
    const { documentName } = req.body;

    if (!req.file) {
      return next(
        new Error("Document file is required", {
          cause: 400,
        }),
      );
    }

    const { secure_url } = await cloudinary.uploader.upload(req.file.path, {
      folder: "college-verification-documents",
      resource_type: "auto",
    });

    let request = await verificationRequestModel
      .findOne({ collegeId })
      .sort({ createdAt: -1 });

    if (!request) {
      request = await verificationRequestModel.create({
        collegeId,
        status: "pending",
        history: [
          {
            action: "document_uploaded",
            date: new Date(),
            note: `Uploaded ${documentName}`,
          },
        ],
      });
    } else {
      request.status = "pending";

      request.history.push({
        action: "document_uploaded",
        date: new Date(),
        note: `Uploaded ${documentName}`,
      });

      await request.save();
    }

    const document = await verificationDocumentModel.create({
      requestId: request._id,
      documentName,
      fileUrl: secure_url,
      status: "pending",
      uploadDate: new Date(),
    });

    await collegeModel.updateOne(
      { _id: collegeId },
      {
        verificationStatus: "pending",
        validUntil: null,
      },
    );

    const populatedRequest = await verificationRequestModel
      .findById(request._id)
      .populate("documents")
      .lean();

    return res.status(201).json({
      msg: "Verification document uploaded successfully",
      document,
      data: populatedRequest,
    });
  },
);

// ========================= Delete College Verification Document =========================
export const deleteCollegeVerificationDocument = asyncHandler(
  async (req, res, next) => {
    const collegeId = req.college._id;
    const { docId } = req.params;

    const document = await verificationDocumentModel.findById(docId);

    if (!document) {
      return next(
        new Error("Verification document not found", {
          cause: 404,
        }),
      );
    }

    if (document.status === "approved") {
      return next(
        new Error("Approved documents cannot be deleted", {
          cause: 400,
        }),
      );
    }

    const request = await verificationRequestModel.findById(
      document.requestId,
    );

    if (!request) {
      return next(
        new Error("Verification request not found", {
          cause: 404,
        }),
      );
    }

    if (String(request.collegeId) !== String(collegeId)) {
      return next(
        new Error("Not authorized to delete this document", {
          cause: 403,
        }),
      );
    }

    await document.deleteOne();

    request.history.push({
      action: "document_deleted",
      date: new Date(),
      note: `Deleted ${document.documentName}`,
    });

    await request.save();

    return res.status(200).json({
      msg: "Verification document deleted successfully",
    });
  },
);