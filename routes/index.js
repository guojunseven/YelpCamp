var express = require("express"),
    router = express.Router(),
    passport = require("passport"), 
    User = require("../models/user"),
    middleware = require("../middleware")
    



//LANDING
router.get("/", function(req, res){
    res.render("landing");
})


//===========
//AUTH ROUTES
//===========

//SHOW REGISTER FORM
router.get("/register", function(req, res){
    res.render("register", {page: "register"});
});

//REGISTER POST
router.post("/register", function(req, res){
    var newUser = new User({
        username: req.body.username
    })
    //authenticate if it's admin
    if(req.body.admin === "secretcode") {
        newUser.isAdmin = true;
    };
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message)
            return res.redirect("register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.username)
            res.redirect("/campgrounds");
        });
    }); 
});

//SHOW LOGIN FORM
router.get("/login", function(req, res){
    res.render("login", {page: "login"} );
})

//LOGIN POST
router.post("/login", passport.authenticate("local", 
    //middle  ware
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true

    }),  function(req, res){

});

//LOGOUT
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!!!")
    res.redirect("/campgrounds");
})


module.exports = router;
