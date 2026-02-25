import mongoose from "mongoose";
import { internshipLocations, workingTimes } from "../../utils/enums.js";
import applicationModel from "./application.model.js";
import { getTimeAgo } from "../../utils/local-functions/timeAgo.js";

const internshipSchema = mongoose.Schema(
  {
    internshipTitle: {
      // صححنا typo Tittle → Title
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
      required: true, // صححنا typo
      enum: Object.values(workingTimes),
    },
    internshipDescription: {
      type: String,
      required: true,
      trim: true,
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
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // ممكن تغير لـ company لو تحب
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
      required: true, // مهم للفلو بتاعك
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for applications
internshipSchema.virtual("Applications", {
  ref: "application",
  localField: "_id",
  foreignField: "internshipId",
});

// pre remove hook
internshipSchema.pre("remove", async function (next) {
  try {
    await applicationModel.deleteMany({ internshipId: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

// Virtual for posted time ago
internshipSchema.virtual("postedAgo").get(function () {
  return getTimeAgo(this.createdAt);
});

const internshipModel = mongoose.model("internship", internshipSchema);

export default internshipModel;
