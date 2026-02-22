import mongoose from "mongoose"

const projectSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["personal", "course"],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
}, { _id: true });

const studentSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    collegeId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "college",
        },
    graduation_year: {
        type: Number,
        min: [1940, "Graduation year cannot be before 1940"],
        max: [new Date().getFullYear() + 10, "Graduation year cannot be more than 10 years in the future"]
    },
    major: {
        type: String,
    },

    minor: String,
    
    CGPA : {
        type: Number,
        min: [0.0, "CGPA cannot be less than 0.0"],
        max: [4.0, "CGPA cannot be more than 4.0"]
    },
    resume: {
        secure_url: String,
        public_id: String
    },
    projects : [projectSchema]
  
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


const studentModel = mongoose.model("student",studentSchema)

export default studentModel



