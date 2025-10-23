import mongoose from "mongoose"
import jobModel from "./internship.model.js"


const companySchema = new mongoose.Schema({
    companyName: { 
        type: String,
        required: true,
        unique: true,
        minLength: 2,
        trim: true
    },
    description: {
        type: String,
        required: true,
        minLength: 10,
        trim: true
    },
    industry: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        require: true,
        trim: true
    },
    numberOfEmployees: {
        from: {type: Number, min: 0,required: true},
        to: {type: Number, min: 0,required: true}
    },
    companyEmail : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/
    },
    createdBy: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    logo: {
        secure_url: String,
        public_id: String
    },
    coverPic: {
        secure_url: String,
        public_id: String
    },
    HRs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],

    bannedAt: Date,
    deletedAt: Date,

    legalAttachment: {
        secure_url: String,
        public_id: String
    },
    approvedByAdmin: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true,
    toJSON: {virtuals:true},
    toObject: {virtuals: true}
}
)
companySchema.pre('remove',async function (next) {
    try{
        await jobModel.deleteMany({companyId:this._id})
        next()
    }catch(err){
        next(err)
    }
})

companySchema.virtual("jobs",{
    ref: "jobOpportunity",
    localField: "_id",
    foreignField: "companyId"
})

const companyModel = mongoose.model("company",companySchema)

export default companyModel