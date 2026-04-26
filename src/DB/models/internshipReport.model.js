import mongoose from "mongoose";
import { reportStatus } from "../../utils/enums.js";

const internshipReportSchema = new mongoose.Schema(
  {
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "internship",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // supervisorId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "college",
    //   required: true,
    // },

    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "reportAttachment",
      }
    ],

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "reportComment",
      },
    ],

    title: {
      type: String,
      required: true,
      trim: true,
    },

    periodStart: {
      type: Date,
      required: true,
    },

    periodEnd: {
      type: Date,
      required: true,
      validate: {
        validator: function (val) {
          return val > this.periodStart;
        },
        message: "periodEnd must be after periodStart",
      },
    },

    status: {
      type: String,
      enum: Object.values(reportStatus),
      default: reportStatus.draft,
      required: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
    },

    approvedAt: {
      type: Date,
    },

    keyAchievements: {
      type: String,
      trim: true,
    },

    challengesFaced: {
      type: String,
      trim: true,
    },

    learningOutcomes: {
      type: String,
      trim: true,
    },

    technicalSkillScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    problemSolvingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    communicationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    initiativeScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    internalNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ======================================
   Indexes (Performance)
====================================== */

internshipReportSchema.index({ internshipId: 1 });
internshipReportSchema.index({ studentId: 1 });
internshipReportSchema.index({ supervisorId: 1 });
internshipReportSchema.index({ status: 1 });

/* ======================================
   Index (Prevent Duplicate Reports)
   One report per student per internship per period
====================================== */

internshipReportSchema.index(
  { internshipId: 1, studentId: 1, periodStart: 1 },
  { unique: true }
);

const internshipReportModel = mongoose.model(
  "internship_report",
  internshipReportSchema
);

export default internshipReportModel;