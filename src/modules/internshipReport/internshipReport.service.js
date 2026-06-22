import PDFDocument from "pdfkit";
import internshipModel from "../../DB/models/internship.model.js";
import studentModel from "../../DB/models/student.model.js";
import { placementModel } from "../../DB/models/placment.model.js";
import internshipReportModel from "../../DB/models/internshipReport.model.js";
import reportModel from "../../DB/models/report.model.js";
import reportCommentModel from "../../DB/models/reportComment.model.js";
import reportAttachmentModel from "../../DB/models/reportAttachment.model.js";
import companySupervisorModel from "../../DB/models/company_supervisor.model.js";
import cloudinary from "../../utils/cloudinary.js";
import { reportStatus } from "../../utils/enums.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";

const BADGE_NAMES = {
  RISING_STAR: "Rising Star",
  PRO: "Pro",
  EXPERT: "Expert",
};

const computeOverallRating = (scores) => {
  const normalizedScores = scores.map((score) =>
    typeof score === "number" ? score : null
  );

  if (normalizedScores.some((score) => score === null)) {
    return null;
  }

  const total = normalizedScores.reduce((sum, score) => sum + score, 0);
  return total / normalizedScores.length;
};

export const createInternEvaluation = asyncHandler(async (req, res, next) => {
  const { placementId, performanceScore, attendance, feedback, reportDate } =
    req.body;

  const session = await reportModel.startSession();
  let evaluation;
  let placement;

  try {
    await session.withTransaction(async () => {
      const created = await reportModel.create(
        [
          {
            placementId,
            performanceScore,
            attendance,
            feedback,
            reportDate,
          },
        ],
        { session },
      );

      evaluation = created[0];

      placement = await placementModel.findByIdAndUpdate(
        placementId,
        { currentPerformance: performanceScore },
        { new: true, session },
      );

      if (!placement) {
        throw new Error("Placement not found");
      }
    });
  } catch (error) {
    session.endSession();
    if (error.message === "Placement not found") {
      return next(new Error("Placement not found", { cause: 404 }));
    }
    return next(error);
  }

  session.endSession();

  return res.status(201).json({
    success: true,
    message: "Evaluation saved and placement performance updated",
    data: {
      evaluation,
      placement,
    },
  });
});

export const addReportComments = asyncHandler(async (req, res) => {
  const { id: reportId } = req.params;
  const { message } = req.body;

  const senderId = req.user?._id || req.company?._id;
  const senderRole = req.user?.role || "company";

  if (!senderId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const report = await internshipReportModel.findById(reportId);
  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  const comment = await reportCommentModel.create({
    reportId,
    senderId,
    senderRole,
    message,
  });

  report.comments = report.comments || [];
  report.comments.push(comment._id);
  await report.save();

  return res.status(201).json({
    success: true,
    data: {
      commentId: comment._id,
      message: comment.message,
      createdAt: comment.createdAt,
    },
  });
});

export const uploadReportAttachment = asyncHandler(async (req, res) => {
  const { id: reportId } = req.params;
  const uploaderId = req.user?._id || req.company?._id;

  if (!uploaderId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const report = await internshipReportModel.findById(reportId);
  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file provided" });
  }

  try {
    const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "report-attachments",
      resource_type: "auto",
      public_id: `${reportId}_${Date.now()}`,
    });

    const attachment = await reportAttachmentModel.create({
      reportId,
      fileName: req.file.originalname,
      fileUrl: cloudinaryResult.secure_url,
      fileSize: req.file.size,
      uploadedBy: uploaderId,
    });

    report.attachments = report.attachments || [];
    report.attachments.push(attachment._id);
    await report.save();

    return res.status(201).json({
      success: true,
      data: {
        attachmentId: attachment._id,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error uploading file", error: error.message });
  }
});

export const deleteReportAttachment = asyncHandler(async (req, res) => {
  const { id: reportId, attachmentId } = req.params;
  const userId = req.user?._id;
  const userRole = req.user?.role;
  const companyId = req.company?._id;

  if (!userId && !companyId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const attachment = await reportAttachmentModel.findById(attachmentId);
  if (!attachment) {
    return res.status(404).json({ message: "Attachment not found" });
  }

  if (attachment.reportId.toString() !== reportId) {
    return res
      .status(400)
      .json({ message: "Attachment does not belong to this report" });
  }

  const isUploader = attachment.uploadedBy.toString() === userId?.toString();
  const isCompanyRole = userRole === "company" || companyId;

  if (!isUploader && !isCompanyRole) {
    return res
      .status(403)
      .json({ message: "Not authorized to delete this attachment" });
  }

  try {
    const urlParts = attachment.fileUrl.split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = `report-attachments/${publicIdWithExtension.split(".")[0]}`;

    const extension = attachment.fileUrl.split(".").pop().toLowerCase();

    let resourceType = "image";

    if (["mp4", "mov", "avi"].includes(extension)) {
      resourceType = "video";
    } else if (["pdf", "doc", "docx", "zip"].includes(extension)) {
      resourceType = "raw";
    }

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    await reportAttachmentModel.findByIdAndDelete(attachmentId);
    await internshipReportModel.findByIdAndUpdate(reportId, {
      $pull: { attachments: attachmentId },
    });

    return res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting attachment", error: error.message });
  }
});

export const uploadCertificate = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file provided",
    });
  }

  try {
    console.log("FILE RECEIVED:", req.file);

    const cloudinaryResult = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: "InternshipAPP/certificates",
        resource_type: "auto",
        public_id: `certificate_${Date.now()}`,
      }
    );

    return res.status(201).json({
      success: true,
      certificateUrl: cloudinaryResult.secure_url,
    });
  } catch (error) {
    console.error("❌ CLOUDINARY ERROR:");
    console.error("Message:", error.message);
    console.error("Full Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error uploading certificate",
      error: error.message,
      hint: "Check multer file path, cloudinary config, or file type",
    });
  }
});

