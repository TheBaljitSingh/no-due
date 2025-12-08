import User from "../model/user.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";

export const registerUser = async (req, res) => {
    const userData  = req.body;
    try{
        const savedUser = await User.create(userData);
        return new APIResponse(201,{user: savedUser},'User registered successfully').send(res);
    }catch(err){
        return new APIError(500,['User registration failed', err.message]).send(res);
    }
    
};
