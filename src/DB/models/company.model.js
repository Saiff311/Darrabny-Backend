import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jobModel from "./internship.model.js";

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      unique: true,
      minLength: 2,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minLength: 10,
      trim: true,
    },
    industry: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    numberOfEmployees: {
      from: { type: Number, min: 0, required: true },
      to: { type: Number, min: 0, required: true },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/,
    },
    companyPhone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[0-9+\-\s]{7,20}$/,
    },
    // ===================== AUTH FIELD =====================
    password: {
      type: String,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    logo: {
      secure_url: String,
      public_id: String,
    },
    coverPic: {
      secure_url: String,
      public_id: String,
    },

    HRs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    validUntil: {
      type: Date,
      default: null,
    },
    bannedAt: Date,
    deletedAt: Date,

    legalAttachment: {
      secure_url: String,
      public_id: String,
    },

    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ===================== HASH PASSWORD BEFORE SAVE =====================
companySchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// ===================== REMOVE RELATED JOBS (OPTIONAL) =====================
companySchema.pre("remove", async function (next) {
  try {
    await jobModel.deleteMany({ companyId: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

// ===================== VIRTUAL RELATION =====================
companySchema.virtual("jobs", {
  ref: "jobOpportunity",
  localField: "_id",
  foreignField: "companyId",
});

const companyModel = mongoose.model("company", companySchema);

export default companyModel;