export const getReportPrefill = asyncHandler(async (req, res, next) => {
  const { id: internshipId } = req.params;
  const { studentId, period } = req.body;

  if (!studentId || !period) {
    return next(new Error("studentId and period are required", { cause: 400 }));
  }

  /* 1. Check Internship */
  const internship = await internshipModel.findById(internshipId);
  if (!internship) return next(new Error("Internship not found", { cause: 404 }));

  /* 2. Get Student */
  const student = await studentModel
    .findById(studentId)
    .populate("userId", "username email");
  if (!student) return next(new Error("Student not found", { cause: 404 }));

  /* 3. Check student placement in internship */
  const placement = await placementModel.findOne({
    internshipId,
    studentId: student._id,
    status: "ongoing",
  });

  if (!placement) {
    return next(
      new Error("Student is not actively placed in this internship", { cause: 403 })
    );
  }

  /* 4. Get Company Supervisor */
  const supervisor = await companySupervisorModel
    .findOne({ companyId: internship.companyId })
    .populate("userId", "username email position");

  /* 5. Calculate progress */
  const today = new Date();
  const start = new Date(internship.startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + internship.durationInMonths);

  const msPerDay = 24 * 60 * 60 * 1000;
  const totalWeeks = Math.ceil((end - start) / msPerDay / 7);
  const currentWeek = Math.max(
    0,
    Math.min(Math.ceil((today - start) / msPerDay / 7), totalWeeks)
  );
  const progress = Math.round((currentWeek / totalWeeks) * 100);

  /* 6. Existing Draft */
  const [year, month] = period.split("-");
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  const existingDraft = await internshipReportModel.findOne({
    internshipId,
    studentId,
    periodStart: { $gte: periodStart, $lte: periodEnd },
    status: "draft",
  });

  /* 7. Response */
  return res.status(200).json({
    success: true,
    data: {
      student: {
        id: student._id,
        fullName: student.userId?.username,
        role: "Intern",
        university: student.university || "",
        major: student.major || "",
      },
      placement: {
        supervisor: supervisor?.userId?.username || null,
        supervisorEmail: supervisor?.userId?.email || null,
        startDate: internship.startDate,
        endDate: end,
        currentWeek,
        totalWeeks,
        progress,
      },
      existingDraft: existingDraft || null,
    },
  });
});

