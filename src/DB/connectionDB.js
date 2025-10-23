import mongoose from "mongoose"

const connectDB = async()=>{
    return await mongoose.connect(process.env.Db_URI)
    .then(()=>{
        console.log("DB connected successfully");
    }).catch((err)=>{
        console.log('failed to connect whit DB!',err);
        
    })
}
export default connectDB