import jwt from 'jsonwebtoken'
import userModel from '../DB/models/user.model.js'
import { asyncHandler } from '../utils/globalErrorHandling.js'
import { log } from 'console'

export const auth = (accessRoles = [])=>{
    return asyncHandler(async(req,res,next)=>{
        // Receive data (bearer & token)
        const {authorization} = req.headers
        if(!authorization){
            return next(new Error("authorization required",{cause: 400}))
        }
        const bearer = authorization.split(" ")[0]
        const token = authorization.split(" ")[1]
        //Check bearer
        if(!bearer || !token){
            return next(new Error("Token & bearer are required",{cause: 400}))
        }
        let secretKey
        if(bearer === process.env.USER_BEARER){
            secretKey = process.env.USER_SECRET_KEY
        }
        else if(bearer === process.env.ADMIN_BEARER){
            secretKey = process.env.ADMIN_SECRET_KEY
        }
        else if(bearer === process.env.COMPANY_BEARER){
            secretKey = process.env.COMPANY_SECRET_KEY
        }
        else{
            return next(new Error("Invalid bearer!",{cause: 400}))
        }
        try{
            // check payload
            const payload = jwt.verify(token,secretKey)
            if(!payload?.id){
                return next(new Error("Invalid payload",{cause: 400}))
            }
            // Check id & user
            const authUser = await userModel.findById(payload.id).select('-otp').lean()
            console.log(authUser);
            
            if(!authUser){
                return next(new Error("Not registered account!",{cause:400}))
            }
            //freezed account 
            if(authUser?.isDeleted){
                return next(new Error("This account freezed",{cause: 400}))
            }
            //authorization check
            if(!accessRoles.includes(authUser.role)){ //*
                return next(new Error("You arn't authorized to access this endPoint !",{cause: 400}))
            }
            //expire when change password
            if(parseInt(authUser?.changPasswordAt?.getTime()/1000) >= payload.iat){
                return next(new Error("token expired", {cause: 400}))
            }
            req.user=authUser //*
            next()
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                return next(new Error("Your session has expired. Please log in again.", { cause: 401 }));
            } else if (error.name === 'JsonWebTokenError') {
                return next(new Error("Invalid token", { cause: 401 }));
            } else {
                return next(error); // pass other unexpected errors to global handler
            }
        }
    })
}
export const authSocket = async({socket})=>{
  
        const bearer = socket?.handshake?.auth?.authorization?.split(" ")[0]
        const token = socket?.handshake?.auth?.authorization?.split(" ")[1]
        //Check bearer
        if(!bearer || !token){
            return {message: "Token & bearer are required",statusCode: 400}
        }
        let secretKey
        if(bearer === process.env.USER_BEARER){
            secretKey = process.env.USER_SECRET_KEY
        }
        else if(bearer === process.env.ADMIN_BEARER){
            secretKey = process.env.ADMIN_SECRET_KEY
        }
        else{
            return {message: "Invalid bearer!",statusCode: 400}
        }
        try{
            // check payload
            const payload = jwt.verify(token,secretKey)
            if(!payload?.id){
                return {message: "Invalid payload",statusCode: 400}
            }
            // Check id & user
            const authUser = await userModel.findById(payload.id).select('-otp').lean()
            if(!authUser){
                return {message: "Not registered account!",statusCode: 400}
            }
            //freezed account 
            if(authUser?.isDeleted){
                return {message: "This account freezed",statusCode: 400}
            }
            //expire when change password
            if(parseInt(authUser?.changPasswordAt?.getTime()/1000) >= payload.iat){
                return {message: "token expired",statusCode: 400}
            }
            return {authUser,statusCode: 200}
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                return {message: "Your session has expired. Please log in again.",statusCode: 400}
            } else if (error.name === 'JsonWebTokenError') {
                return {message: "Invalid token",statusCode: 400}
            } else {
                return next(error); // pass other unexpected errors to global handler
            }
        }
}