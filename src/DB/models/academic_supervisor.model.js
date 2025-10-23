import mongoose from "mongoose"

const academic_supervisorSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    collegeId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "college",
        required: true
        },
    department: {
        type: String,
        required: true,
    },
    title : {
        type: String
    }
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

const academic_supervisorModel = mongoose.model("academic_supervisor",academic_supervisorSchema)

export default academic_supervisorModel



