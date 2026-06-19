import mongoose from "mongoose"

const connectDB = async()=>{
    return await mongoose.connect(process.env.DB_URI)
    .then(()=>{
        console.log("DB connected successfully");
    }).catch((err)=>{
        console.log('failed to connect whit DB!',err);
        
    })
}
export default connectDB