const campground = require("../models/campground");
var express = require("express"),
    router = express.Router(),
    passport = require("passport"), 
    User = require("../models/user"),
    async = require("async"),
    nodemailer = require("nodemailer"),
    crypto = require("crypto");
    
    



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

//FORGOT
router.get("/forgot", function(req, res){
    res.render("forgot");
});

//FORGOT POST
router.post("/forgot", function(req, res, next){
    async.waterfall([
        function(done){
            crypto.randomBytes(20, function(err, buf){
                var token = buf.toString("hex");
                done(err, token);
            });
        },
        function(token, done){
            User.findOne({email: req.body.email}, function(err, user){
                if (!user) {
                    req.flash("error", "No account with that email address exists");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "guojunseven@gmail.com",
                    pass: process.env.GMAILPW
                    }
            });
            var mailOptions = {
                to: user.email,
                from: "guojunseven@gmail.com",
                subject: "Node.js Password Reset",
                text: "Your are receiving this email because you (or someone else) have requested the reset of password" +
                      "Please click on the following link, or paste this into your browser to complete the process:" +
                      "http://" + req.headers.host + "/reset/" + token + "\n\n" +
                      "If you did not request this, please ignore this email and your password will remain unchanged"
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                if(err) {
                    req.flash("error", "Something went wrong!");
                }
                console.log("mail sent");
                req.flash("success", "An e-mail has been sent to " + user.email + " with further instrunctions.");
                done(err, "done");
            });
        }
    ], function(err){
        if (err) return next(err);
        res.redirect("/forgot");
    });
})

//RESET PAGE
router.get("/reset/:token", function(req, res){
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
        if(!user) {
            req.flash("error", "Password reset token is invaild or has expired.");
            return res.redirect("/forgot");
        }
        res.render("reset", {token: req.params.token});
    })
})

//RESET UPDATE
router.post("/reset/:token", function(req, res){
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
                if(!user) {
                    req.flash("error", "Password reset token is invalid or has expired.");
                    return res.redirect("back");
                }
                if(req.body.password === req.body.confirm){
                    user.setPassword(req.body.password, function(err){
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        user.save(function(err){
                            req.logIn(user, function(err){
                                done(err, user);
                            })
                        })
                    })
                } else{
                    req.flash("error", "Passwords do not match.")
                }
            });
        },
        function(user, done){
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "guojunseven@gmail.com",
                    pass: process.env.GMAILPW
                    }
            });
            var mailOptions = {
                to: user.email,
                from: "guojunseven@gmail.com",
                subject: "Your password has been changed",
                text:"This is a confirmation that the password for your account " + user.email + " has just been changed!"
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                if(err) {
                    req.flash("error", err.message);
                }
                console.log("mail sent");
                req.flash("sucess", "Success! your password has been changed!");
                done(err);
            });

        }, function(err) {
            res.redirect("/campgrounds");
        }
    ])
})


//USER PROFILE
router.get("/users/:user_id", function(req, res){
    User.findById(req.params.user_id, function(err, foundUser){
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
