import rateLimit from "express-rate-limit"

export const rateLimiter = rateLimit({
    limit: 20,
    windowMs: 60*1000,
    handler: (req,res,next)=>{
        return next(new Error("Too many requests, Please try again in a minute", {cause: 429}))
    }
})
