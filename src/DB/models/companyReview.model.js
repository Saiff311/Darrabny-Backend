import mongoose from "mongoose";

const companyReviewSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    pros: [String],

    cons: [String],
  },
  {
    timestamps: true,
  }
);

// one review per user per company
companyReviewSchema.index(
  { companyId: 1, userId: 1 },
  { unique: true }
);

export default mongoose.model(
  "companyReview",
  companyReviewSchema
);