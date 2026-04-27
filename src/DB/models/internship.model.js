import mongoose from "mongoose";
import {
  internshipLocations,
  internshipStatus,
  workingTimes,
} from "../../utils/enums.js";
import applicationModel from "./application.model.js";
import { getTimeAgo } from "../../utils/local-functions/timeAgo.js";

const internshipSchema = new mongoose.Schema(
  {
    internshipTittle: {
      type: String,
      required: true,
      trim: true,
    },

    internshipLocation: {
      type: String,
      required: true,
      enum: Object.values(internshipLocations),
    },

    workingTime: {
      type: String,
      required: true,
      enum: Object.values(workingTimes),
    },

    internshipDescription: {
      type: String,
      required: true,
      trim: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    technicalSkills: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],

    softSkills: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],

    status: {
      type: String,
      enum: Object.values(internshipStatus),
      default: internshipStatus.onboarding,
    },

    startDate: {
      type: Date,
      required: true,
    },

    durationInMonths: {
      type: Number,
      required: true,
      min: 1,
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },

    thumbnail: {
      type: String,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    closed: {
      type: Boolean,
      default: false,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      required: true,
    },

    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* =========================
   AUTO CALCULATE endDate
========================= */
internshipSchema.pre("validate", function (next) {
  if (this.startDate && this.durationInMonths) {
    const start = new Date(this.startDate);

    const end = new Date(start);
    end.setMonth(end.getMonth() + this.durationInMonths);

    this.endDate = end;
  }

  next();
});

/* =========================
   INDEXES
========================= */
internshipSchema.index({ endDate: 1 });
internshipSchema.index({ companyId: 1 });

/* =========================
   VIRTUAL: APPLICATIONS
========================= */
// ─── Indexes (must be BEFORE mongoose.model()) ───────────────────────────────

internshipSchema.index({ endDate: 1 });
internshipSchema.index({ companyId: 1 });

// Text search on title + description
internshipSchema.index({ internshipTitle: "text", internshipDescription: "text" });

// Common filter combos
internshipSchema.index({ internshipLocation: 1, workingTime: 1, durationInMonths: 1 });

// Featured listing
internshipSchema.index({ isFeatured: 1, createdAt: -1 });

// ─── Virtuals ────────────────────────────────────────────────────────────────

internshipSchema.virtual("Applications", {
  ref: "application",
  localField: "_id",
  foreignField: "internshipId",
});

internshipSchema.virtual("reports", {
  ref: "internship_report",
  localField: "_id",
  foreignField: "internshipId",
});

/* =========================
   CASCADE DELETE
========================= */
internshipSchema.virtual("postedAgo").get(function () {
  return getTimeAgo(this.createdAt);
});

// ─── Hooks ───────────────────────────────────────────────────────────────────

// Cascade delete applications when internship is deleted
internshipSchema.pre("deleteOne", { document: true }, async function (next) {
  try {
    await applicationModel.deleteMany({ internshipId: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

/* =========================
   POSTED AGO
========================= */
internshipSchema.virtual("postedAgo").get(function () {
  return getTimeAgo(this.createdAt);
});
// ─── Model ───────────────────────────────────────────────────────────────────

const internshipModel = mongoose.model("internship", internshipSchema);

export default internshipModel;