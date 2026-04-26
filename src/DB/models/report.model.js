import mongoose from "mongoose";
import reportCommentModel from "./reportComment.model.js";

const reportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "student",
      required: true,
      index: true,
    },

    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "internship",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "submitted", "reviewed", "approved"],
      default: "draft",
      index: true,
    },

    reportWeek: {
      type: Number,
    },

    submittedAt: Date,

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    reviewedAt: Date,

    feedback: String,

    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for comments
reportSchema.virtual("Comments", {
  ref: "reportComment",
  localField: "_id",
  foreignField: "reportId",
});

// Cascade delete comments
reportSchema.pre("deleteOne", { document: true }, async function (next) {
  try {
    await reportCommentModel.deleteMany({ reportId: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

const reportModel = mongoose.model("report", reportSchema);

export default reportModel;