export const createReport = asyncHandler(async (req, res, next) => {
  const { id: internshipId } = req.params;
  const {
    studentId,
    periodStart,
    periodEnd,
    title,
    keyAchievements,
    challengesFaced,
    learningOutcomes,
    selfAssessment,
    internalNote,
    tasksCompleted,
    attendanceNotes,
    certificateUrl,
  } = req.body;

  const technicalSkillScore = selfAssessment?.technicalSkill;
  const problemSolvingScore = selfAssessment?.problemSolving;
  const communicationScore = selfAssessment?.communication;
  const initiativeScore = selfAssessment?.initiative;
  const overallRating = computeOverallRating([
    technicalSkillScore,
    problemSolvingScore,
    communicationScore,
    initiativeScore,
  ]);
  const points = typeof overallRating === "number" ? Math.round(overallRating * 20) : 0;

  // 1. تحقق من الانترنشيب
  const internship = await internshipModel.findById(internshipId);
  if (!internship) return next(new Error("Internship not found", { cause: 404 }));

  // 2. تحقق من أن الطالب موجود فعلياً داخل Placement نشط
  const placement = await placementModel.findOne({
    internshipId,
    studentId,
    status: "ongoing",
  });

  if (!placement) {
    return next(
      new Error("Student is not actively placed in this internship", { cause: 403 })
    );
  }
  // Authorization: company must own the internship
  if (req.company._id.toString() !== internship.companyId.toString()) {
    return next(new Error("Not authorized", { cause: 403 }));
  }

  // 4. تحقق من عدم وجود تقرير مسبق
  const existingReport = await internshipReportModel.findOne({
    internshipId,
    studentId,
    periodStart: { $gte: new Date(periodStart) },
    periodEnd: { $lte: new Date(periodEnd) },
  });

  if (existingReport) {
    return next(new Error("Report already exists for this student and period", { cause: 409 }));
  }

  // 5. إنشاء التقرير
  const report = await internshipReportModel.create({
    internshipId,
    studentId,
    periodStart,
    periodEnd,
    title,
    keyAchievements,
    challengesFaced,
    learningOutcomes,
    internalNote,
    tasksCompleted,
    attendanceNotes,
    technicalSkillScore,
    problemSolvingScore,
    communicationScore,
    initiativeScore,
    overallRating,
    createdBy: req.company._id,
  });

  const student = await studentModel.findById(studentId);
  if (!student) return next(new Error("Student not found", { cause: 404 }));

  if (certificateUrl) {
    student.certificates = student.certificates || [];
    student.certificates.push({
      internshipId,
      url: certificateUrl,
      date: new Date(),
    });
  }

  student.points = (student.points || 0) + points;

  const badgeSet = new Set(student.badges || []);
  if (student.points >= 100) badgeSet.add(BADGE_NAMES.RISING_STAR);
  if (student.points >= 300) badgeSet.add(BADGE_NAMES.PRO);
  if (student.points >= 500) badgeSet.add(BADGE_NAMES.EXPERT);
  student.badges = Array.from(badgeSet);

  await student.save();

  res.status(201).json({ success: true, message: "Internship report created successfully", data: report });
});

export const updateReport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const report = await internshipReportModel.findById(id);

  if (!report) return next(new Error("Report not found", { cause: 404 }));
  if (report.status === reportStatus.approved) return next(new Error("Approved report cannot be edited", { cause: 400 }));

  const internship = await internshipModel.findById(report.internshipId);
  if (!internship) return next(new Error("Internship not found", { cause: 404 }));
  if (req.company._id.toString() !== internship.companyId.toString()) return next(new Error("Not authorized", { cause: 403 }));

  const {
    keyAchievements,
    challengesFaced,
    learningOutcomes,
    internalNote,
    status,
    selfAssessment,
    tasksCompleted,
    attendanceNotes,
  } = req.body;

  const updateData = {};
  if (keyAchievements !== undefined) updateData.keyAchievements = keyAchievements;
  if (challengesFaced !== undefined) updateData.challengesFaced = challengesFaced;
  if (learningOutcomes !== undefined) updateData.learningOutcomes = learningOutcomes;
  if (internalNote !== undefined) updateData.internalNote = internalNote;
  if (status !== undefined) updateData.status = status;
  if (tasksCompleted !== undefined) updateData.tasksCompleted = tasksCompleted;
  if (attendanceNotes !== undefined) updateData.attendanceNotes = attendanceNotes;

  if (selfAssessment) {
    if (selfAssessment.technicalSkill !== undefined) updateData.technicalSkillScore = selfAssessment.technicalSkill;
    if (selfAssessment.problemSolving !== undefined) updateData.problemSolvingScore = selfAssessment.problemSolving;
    if (selfAssessment.communication !== undefined) updateData.communicationScore = selfAssessment.communication;
    if (selfAssessment.initiative !== undefined) updateData.initiativeScore = selfAssessment.initiative;
  }

  const mergedTechnical = selfAssessment?.technicalSkill ?? report.technicalSkillScore;
  const mergedProblemSolving = selfAssessment?.problemSolving ?? report.problemSolvingScore;
  const mergedCommunication = selfAssessment?.communication ?? report.communicationScore;
  const mergedInitiative = selfAssessment?.initiative ?? report.initiativeScore;
  const overallRating = computeOverallRating([
    mergedTechnical,
    mergedProblemSolving,
    mergedCommunication,
    mergedInitiative,
  ]);
  updateData.overallRating = overallRating;

  const updatedReport = await internshipReportModel.findByIdAndUpdate(id, updateData, { new: true });
  return res.status(200).json({ success: true, message: "Report updated successfully", data: updatedReport });
});

