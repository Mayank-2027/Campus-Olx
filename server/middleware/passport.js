const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            const domain = '@' + email.split('@')[1];
            const collegeDomain = process.env.COLLEGE_DOMAIN || '@ietlucknow.ac.in';

            // Domain validation
            if (domain !== collegeDomain) {
                return done(null, false, {
                    message: `Only ${collegeDomain} email addresses are allowed`
                });
            }

            // Check if user exists
            let user = await User.findOne({ googleId: profile.id });

            if (!user) {
                // Check by email (in case they logged in differently before)
                user = await User.findOne({ email });

                if (user) {
                    // Link Google account
                    user.googleId = profile.id;
                    user.profilePic = profile.photos[0]?.value || '';
                    user.lastLogin = new Date();
                    await user.save();
                } else {
                    // Create new user
                    user = await User.create({
                        googleId: profile.id,
                        email,
                        name: profile.displayName,
                        profilePic: profile.photos[0]?.value || '',
                        isProfileComplete: false
                    });
                }
            } else {
                // Update last login & profile pic
                user.lastLogin = new Date();
                if (profile.photos[0]?.value) {
                    user.profilePic = profile.photos[0].value;
                }
                await user.save();
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id).select('-__v');
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
