import User from "../model/user.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";

export const registerUser = async (req, res) => {
    const userData  = req.body;
    try{
        const savedUser = await User.create(userData);
        return new APIResponse(201,{user: savedUser},'User registered successfully').send(res);
    }catch(err){
        console.error('Error registering user:', err);
        return new APIError(500,['User registration failed', err.message]).send(res);
    }
    
};
