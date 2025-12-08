import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy} from 'passport-local';
import User from '../../model/user.model.js';

passport.use(new LocalStrategy({
    usernameField: 'email',
},
    async (email, password, done) => {
    try{
        const user = await User.findOne({email}).select("+password");
        if(!user){
            return done(null, false, {message: 'Email not registered'});
        }
        if(user.googleId){
            return done(null, false, {message: 'As you have signed up with your Google account, please login with Google!!'});
        }

        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return done(null, false, {message: 'Incorrect password'});
        }
        return done(null, user);
    }catch(err){
        console.error('Error in local strategy:', err);
        return done(err);
    }
}));


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
},
    async (request, accessToken, refreshToken, profile, done) => {
        try{
            let user  = await User.findOne({ googleId: profile.id });
            if (user){
                return done(null, user);    
            };

            // If user with the Google ID doesn't exist, create a new user
            const email = profile.emails[0].value;
            const existingUser = await User.findOne({ email });
            if(existingUser){
                // Link Google ID to existing user
                existingUser.googleId = profile.id;
                user = await existingUser.save();
                return done(null, user);
            }

            console.log('Creating new user from Google profile',profile);

            user = await User.create({
                googleId: profile.id,
                businessName: profile.displayName,
                email: profile.emails[0].value,
                password: "GoogleUser@" + Math.random().toString(36).slice(-8) // strong password
            });

            const isProfileComplete = user.name && user.phone && user.address?.city;
        user.isProfileComplete = !!isProfileComplete; // temporary field for frontend functionality

        return done(null, user);

        }catch(err){
            console.error('Error in Google strategy:', err);
            return done(err,null);
        }
}));


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try{
        const user = await User.findById(id);
        done(null, user);
    }catch(err){
        done(err,null);
    }
});

export default passport;