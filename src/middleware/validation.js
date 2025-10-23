import { asyncHandler } from "../utils/globalErrorHandling.js"

export const validation = (schema)=>{
    return asyncHandler((req,res,next)=>{
        let inputData = {...req.body, ...req.params, ...req.query}
            const validationObject = schema.validate(inputData,{abortEarly: false})
            if(validationObject?.error){
                return res.status(422).json({msg: "Validation errors", errors: validationObject?.error.details})
                // return next(new Error("Validation Error",{cause: 422},validationObject?.error.details))
            }
            next()
        })
    }
