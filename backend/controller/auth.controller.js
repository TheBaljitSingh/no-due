import passport from "../utils/passportSetup/passportSetup.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";

export const googleLogin = passport.authenticate('google',{
    scope:['profile','email'],
    session: true,
});

export const googleLoginCallback = passport.authenticate('google', {
  successRedirect: `${process.env.CLIENT_BASE_URL}/google-success`,
  failureRedirect: `${process.env.CLIENT_BASE_URL}`,
  session: true,
});

export const getGoogleProfile = (req, res) => {
  if (!req.user) return new APIError(401, ['unauthorized']).send(res);
    return new APIResponse(200, { user: req.user }, 'Google profile fetched successfully').send(res);
};

export const checkAuth = async (req,res) => {
    if(req.user)
    return new APIResponse(200,{user: req.user},'session found').send(res);
    return new APIError(401,['No active session found','Unauthorized']).send(res);
};

export const logout = (req, res) => {
  console.log("Logging out user:", req.user ? req.user.id : "No user in request");

  req.logout(err => {
    if (err) {
      return new APIError(500, ["Logout failed"]).send(res);
    }

    req.session.destroy(err => {
      if (err) {
        return new APIError(500, ["Session destruction failed"]).send(res);
      }

      // CLEAR COOKIE PROPERLY
      res.clearCookie("connect.sid", {
        path: "/",           // REQUIRED
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV==='development'?false:true,       
      });

      console.log("Session + cookie cleared successfully");
      return new APIResponse(200, {}, "Logout successful").send(res);
    });
  });
};


const setMaxAge = (req, rememberMe) => {
  req.session.cookie.maxAge = rememberMe
    ? 7 * 24 * 60 * 60 * 1000 // 7 days
    : 24 * 60 * 60 * 1000;    // 1 day
};

export const localLogin = (req,res) => {
    passport.authenticate('local',(err,user,info) => {
        if(err){
            return new APIError(500,['Authentication failed',err.message]).send(res);
        }
        if(!user){
            return new APIError(401,[info?.message || 'User Not Found']).send(res);
        }
        const rememberMe = !!req.body.rememberMe;
        const lastLogin = Date.now();

        req.session.regenerate((err) => {
            if(err){
                return new APIError(500,['Session regeneration failed']).send(res);
            }
            req.login(user,async (err) => {
                if(err){
                    return new APIError(500,['Login failed']).send(res);
                }
                setMaxAge(req, rememberMe);
                try{
                    await new Promise((resolve, reject) => {
                        req.session.save((err) => {
                            if (err) return reject(err);
                            resolve();
                        });
                        const currenySid = req.sessionID;
                        //to update the last login time, and destroy the other sessions
                        //call this 

                        // const id = String(user._id || user.id);
                        const userResponse = user.toObject ? user.toObject() : user;
                        delete userResponse.password;
                        return new APIResponse(200,  { user:userResponse },'Login successful').send(res);
                    });

                }catch(err){
                    return new APIError(500,['Session save failed']).send(res);
                }
            });
        });
    })(req,res);
};

