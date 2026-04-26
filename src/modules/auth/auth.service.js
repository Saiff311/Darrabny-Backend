import { OAuth2Client } from "google-auth-library";
import userModel from "../../DB/models/user.model.js";
import { emailEvent } from "../../services/sendEmail/email.event.js";
import { otpType, providers, roles } from "../../utils/enums.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";
import { compare } from "../../utils/security/hashing.js";
import jwt from "jsonwebtoken";
import collegeModel from "../../DB/models/college.model.js";
import studentModel from "../../DB/models/student.model.js";
import companyModel from "../../DB/models/company.model.js";
import company_supervisorModel from "../../DB/models/company_supervisor.model.js";
import academic_supervisorModel from "../../DB/models/academic_supervisor.model.js";

//-------------------------- signUp ----------------------------------------------
export const signUp = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    gender,
    DOB,
    mobileNumber,
    role,
  } = req.body;
  // check user email if it exist
  const emailExist = await userModel.findOne({ email });
  if (emailExist) {
    return next(new Error("Email already signup before", { cause: 409 }));
  }
  //create user
  const user = await userModel.create({
    firstName,
    lastName,
    email,
    password,
    gender,
    DOB,
    mobileNumber,
    role,
  });

  if (role === roles.student) {
    const { collegeId, graduationYear, major, minor, CGPA } = req.body;
    // check if college exists
    if (collegeId) {
      const college = await collegeModel.findById(collegeId);
      if (!college) {
        return next(
          new Error("College ID doesn't exist in the system", { cause: 400 }),
        );
      }
    }
    //create student
    await studentModel.create({
      userId: user._id,
      collegeId,
      graduationYear,
      major,
      minor,
      CGPA,
    });
  } else if (role === roles.academic_supervisor) {
    const { collegeId, department, title } = req.body;
    // check if college exists
    const college = await collegeModel.findById(collegeId);
    if (!college)
      return next(
        new Error("College ID doesn't exist in the system", { cause: 400 }),
      );
    //create academic supervisor
    await academic_supervisorModel.create({
      userId: user._id,
      collegeId,
      department,
      title,
    });
  } else if (role === roles.company_supervisor) {
    const { companyId, position } = req.body;
    // check if company exists
    const company = await companyModel.findById(companyId);
    if (!company)
      return next(
        new Error("Company ID doesn't exist in the system", { cause: 400 }),
      );
    //create company supervisor
    await company_supervisorModel.create({
      userId: user._id,
      companyId,
      position,
    });
  }

  // send otp
  emailEvent.emit("sendEmailConfirmation", email);
  //show user info
  const userInfo = await userModel.findOne({ email }).select("-otp -password");
  return res.status(200).json({ msg: "SignUp successfully", userInfo });
});

//-------------------------- confirmOTP ------------------------------------------
export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { email, code } = req.body;
  //check email &  isConfirmed
  const user = await userModel.findOne({ email, isConfirmed: false });
  if (!user) {
    return next(
      new Error("Email not exits or already confirmed", { cause: 400 }),
    );
  }
  // check otp that is not empty
  if (user.otp.length === 0) {
    return next(new Error("OTP array is empty", { cause: 400 }));
  }
  // check otp expire date
  const now = new Date();
  if (now >= user.otp[0].expiresIn) {
    return next(new Error("expire code..", { cause: 400 }));
  }
  //compare otp code
  if (!(await compare(code, user.otp[0].code))) {
    return next(new Error("Invalid code number", { cause: 400 }));
  }
  //update user
  await userModel.updateOne({ email }, { isConfirmed: true });
  return res.status(200).json({ msg: "done" });
});

//-------------------------- login -----------------------------------------------
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // التأكد من وجود اليوزر
  const user = await userModel.findOne({
    email,
    // isConfirmed: true, // ⏸ مؤجل حالياً
    provider: providers.system,
    deletedAt: null,
  });

  if (!user) {
    return next(new Error("This email isn't existed", { cause: 400 }));
  }

  /*
  // 🔒 هنفعل الجزء ده بعدين لما نرجع شرط التأكيد
  if (!user.isConfirmed) {
    return next(new Error("Email not confirmed yet", { cause: 400 }));
  }
  */

  // التأكد من كلمة المرور
  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    return next(new Error("Invalid password", { cause: 400 }));
  }

  // إنشاء التوكن
  const secretKey =
    user.role === roles.admin
      ? process.env.ADMIN_SECRET_KEY
      : process.env.USER_SECRET_KEY;

  const accessToken = jwt.sign({ email, id: user._id }, secretKey, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign({ email, id: user._id }, secretKey, {
    expiresIn: "7d",
  });

  // إعادة الرد مع الـ tokens واليوزر id
  return res.status(201).json({
    message: "done",
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
    token: { accessToken, refreshToken },
  });
});

