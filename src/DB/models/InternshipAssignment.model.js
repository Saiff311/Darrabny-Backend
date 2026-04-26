import mongoose from "mongoose";

const internshipAssignmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "internship",
      required: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "onboarding",
        "in-progress",
        "completed",
        "dropped",
      ],
      default: "onboarding",
      index: true,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    completedAt: Date,

    notes: String,

    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const internshipAssignmentModel = mongoose.model("internshipAssignment", internshipAssignmentSchema);