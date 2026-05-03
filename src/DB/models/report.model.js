import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    placementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "placement",
      required: true,
      index: true,
    },

    performanceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    attendance: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    feedback: String,

    reportDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const reportModel = mongoose.model("report", reportSchema);

export default reportModel;
