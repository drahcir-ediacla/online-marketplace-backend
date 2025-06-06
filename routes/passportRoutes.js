const router = require("express").Router();
const passport = require("passport");
const { userModel } = require('../config/sequelizeConfig')
require('dotenv').config();


// const CLIENT_URL = "http://localhost:3000/";


// Route for checking if the user is authenticated and returning user information
router.get("/check-auth", (req, res) => {
  if (req.isAuthenticated()) {
    // If the user is authenticated, send user data
    res.status(200).json({
      success: true,
      user: req.user,
      cookies: req.cookies
    });
  } else {
    // If not authenticated, send an error or an empty response
    res.status(401).json({
      success: false,
      message: "User not authenticated",
    });
  }
});


router.get("/login/success", async (req, res) => {
  if (req.user) {

    res.status(200).json({
      success: true,
      message: "successfull",
      user: req.user,
      //   cookies: req.cookies
    });
  } else {
    // If not authenticated, send an error or an empty response
    res.status(401).json({
      success: false,
      message: "User not authenticated",
    });
  }
});

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "failure",
  });
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      // Handle any error that occurred during logout
      console.error(err);
    }
    res.redirect(process.env.CLIENT_URL);
  });
});



// PASSPORT GOOGLE
// router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// router.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     successRedirect: process.env.CLIENT_URL,
//     failureRedirect: "/login/failed",
//   })
// );

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: true }),
  async (req, res) => {

    const userId = req.user.id;
    const accessToken = req.user.accessToken;
    const refreshToken = req.user.refreshToken;

    // Update user status to 'online'
    await userModel.upsert({ id: userId, status: 'online' });

    // Emit user online event
    const io = req.io;
    io.emit('updateUserStatus', { id: userId, status: 'online' });

    // Set the refresh token and access token as cookies
    res.cookie('refreshJWT', refreshToken, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 24 * 60 * 60 * 1000, path: '/' });
    // res.cookie('jwt', accessToken, { httpOnly: true, secure: false, maxAge: 15 * 60 * 1000, path: '/' });  //maxAge is equivalent to 24 hours
    // console.log('jwt:', accessToken)

    res.redirect(`${process.env.CLIENT_URL}/auth/success`);  // Redirect to the desired page after successful login
  }
);




// Facebook Authentication Routes
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["public_profile", "email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: true }),
  async (req, res) => {
    if (!req.user) {
      return res.redirect("/login/failed");
    }

    const userId = req.user.id;
    const accessToken = req.user.accessToken;
    const refreshToken = req.user.refreshToken;

    // Update user status to 'online'
    await userModel.upsert({ id: userId, status: 'online' });

    // Emit user online event
    const io = req.io;
    io.emit('updateUserStatus', { id: userId, status: 'online' });

    // Set the refresh token and access token as cookies
    res.cookie('refreshJWT', refreshToken, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 24 * 60 * 60 * 1000, path: '/' });
    res.cookie('jwt', accessToken, { httpOnly: true,  sameSite: 'none', secure: true, maxAge: 15 * 60 * 1000, path: '/' });
    console.log('jwt:', accessToken);

    res.redirect(`${process.env.CLIENT_URL}/auth/success`); // Redirect to the desired page after successful login
  }
);


// PASSPORT LOCAL
router.post("/local", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      // Handle errors here
      return next(err);
    }
    if (!user) {
      // Authentication failed, you can log this
      console.log("Authentication failed");
      return res.redirect("/login/failed");
    }

    // If authentication is successful, you can log and redirect to success URL
    console.log("Authentication successful");
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect(process.env.CLIENT_URL);
    });
  })(req, res, next);
});


module.exports = router
