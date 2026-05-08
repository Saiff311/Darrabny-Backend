import mongoose from "mongoose";

const placementSchema = new mongoose.Schema(
  {
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "internship",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "student",
      required: true,
    },

    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "academic_supervisor",
      required: false,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      required: true,
      index: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: false,
    },

    status: {
      type: String,
      enum: ["pending", "ongoing", "completed", "cancelled"],
      default: "pending",
    },

    currentPerformance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    finalEvaluation: {
      type: String,
      enum: ["excellent", "very good", "good", "acceptable", "poor"],
    },

    industry: {
      type: String,
      trim: true,
    },

    majorSnapshot: {
      type: String,
      trim: true,
    },

    certificateUrl: {
      type: String,
      trim: true,
    },

    completionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const placementModel = mongoose.model("placement", placementSchema);
