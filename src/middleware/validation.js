import { asyncHandler } from "../utils/globalErrorHandling.js";

export const validation = (schema) => {
  return asyncHandler((req, res, next) => {
    // Supports segmented schemas ({ body, params, query }) and flat schemas.
    if (schema?.body || schema?.params || schema?.query) {
      if (schema.body) {
        const { error } = schema.body.validate(req.body, { abortEarly: false });
        if (error) {
          return res.status(422).json({
            msg: "Validation errors",
            errors: error.details,
          });
        }
      }

      if (schema.params) {
        const { error } = schema.params.validate(req.params, {
          abortEarly: false,
        });
        if (error) {
          return res.status(422).json({
            msg: "Validation errors",
            errors: error.details,
          });
        }
      }

      if (schema.query) {
        const { error } = schema.query.validate(req.query, {
          abortEarly: false,
        });
        if (error) {
          return res.status(422).json({
            msg: "Validation errors",
            errors: error.details,
          });
        }
      }

      return next();
    }

    const inputData = { ...req.body, ...req.params, ...req.query };
    const validationObject = schema.validate(inputData, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (validationObject?.error) {
      return res.status(422).json({
        msg: "Validation errors",
        errors: validationObject.error.details,
      });
    }

    return next();
  });
};
