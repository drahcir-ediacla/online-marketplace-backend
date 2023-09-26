const router = require("express").Router();
const passport = require("passport");
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


router.get("/login/success", (req, res) => {
    if (req.user) {
      res.status(200).json({
        success: true,
        message: "successfull",
        user: req.user,
        //   cookies: req.cookies
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

  
  router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      successRedirect: process.env.CLIENT_URL,
      failureRedirect: "/login/failed",
    })
  );

  router.get("/facebook", passport.authenticate("facebook", { scope: ["profile", "email"] }));

  router.get(
    "/facebook/callback",
    passport.authenticate("facebook", {
      successRedirect: process.env.CLIENT_URL,
      failureRedirect: "/login/failed",
    })
  );

  router.post("/local", passport.authenticate("local", {
    successRedirect: process.env.CLIENT_URL, // Redirect on success
    failureRedirect: "/login/failed", // Redirect on failure
  }));

module.exports = router
