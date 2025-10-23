import mongoose from "mongoose"
import { internshipLocations, workingTimes } from "../../utils/enums.js"
import applicationModel from "./application.model.js"
import { getTimeAgo } from "../../utils/local-functions/timeAgo.js"

const internshipSchema = mongoose.Schema({
    internshipTittle: {
        type: String,
        required: true,
        trim: true,
    },
    internshipLocation: {
        type: String,
        required: true,
        enum: Object.values(internshipLocations)
    },
    workingTime: {
        type: String,
        require: true,
        enum: Object.values(workingTimes)
    },
    internshipDescription: {
        type: String,
        required: true,
        trim: true
    },
    technicalSkills:[{
        type: String,
        required: true,
        trim: true
    }],
    softSkills :[{
        type: String,
        required: true,
        trim: true
    }],
    addedBy:{
        type: mongoose.Schema.Types.ObjectId,
        // ref: "company",
        ref: 'user'
    },
    updatedBy:{
        type: mongoose.Schema.Types.ObjectId,
        // ref: "company",
        ref: 'user'
    },
    closed: {
        type: Boolean,
        default: false
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company"
    },
    deletedAt: Date
},{
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})
internshipSchema.virtual('Applications',{
    ref: 'application',
    localField: '_id',
    foreignField: 'internshipId',
})
internshipSchema.pre('remove',async function(next) {
    try{
        await applicationModel.deleteMany({internshipId: this._id})
        next()
    }catch(err){
        next(err)
    }
    
})

// Virtual for posted time ago
internshipSchema.virtual("postedAgo").get(function () {
  return getTimeAgo(this.createdAt);
});

const internshipModel = mongoose.model("internship",internshipSchema)

export default internshipModel