//-------------------------- login & signUp with gmail ---------------------------
export const loginWithGmail = asyncHandler(async (req, res, next) => {
  //login
  const { idToken } = req.body;
  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  }
  
  const { email, email_verified, picture, given_name, family_name } =
    await verify();
  //signup
  let user = await userModel.findOne({ email });
  if (!user) {
    user = await userModel.create({
      firstName: given_name,
      lastName: family_name,
      email,
      isConfirmed: email_verified,
      profilePi: picture,
      provider: providers.google,
    });
  }
  if (user.provider != providers.google) {
    return next(new Error("please signin with the system"));
  }
  //Creating the token
  const accessToken = jwt.sign(
    { email, id: user._id },
    user.role == roles.admin
      ? process.env.ADMIN_SECRET_KEY
      : process.env.USER_SECRET_KEY, //*
    { expiresIn: "1h" },
  );
  return res.status(201).json({ msg: "done", accessToken });
});

//-------------------------- refreshToken ----------------------------------------
export const refreshToken = asyncHandler(async (req, res, next) => {
  const { authorization } = req.body;
  const bearer = authorization.split(" ")[0];
  const token = authorization.split(" ")[1];
  if (!bearer || !token) {
    return next(new Error("Token & bearer are required", { cause: 400 }));
  }
  let secretKey;
  if (bearer === process.env.USER_BEARER) {
    secretKey = process.env.USER_SECRET_KEY;
  } else if (bearer === process.env.ADMIN_BEARER) {
    secretKey = process.env.ADMIN_SECRET_KEY;
  } else {
    return next(new Error("Invalid bearer!", { cause: 400 }));
  }
  const payload = jwt.verify(token, secretKey);
  if (!payload?.id) {
    return next(new Error("Invalid payload", { cause: 400 }));
  }
  const user = await userModel
    .findOne({ _id: payload.id, deletedAt: null })
    .select("-password")
    .lean();
  if (!user) {
    return next(new Error("Not registered account!", { cause: 400 }));
  }
  //Creating the token
  const accessToken = jwt.sign(
    { email: user.email, id: user._id },
    user.role == roles.admin
      ? process.env.ADMIN_SECRET_KEY
      : process.env.USER_SECRET_KEY, //*
    { expiresIn: "1h" },
  );
  return res.status(201).json({ msg: "done", accessToken });
});

//-------------------------- forgetPassword ------------------------------------------
export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  //check email
  const user = await userModel.findOne({ email, deletedAt: null });
  if (!user) {
    return next(new Error("Email not exits", { cause: 400 }));
  }
  emailEvent.emit("sendEmailForgetPassword", email);
  return res.status(200).json({ msg: "done" });
});

//-------------------------- resetPassword ------------------------------------------
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, code, newPassword } = req.body;
  // Check email
  const user = await userModel.findOne({ email, deletedAt: null });
  if (!user) {
    return next(new Error("Email does not exist", { cause: 400 }));
  }
  if (!user.otp || user.otp.length === 0) {
    return next(new Error("OTP array is empty", { cause: 400 }));
  }
  // Get the latest valid and non-expired OTP for forgetPassword type
  const now = new Date();
  const validOtp = user.otp.find(
    (otp) => otp.type === otpType.forgetPassword && otp.expiresIn > now,
  );
  if (!validOtp) {
    return next(new Error("Expired or invalid OTP", { cause: 400 }));
  }
  // Compare code
  if (!(await compare(code, validOtp.code))) {
    return next(new Error("Invalid OTP code", { cause: 400 }));
  }
  // Update password
  user.password = newPassword;
  await user.save();
  return res.status(200).json({ msg: "Password reset successful" });
});
