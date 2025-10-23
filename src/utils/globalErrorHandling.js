export const asyncHandler = (fn)=>{
    return (req, res, next)=>{
        try{
            fn(req,res,next)
        }catch(error){
            return next(error)
        }
    }
} 

export const globalErrorHandler = (err,req,res,next)=>{
    if(process.env.MODE == "Dev"){
        return res.status(err["cause"] || 500).json({message: err.message, stack: err.stack, err})
    }
    return res.status(err["cause"] || 500).json({message: err.message})
}