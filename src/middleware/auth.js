import jwt from "jsonwebtoken";
import userModel from "../DB/models/user.model.js";
import { asyncHandler } from "../utils/globalErrorHandling.js";
import companyModel from "../DB/models/company.model.js";

export const auth = (allowedTypes = []) => {
  return asyncHandler(async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
      return next(new Error("Authorization required", { cause: 400 }));
    }

    const [bearer, token] = authorization.split(" ");

    if (!bearer || !token) {
      return next(new Error("Token & bearer are required", { cause: 400 }));
    }

    let secretKey;
    let model;
    let entityType;

    // ===== Detect entity type =====
    if (bearer === process.env.USER_BEARER) {
      secretKey = process.env.USER_SECRET_KEY;
      model = userModel;
      entityType = "user";
    } else if (bearer === process.env.ADMIN_BEARER) {
      secretKey = process.env.ADMIN_SECRET_KEY;
      model = userModel;
      entityType = "admin";
    } else if (bearer === process.env.COMPANY_BEARER) {
      secretKey = process.env.COMPANY_SECRET_KEY;
      model = companyModel;
      entityType = "company";
    } else {
      return next(new Error("Invalid bearer!", { cause: 400 }));
    }

    try {
      const payload = jwt.verify(token, secretKey);

      if (!payload?.id) {
        return next(new Error("Invalid payload", { cause: 400 }));
      }

      const authEntity = await model.findById(payload.id).lean();

      if (!authEntity) {
        return next(new Error("Account not found", { cause: 404 }));
      }

      if (authEntity.deletedAt) {
        return next(new Error("This account is deleted", { cause: 403 }));
      }

      // ===== Role check (for users only) =====
      if (entityType === "user" || entityType === "admin") {
        if (allowedTypes.length && !allowedTypes.includes(authEntity.role)) {
          return next(
            new Error("You are not authorized to access this endpoint!", {
              cause: 403,
            }),
          );
        }

        req.user = authEntity;
      }

      // ===== Company =====
      if (entityType === "company") {
        if (allowedTypes.length && !allowedTypes.includes("company")) {
          return next(
            new Error("Company not allowed to access this endpoint", {
              cause: 403,
            }),
          );
        }

        if (authEntity.bannedAt || authEntity.deletedAt) {
          return next(
            new Error("Company is banned or deleted", { cause: 403 }),
          );
        }

        req.company = authEntity;
      }

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return next(
          new Error("Session expired. Please login again.", {
            cause: 401,
          }),
        );
      } else if (error.name === "JsonWebTokenError") {
        return next(new Error("Invalid token", { cause: 401 }));
      }
      return next(error);
    }
  });
};
export const authSocket = async ({ socket }) => {
  const bearer = socket?.handshake?.auth?.authorization?.split(" ")[0];
  const token = socket?.handshake?.auth?.authorization?.split(" ")[1];
  //Check bearer
  if (!bearer || !token) {
    return { message: "Token & bearer are required", statusCode: 400 };
  }
  let secretKey;
  if (bearer === process.env.USER_BEARER) {
    secretKey = process.env.USER_SECRET_KEY;
  } else if (bearer === process.env.ADMIN_BEARER) {
    secretKey = process.env.ADMIN_SECRET_KEY;
  } else {
    return { message: "Invalid bearer!", statusCode: 400 };
  }
  try {
    // check payload
    const payload = jwt.verify(token, secretKey);
    if (!payload?.id) {
      return { message: "Invalid payload", statusCode: 400 };
    }
    // Check id & user
    const authUser = await userModel.findById(payload.id).select("-otp").lean();
    if (!authUser) {
      return { message: "Not registered account!", statusCode: 400 };
    }
    //freezed account
    if (authUser?.isDeleted) {
      return { message: "This account freezed", statusCode: 400 };
    }
    //expire when change password
    if (parseInt(authUser?.changPasswordAt?.getTime() / 1000) >= payload.iat) {
      return { message: "token expired", statusCode: 400 };
    }
    return { authUser, statusCode: 200 };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return {
        message: "Your session has expired. Please log in again.",
        statusCode: 400,
      };
    } else if (error.name === "JsonWebTokenError") {
      return { message: "Invalid token", statusCode: 400 };
    } else {
      return next(error); // pass other unexpected errors to global handler
    }
  }
};