export const getReportDetails = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  /* =========================
     1. Find report + FULL populate
  ========================= */
  const report = await internshipReportModel
    .findById(id)
    .populate({
      path: "studentId",
      select: "fullName username university major role",
    })
    .populate({
      path: "internshipId",
      select: "companyId",
    })
    .populate("attachments") // Populate Attachments
    .populate({
      path: "comments", // Populate Comments & their senders
      populate: { path: "senderId", select: "username email role" }
    })
    .lean();

  if (!report) return next(new Error("Report not found", { cause: 404 }));

  /* =========================
     ... (Authorization checks remain the same) ...
  ========================= */
  const student = report.studentId || null;
  const internship = report.internshipId || null;
  const companyId = req.company?._id?.toString();
  const collegeId = req.college?._id?.toString();
  const user = req.user;

  const studentProfile = student?._id
    ? await studentModel.findOne({ userId: student._id }).select("collegeId").lean()
    : null;

  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student" && student && student._id.toString() === user._id.toString();
  const isCompany = companyId && internship && internship.companyId?.toString() === companyId;
  const isCollege =
    collegeId;
  const isSupervisor = report.supervisorId && user && report.supervisorId.toString() === user._id.toString();

  if (!isAdmin && !isStudent && !isCompany && !isCollege && !isSupervisor) {
    return next(new Error("Unauthorized", { cause: 403 }));
  }

  // Calculate Overall Performance Score
  const technical = report.technicalSkillScore;
  const problemSolving = report.problemSolvingScore;
  const communication = report.communicationScore;
  const initiative = report.initiativeScore;
  
  const hasScores = technical != null || problemSolving != null || communication != null || initiative != null;
  const performanceScore = hasScores ? Math.round(((technical || 0) + (problemSolving || 0) + (communication || 0) + (initiative || 0)) / 4) : null;

  /* =========================
     5. Safe & Formatted response for the new UI
  ========================= */
  return res.status(200).json({
    success: true,
    data: {
      id: report._id,
      title: report.title,
      status: report.status,
      period: report.period,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,

      student: student ? {
        id: student._id,
        fullName: student.fullName || student.username,
        role: student.role,
        university: student.university,
        major: student.major,
      } : null,

      // Stats
      tasksCompleted: report.tasksCompleted || "",
      attendanceNotes: report.attendanceNotes || "",
      performanceScore: performanceScore,

      // Text Contents
      keyAchievements: report.keyAchievements || "",
      challengesFaced: report.challengesFaced || "",
      learningOutcomes: report.learningOutcomes || "",

      // Mapped Skills Assessment Array
      skillsAssessment: [
        { skillName: "Technical Skill", percentage: report.technicalSkillScore || 0 },
        { skillName: "Problem Solving", percentage: report.problemSolvingScore || 0 },
        { skillName: "Communication", percentage: report.communicationScore || 0 },
        { skillName: "Initiative", percentage: report.initiativeScore || 0 },
      ],

      // Fully Populated Arrays
      attachments: report.attachments || [],
      comments: report.comments || [],
    },
  });
});

// export const getReportDetails = asyncHandler(async (req, res, next) => {
//   const { id } = req.params;

