import multer from 'multer'
import { nanoid } from 'nanoid'
import fs from "fs"
import path from 'path'

export const fileTypes = {
    image: ["image/png", "image/jpeg", "image/gif"],
    video: ["video/mp4"],
    audio: ["audio/mpeg"],
    pdf: ["application/pdf"]
}

export const localMulter = (customFile = [], customPath = "generals" ) => {

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
export const hostMulter = (customFile = [], maxSize = 10) => {
    
    const storage = multer.diskStorage({})
    
    function fileFilter(req, file, cb){
        if(customFile.includes(file.mimetype)){
            cb(null, true)
        }else{
            cb(new Error("Invalid file format", false))
        }
    }
        const upload = multer({
        fileFilter,
        storage,
        limits: { fileSize: maxSize * 1024 * 1024 }, // convert MB to bytes
    })
    return upload
}

