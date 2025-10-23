import multer from 'multer'
import { nanoid } from 'nanoid'
import fs from "fs"
import path from 'path'

export const fileTypes = {
    image: ["image/png", "image/jpg", "image/gif"],
    video: ["video/mp4"],
    audio: ["audio/mpeg"],
    pdf: ["application/pdf"]
}

export const localMulter = (customFile = [], customPath = "generals" ) => {
    console.log("akdsvkasjvhasdkj");
    
    const fullPath = path.resolve("./src/uploads", customPath)
    if(! fs.existsSync(fullPath)){
        fs.mkdirSync(fullPath, {recursive: true})
    }
    storage = multer.diskStorage({
        destination : (req, file, cb) => {
            cb(null, fullPath)
        },
        filename : (req, file, cb) => {
            cb(null,nanoid(5)+ file.originalname)
        }
    })
    console.log(req.file);
    
    function fileFilter(req, file, cb){
        if(customFile.includes(file.mimetype)){
            cb(null, true)
        }else{
            cb(new Error("Invalid file format", false))
        }
    }

    const upload = multer({fileFilter, storage})
    return upload
}
export const hostMulter = (customFile = []) => {
    
    const storage = multer.diskStorage({})
    
    function fileFilter(req, file, cb){
        if(customFile.includes(file.mimetype)){
            cb(null, true)
        }else{
            cb(new Error("Invalid file format", false))
        }
    }
    const upload = multer({fileFilter, storage})
    return upload
}