//   /* =========================
//      1. Find report + populate
//   ========================= */
//   const report = await internshipReportModel
//     .findById(id)
//     .populate({
//       path: "studentId",
//       select: "fullName university major role",
//     })
//     .populate({
//       path: "internshipId",
//       select: "companyId",
//     })
//     .lean(); // safe for response layer

//   if (!report) {
//     return next(new Error("Report not found", { cause: 404 }));
//   }

//   /* =========================
//      2. Safe references
//   ========================= */
//   const student = report.studentId || null;
//   const internship = report.internshipId || null;
//   const companyId = req.company?._id?.toString();
//   const user = req.user;

//   /* =========================
//      3. Authorization (SAFE)
//   ========================= */
//   const isAdmin = user?.role === "admin";

//   const isStudent =
//     user?.role === "student" &&
//     student &&
//     student._id.toString() === user._id.toString();

//   const isCompany =
//     companyId &&
//     internship &&
//     internship.companyId?.toString() === companyId;

//   const isSupervisor =
//     report.supervisorId &&
//     user &&
//     report.supervisorId.toString() === user._id.toString();

//   const isAuthorized = isAdmin || isStudent || isCompany || isSupervisor;

//   if (!isAuthorized) {
//     return next(new Error("Unauthorized", { cause: 403 }));
//   }

//   /* =========================
//      4. Placement summary (SAFE)
//   ========================= */
//   let placementSummary = {
//     supervisor: null,
//     startDate: null,
//     endDate: null,
//     currentWeek: 0,
//     totalWeeks: 0,
//     progress: 0,
//   };

//   if (report.placement?.startDate && report.placement?.endDate) {
//     const today = new Date();
//     const start = new Date(report.placement.startDate);
//     const end = new Date(report.placement.endDate);

//     const msPerDay = 24 * 60 * 60 * 1000;

//     const totalWeeks = Math.max(
//       1,
//       Math.ceil((end - start) / msPerDay / 7)
//     );

//     const currentWeek = Math.min(
//       Math.ceil((today - start) / msPerDay / 7),
//       totalWeeks
//     );

//     const progress = Math.round((currentWeek / totalWeeks) * 100);

//     placementSummary = {
//       supervisor: report.placement?.supervisorId
//         ? {
//             id: report.placement.supervisorId._id,
//             fullName: report.placement.supervisorId.fullName,
//           }
//         : null,
//       startDate: report.placement.startDate,
//       endDate: report.placement.endDate,
//       currentWeek,
//       totalWeeks,
//       progress,
//     };
//   }

//   /* =========================
//      5. Safe response
//   ========================= */
//   return res.status(200).json({
//     success: true,
//     data: {
//       id: report._id,
//       title: report.title,
//       status: report.status,
//       period: report.period,

//       student: student
//         ? {
//             id: student._id,
//             fullName: student.fullName,
//             role: student.role,
//             university: student.university,
//             major: student.major,
//           }
//         : null,

//       placement: placementSummary,
//       reflection: report.reflection || null,
//       selfAssessment: report.selfAssessment || null,
//       attachments: report.attachments || [],
//       comments: report.comments || [],
//     },
//   });
// });

export const updateReportStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  // 1. Get report
  const report = await internshipReportModel.findById(id);
  if (!report) {
    return next(new Error("Report not found", { cause: 404 }));
  }

  // 2. Get internship
  const internship = await internshipModel.findById(report.internshipId);
  if (!internship) {
    return next(new Error("Internship not found", { cause: 404 }));
  }

  // 3. Authorization (company only)
  if (req.company._id.toString() !== internship.companyId.toString()) {
    return next(new Error("Not authorized to change report status", { cause: 403 }));
  }

  // 4. Allowed transitions
  const allowedTransitions = {
    draft: ["submitted"],
    submitted: ["under_review"],
    under_review: ["needs_changes", "approved"],
    needs_changes: ["submitted"],
    approved: [],
  };

  if (!allowedTransitions[report.status]?.includes(status)) {
    return next(
      new Error(
        `Invalid status transition from ${report.status} to ${status}`,
        { cause: 400 }
      )
    );
  }

  // 5. Update status
  report.status = status;

  // 6. Save review metadata
  if (status === "under_review") {
    report.reviewedBy = req.company._id;
  }

  if (status === "approved") {
    report.approvedAt = new Date();
  }

  await report.save();

  return res.status(200).json({
    success: true,
    message: "Report status updated successfully",
    data: {
      id: report._id,
      status: report.status,
      reviewedBy: report.reviewedBy,
      approvedAt: report.approvedAt,
    },
  });
});

