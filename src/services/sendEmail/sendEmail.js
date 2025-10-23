import nodemailer from "nodemailer"

export const sendEmail = async ( to , subject , html , attachment) =>{

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASSWORD_EMAIL
        }
    })

    const info = await transporter.sendMail({
        from: process.env.USER_EMAIL,
        to: to? to: null,
        subject: subject? subject: null,
        html: html? html: null,
        attachments: attachment? attachment: [] 
    })
    
    if (info.accepted.length){
        return true
    }
    return false
    
} 