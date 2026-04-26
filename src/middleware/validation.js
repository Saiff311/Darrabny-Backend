import { asyncHandler } from "../utils/globalErrorHandling.js";

export const validation = (schema) => {
  return asyncHandler((req, res, next) => {

    // ✅ params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        return res.status(422).json({
          msg: "Validation errors",
          errors: error.details,
        });
      }
    }

    // ✅ body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        return res.status(422).json({
          msg: "Validation errors",
          errors: error.details,
        });
      }
    }

    // ✅ query
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        return res.status(422).json({
          msg: "Validation errors",
          errors: error.details,
        });
      }
    }

    next();
  });
};