export const downloadReportPDF = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  /* =========================
     1. Fetch report (correct structure)
  ========================= */
  const report = await internshipReportModel
    .findById(id)
    .populate({
      path: "studentId",
      select: "fullName university major role",
    })
    .populate({
      path: "internshipId",
      select: "companyId placement startDate endDate",
    })
    .lean();

  if (!report) {
    return next(new Error("Report not found", { cause: 404 }));
  }

  /* =========================
     2. Authorization
  ========================= */
  const isCompany =
    req.company &&
    report.internshipId?.companyId?.toString() === req.company._id.toString();

  const isStudent =
    req.student &&
    report.studentId?._id?.toString() === req.student._id.toString();

  const isAdmin = req.user?.role === "admin";

  if (!isCompany && !isStudent && !isAdmin) {
    return next(new Error("Not authorized", { cause: 403 }));
  }

  /* =========================
     3. Safe Data Extraction
  ========================= */
  const student = report.studentId || {};
  const internship = report.internshipId || {};
  const placement = internship.placement || {};

  // IMPORTANT: flat DB fields (NOT nested)
  const technical = report.technicalSkillScore;
  const problemSolving = report.problemSolvingScore;
  const communication = report.communicationScore;
  const initiative = report.initiativeScore;

  // computed score (only if values exist)
  const hasScores =
    technical != null ||
    problemSolving != null ||
    communication != null ||
    initiative != null;

  const performanceScore = hasScores
    ? Math.round(
        ((technical || 0) +
          (problemSolving || 0) +
          (communication || 0) +
          (initiative || 0)) /
          4
      )
    : null;

  /* =========================
     4. PDF Setup
  ========================= */
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=report-${id}.pdf`
  );

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.on("error", (err) => {
    console.error("PDF error:", err);
    if (!res.headersSent) {
      return next(new Error("PDF generation failed", { cause: 500 }));
    }
    res.end();
  });

  const formatDate = (d) => (d ? new Date(d).toDateString() : "-");

  /* =========================
     5. CONTENT
  ========================= */

  doc.fontSize(20).text("Internship Report", { align: "center" });
  doc.moveDown();

  // Basic Info
  doc.fontSize(14).text(`Title: ${report.title || "-"}`);
  doc.text(`Student: ${student.fullName || "-"}`);
  doc.text(`University: ${student.university || "-"}`);
  doc.text(`Major: ${student.major || "-"}`);
  doc.text(`Role: ${student.role || "-"}`);

  doc.moveDown();

  // Internship Info
  doc.text(`Company ID: ${internship.companyId || "-"}`);
  doc.text(
    `Period: ${formatDate(report.periodStart)} - ${formatDate(
      report.periodEnd
    )}`
  );

  doc.text(`Placement Start: ${formatDate(placement.startDate)}`);
  doc.text(`Placement End: ${formatDate(placement.endDate)}`);

  doc.moveDown();

  doc.text(`Status: ${report.status || "-"}`);

  doc.moveDown();

  // Report Content
  doc.fontSize(14).text("Key Achievements:");
  doc.fontSize(12).text(report.keyAchievements || "-");

  doc.moveDown();
  doc.fontSize(14).text("Challenges Faced:");
  doc.fontSize(12).text(report.challengesFaced || "-");

  doc.moveDown();
  doc.fontSize(14).text("Learning Outcomes:");
  doc.fontSize(12).text(report.learningOutcomes || "-");

  doc.moveDown();

  // Self Assessment (FIXED - correct fields)
  doc.fontSize(14).text("Self Assessment:");

  doc.fontSize(12).text(`Technical Skill: ${technical ?? "-"}`);
  doc.text(`Problem Solving: ${problemSolving ?? "-"}`);
  doc.text(`Communication: ${communication ?? "-"}`);
  doc.text(`Initiative: ${initiative ?? "-"}`);

  doc.moveDown();

  // Performance Metrics (computed correctly)
  doc.fontSize(14).text("Performance Metrics:");

  doc.fontSize(12).text(
    `Overall Performance Score: ${
      performanceScore !== null ? performanceScore + "%" : "-"
    }`
  );

  doc.end();
});

