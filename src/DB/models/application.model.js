import mongoose from "mongoose";
import { appStatus } from "../../utils/enums.js";

const applicationSchema = new mongoose.Schema(
  {
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "internship",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      required: true,
    },
    coverLetter: {
      type: String,
      default: null,
    },

    skills: {
      type: [String],
      default: [],
    },

    snapshot: {
      studentName: String,
      email: String,
      university: String,
      skills: [String],
      resumeUrl: String,
    },

    aiAnalysis: {
      score: { type: Number, default: 0 },
      label: { type: String, default: "pending" },
      keyStrengths: [String], // مصفوفة لنقط القوة
      areasForReview: [String], // مصفوفة لنقط الضعف
      summary: String,
      processedAt: { type: Date },
    },
    // Status Timeline
    timeline: [
      {
        status: {
          type: String,
          enum: Object.values(appStatus),
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ======================================
   Virtual: currentStatus
====================================== */
applicationSchema.virtual("currentStatus").get(function () {
  if (!this.timeline || this.timeline.length === 0) return null;
  return this.timeline[this.timeline.length - 1].status;
});

/* ======================================
   Ensure first timeline status exists
====================================== */
applicationSchema.pre("save", function (next) {
  if (this.isNew && (!this.timeline || this.timeline.length === 0)) {
    this.timeline = [
      {
        status: appStatus.pending,
        date: new Date(),
      },
    ];
  }

  next();
});

/* ======================================
   Indexes (Performance)
====================================== */
applicationSchema.index({ userId: 1 });
applicationSchema.index({ internshipId: 1 });
applicationSchema.index({ "timeline.status": 1 });

const applicationModel = mongoose.model("application", applicationSchema);
export default applicationModel;
