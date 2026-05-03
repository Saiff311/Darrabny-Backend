import { placementModel } from "../../DB/models/placment.model.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";
import { calculateProgress } from "../../utils/local-functions/calculateProgress.js";
import applicationModel from "../../DB/models/application.model.js";
import studentModel from "../../DB/models/student.model.js";
import mongoose from "mongoose";

// ========================== Get Internship Students ==========================
export const getInternshipStudents = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;

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

  if (!placements.length) {
    return res.status(200).json({
      success: true,
      message: "No ongoing placements found for this internship",
      data: [],
    });
  }

  const students = placements.map((placement) => ({
    placementId: placement._id,
    currentPerformance: placement.currentPerformance || 0,
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

 export const getPlacementProgress = asyncHandler(async (req, res) => {
  const placement = await placementModel.findById(req.params.id);

  if (!placement) {
    return res.status(404).json({ message: "Placement not found" });
  }

  const progressData = calculateProgress(
    placement.startDate,
    placement.endDate
  );

  res.json({
    ...placement.toObject(),
    progress: progressData
  });
});

// ========================== Complete Placement ==========================
export const completePlacement = asyncHandler(async (req, res, next) => {
  const { id: placementId } = req.params;
  const { finalEvaluation, certificateUrl } = req.body;

  const session = await mongoose.startSession();

  try {
    let updatedPlacement = null;

    await session.withTransaction(async () => {
      const placement = await placementModel.findById(placementId).session(session);

      if (!placement) {
        throw new Error("Placement not found", { cause: 404 });
      }

      if (placement.status !== "ongoing") {
        throw new Error("Only ongoing placements can be completed", { cause: 409 });
      }

      placement.status = "completed";
      placement.finalEvaluation = finalEvaluation;
      placement.certificateUrl = certificateUrl || null;
      placement.completionDate = new Date();

      await placement.save({ session });
      updatedPlacement = placement;

      const student = await studentModel.findById(placement.studentId).session(session);
      if (!student) {
        throw new Error("Student not found for this placement", { cause: 404 });
      }

      const application = await applicationModel
        .findOne({
          internshipId: placement.internshipId,
          userId: student.userId,
        })
        .session(session);

      if (application) {
        const now = new Date();
        if (!application.timeline || application.timeline.length === 0) {
          application.timeline = [{ status: "completed", date: now }];
        } else {
          const lastIndex = application.timeline.length - 1;
          application.timeline[lastIndex].status = "completed";
          application.timeline[lastIndex].date = now;
        }

        await application.save({ session });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Placement completed successfully",
      data: updatedPlacement,
    });
  } finally {
    await session.endSession();
  }
});

// ========================== Company Completed Internships Analytics ==========================
export const getCompanyCompletedInternshipsAnalytics = asyncHandler(async (req, res, next) => {
  const companyId = req.company?._id;

  if (!companyId) {
    return next(new Error("Company authentication required", { cause: 401 }));
  }

  const [analytics] = await placementModel.aggregate([
    {
      $match: {
        companyId,
        status: "completed",
      },
    },
    {
      $facet: {
        totalGraduates: [
          {
            $count: "value",
          },
        ],
        successRate: [
          {
            $group: {
              _id: null,
              totalCompleted: { $sum: 1 },
              excellentVeryGoodCount: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        "$finalEvaluation",
                        ["excellent", "very good"],
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalCompleted: 1,
              excellentVeryGoodCount: 1,
              successRatePercentage: {
                $cond: [
                  { $eq: ["$totalCompleted", 0] },
                  0,
                  {
                    $round: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              "$excellentVeryGoodCount",
                              "$totalCompleted",
                            ],
                          },
                          100,
                        ],
                      },
                      2,
                    ],
                  },
                ],
              },
            },
          },
        ],
        topDept: [
          {
            $group: {
              _id: { $ifNull: ["$majorSnapshot", "Unknown"] },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { count: -1 },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              _id: 0,
              major: "$_id",
              count: 1,
            },
          },
        ],
        industryDistribution: [
          {
            $group: {
              _id: { $ifNull: ["$industry", "Unknown"] },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { count: -1 },
          },
          {
            $project: {
              _id: 0,
              industry: "$_id",
              count: 1,
            },
          },
        ],
        recentCompletions: [
          {
            $sort: { completionDate: -1, updatedAt: -1 },
          },
          {
            $limit: 5,
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "student",
            },
          },
          {
            $unwind: {
              path: "$student",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "student.userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              placementId: "$_id",
              studentId: "$studentId",
              studentName: {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ["$user.firstName", ""] },
                      " ",
                      { $ifNull: ["$user.lastName", ""] },
                    ],
                  },
                },
              },
              finalEvaluation: 1,
              completionDate: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        totalGraduates: {
          $ifNull: [{ $arrayElemAt: ["$totalGraduates.value", 0] }, 0],
        },
        successRate: {
          $ifNull: [
            { $arrayElemAt: ["$successRate", 0] },
            {
              totalCompleted: 0,
              excellentVeryGoodCount: 0,
              successRatePercentage: 0,
            },
          ],
        },
        topDept: {
          $ifNull: [
            { $arrayElemAt: ["$topDept", 0] },
            { major: "Unknown", count: 0 },
          ],
        },
        industryDistribution: "$industryDistribution",
        recentCompletions: "$recentCompletions",
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    data: analytics || {
      totalGraduates: 0,
      successRate: {
        totalCompleted: 0,
        excellentVeryGoodCount: 0,
        successRatePercentage: 0,
      },
      topDept: { major: "Unknown", count: 0 },
      industryDistribution: [],
      recentCompletions: [],
    },
  });
});

export const getPlacementDetails = asyncHandler(async (req, res) => {
  const placement = await placementModel.findById(req.params.id)

  if (!placement) {
    return res.status(404).json({ message: "Placement not found" });
  }
  const progressData = calculateProgress(
    placement.startDate || placement.internshipId.startDate,
    placement.endDate || placement.internshipId.endDate
  );

  res.json({
    id: placement._id,
    internshipId: placement.internshipId._id,

    student: {
      id: placement.studentId._id,
      fullName: placement.studentId.fullName
    },

    supervisor: {
      id: placement.supervisorId._id,
      fullName: placement.supervisorId.fullName
    },

    startDate: placement.startDate,
    endDate: placement.endDate,
    status: placement.status,

    currentWeek: progressData.currentWeek,
    totalWeeks: progressData.totalWeeks,
    progress: progressData.progress
  });
});