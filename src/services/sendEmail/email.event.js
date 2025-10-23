import { customAlphabet } from "nanoid";
import { EventEmitter } from "events";
import userModel from "../../DB/models/user.model.js";
import { appStatus, otpType } from "../../utils/enums.js";
import { sendEmail } from "./sendEmail.js";
import { acceptHtml, createHtml } from "./emailTemplet.js";

 

 export const emailEvent = new EventEmitter()

 emailEvent.on("sendEmailConfirmation",async (email)=>{
    //generate otp
    const otpEmail = {
        code: customAlphabet("0123456789",4)(),
        type: otpType.confirmEmail,
        expiresIn: new Date(Date.now() + 10 * 60 * 1000) //10 minutes
    }
    //add otp in DB  
    // await userModel.updateOne({email},{$push:{otp: otpEmail}}) //(update methods) not working with pre save hook 
    const user = await userModel.findOne({ email });
    user.otp.push(otpEmail)
    await user.save() 
    await sendEmail(email,"Confirm Email",createHtml(otpEmail.code, "Confirm Email"))
 })

 emailEvent.on("sendEmailForgetPassword",async (email)=>{
    //generate otp
    const otpEmail = {
        code: customAlphabet("0123456789",4)(),
        type: otpType.forgetPassword,
        expiresIn: new Date(Date.now() + 10 * 60 * 1000) //10 minutes
    }
    //add otp in DB  
    const user = await userModel.findOne({ email })
    user.otp.push(otpEmail)
    user.markModified("otp")
    await user.save()
    await sendEmail(email,"Forget Password",createHtml(otpEmail.code,"Forget Password"))
 })

 emailEvent.on("sendApplicationStatus", async (email, status) => {
    const html = 
        status === appStatus.accepted ?
            acceptHtml() :
            rejectHtml()
    await sendEmail(email, "Application Status", html)
})