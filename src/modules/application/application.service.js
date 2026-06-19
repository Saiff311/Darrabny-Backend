import applicationModel from "../../DB/models/application.model.js";
import internshipModel from "../../DB/models/internship.model.js";
import { placementModel } from "../../DB/models/placment.model.js";
import studentModel from "../../DB/models/student.model.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";
import mongoose from "mongoose";
import cloudinary from "../../utils/cloudinary.js";
import { analyzeApplicationWithAI } from "../../services/ai/ai.service.js";

// ========================== Accept Student Application ==========================
export const acceptStudentApplication = async (applicationId) => {
  const session = await mongoose.startSession();
  let createdPlacement = null;

  try {
    await session.withTransaction(async () => {
      const application = await applicationModel
        .findById(applicationId)
        .populate("internshipId")
        .populate("userId")
        .session(session);

      if (!application) {
        throw new Error("Application not found", { cause: 404 });
      }

      if (!application.internshipId) {
        throw new Error("Internship not found for this application", {
          cause: 404,
        });
      }

      const student = await studentModel
        .findOne({ userId: application.userId._id || application.userId })
        .session(session);

      if (!student) {
        throw new Error("Student not found for this application", {
          cause: 404,
        });
      }

      const existingPlacement = await placementModel
        .findOne({
          studentId: student._id,
          internshipId:
            application.internshipId._id || application.internshipId,
        })
        .session(session);

      if (existingPlacement) {
        throw new Error(
          "Placement already exists for this student and internship",
          {
            cause: 409,
          },
        );
      }

      const internship = application.internshipId;
      const mappedIndustry =
        internship.category ||
        internship.internshipCategory ||
        internship.industry ||
        null;

      const [placement] = await placementModel.create(
        [
          {
            studentId: student._id,
            internshipId: internship._id,
            companyId: internship.companyId,
            supervisorId: internship.supervisorId || null,
            startDate: new Date(),
            endDate: internship.endDate || null,
            industry: mappedIndustry,
            majorSnapshot: student.major || null,
            status: "ongoing",
          },
        ],
        { session },
      );

      const now = new Date();
      if (!application.timeline || application.timeline.length === 0) {
        application.timeline = [{ status: "accepted", date: now }];
      } else {
        application.timeline[application.timeline.length - 1].status =
          "accepted";
        application.timeline[application.timeline.length - 1].date = now;
      }

      await application.save({ session });
      createdPlacement = placement;
    });

    return createdPlacement;
  } finally {
    await session.endSession();
  }
};

// ========================== Update Application Status ==========================
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const loggedInCompanyId = req.company._id;

  const application = await applicationModel.findById(req.params.id);

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (application.companyId.toString() !== loggedInCompanyId.toString()) {
    return res.status(403).json({
      message:
        "Unauthorized: Only the company that owns this internship can update the application status",
    });
  }

  let placement = null;
  if (status === "accepted") {
    placement = await acceptStudentApplication(application._id);
  } else {
    if (!application.timeline || application.timeline.length === 0) {
      application.timeline = [
        {
          status,
          date: new Date(),
        },
      ];
    } else {
      const lastIndex = application.timeline.length - 1;
      application.timeline[lastIndex].status = status;
      application.timeline[lastIndex].date = new Date();
    }

    await application.save();
  }

  res.status(200).json({
    message: "Application updated successfully",
    placementCreated: !!placement,
  });
});

// ========================== Get Application Details ==========================
export const getApplicationDetails = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const loggedInCompanyId = req.company?._id;

  const application = await applicationModel
    .findById(id)
    .populate("userId", "firstName lastName email profilePic bio links")
    .populate("internshipId", "internshipTitle");

  if (!application) {
    return next(new Error("Application not found", { cause: 404 }));
  }

  if (
    !loggedInCompanyId ||
    String(application.companyId) !== String(loggedInCompanyId)
  ) {
    return next(
      new Error("You are not authorized to view this application", {
        cause: 403,
      }),
    );
  }

  res.status(200).json({
    success: true,
    data: application,
  });
});

// ========================== Get Applications For Specific Internship ==========================
export const getApplicationsForSpecificInternship = asyncHandler(
  async (req, res, next) => {
    const { internshipId } = req.params;
    const authCompany = req.company;
    const excludedStatuses = ["accepted", "rejected"];

    if (!authCompany) {
      return next(new Error("Company authentication required", { cause: 401 }));
    }

    const { page = 1, limit = 5, sort = "-aiAnalysis.score" } = req.query;
    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    let internship = await internshipModel.findById(internshipId);

    if (!internship) {
      return next(new Error("internship not found", { cause: 404 }));
    }

    // Authorization check using authenticated company entity
    if (String(internship.companyId) !== String(authCompany._id)) {
      return next(
        new Error("You are not authorized to perform this action", {
          cause: 403,
        }),
      );
    }

    internship = await internship.populate([
      {
        path: "Applications",
        match: {
          "timeline.status": { $nin: excludedStatuses },
        },
        options: {
          sort,
          skip,
          limit: pageSize,
        },
        populate: {
          path: "userId",
          select: "firstName lastName email profilePic bio",
        },
      },
    ]);

    const totalCount = await applicationModel.countDocuments({
      internshipId: internship._id,
      "timeline.status": { $nin: excludedStatuses },
    });

    if (!internship.Applications || internship.Applications.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No applications found yet",
        data: [],
        pagination: { totalCount },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Applications fetched and ranked successfully",
      data: internship,
      pagination: {
        currentPage,
        totalPages: Math.ceil(totalCount / pageSize),
        totalCount,
      },
    });
  },
);
