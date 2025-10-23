import CryptoJS from "crypto-js"
import { asyncHandler } from "../globalErrorHandling.js";

export const encrypt = (code)=>{
    const encryptedCode = CryptoJS.AES.encrypt(code,process.env.SECRET_KEY).toString();
    return encryptedCode
}

export const decrypt = (encryptedCode)=>{
    const plainText = CryptoJS.AES.decrypt(encryptedCode,process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
    return plainText
}