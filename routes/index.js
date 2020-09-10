const campground = require("../models/campground");

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
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
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


//USER PROFILE
router.get("/users/:user_id", function(req, res){
    User.findById(user_id, function(err, foundUser){
        if(err){
            req.flash("error", error.message);
            res.redirect("back");
        } else{
            campground.find().where("author.id").equals(foundUser._id).exec(function(err, foundCampgrorunds){
                if(err){
                    req.flash("error", error.message);
                    res.redirect("back");
                } else{
                    res.render("users/show",{user: foundUser, campgrounds: foundCampgrorunds});
                }
            })
        }
    })
})

module.exports = router;
