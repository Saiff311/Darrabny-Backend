import bcrypt from 'bcrypt'

export const hash = async(code)=>{
    const hashedCode = await bcrypt.hash(code,+process.env.SALT_ROUND)
    return hashedCode
}

export const compare = async (code, hashedCode) =>{
    return await bcrypt.compareSync(code, hashedCode)
}
