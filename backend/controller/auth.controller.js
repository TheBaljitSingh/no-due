import passport from "../utils/passportSetup/passportSetup";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";

export const googleLogin = passport.authenticate('google',{
    scope:['profile','email'],
    session: true,
});

export const googleLoginCallback = passport.authenticate('google',{
    successRedirect:`${process.env.backend_URL}/api/v1/auth/profile`,
    failureRedirect:`${process.env.CLIENT_URL}/login`,
    session: true,
});

export const geGoogleProfile = (req,res) => {
    if(!req.user){
        return new APIError(401,['unauthorized']).send(res);
    }

    if(req.user.isProfileComplete){
        return res.redirect(`${process.env.CLIENT_URL}/dashboard`)
    }
    else{
    res.redirect(`${process.env.CLIENT_URL}/profile`)
    }
};


export const checkAuth = async (req,res) => {
    return new APIResponse(200,{user: req.user},'session found').send(res);
};

export const logout = (req,res) => {    
    req.logout((err) => {
        if(err){
            return new APIError(500,['Logout failed']).send(res);
        };
        req.session.destroy((err) => {
            if(err){
                return new APIError(500,['Session destruction failed']).send(res);
            };
            req.clearCookie('connect.sid');
            return new APIResponse(200,{},'Logout successful').send(res);
        });
    });
};

export const localLogin = (req,res) => {
    passport.authenticate('local',(err,user,info) => {
        if(err){
            return new APIError(500,['Authentication failed',err.message]).send(res);
        }
        if(!user){
            return new APIError(401,[info?.message || 'User Not Found']).send(res);
        }
        req.login(user, (err) => {
            if(err){
                return new APIError(500,['Login failed']).send(res);
            }
            return new APIResponse(200,{user},'Login successful').send(res);
        });
    })(req,res);
};

