const comment = require("../models/comment");

var express = require("express"),
    router = express.Router({mergeParams: true}),
    Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    middleware = require("../middleware")


//COMMENTS NEW
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find campground by id 
    Campground.findById(req.params.id, function(err, campground){
        if(err) {
            console.log(err);
        } else{
            res.render("comments/new", {campground: campground});
        }
    })
})

//COMMENTS CREATE
router.post("/", middleware.isLoggedIn, function(req, res){
    //lookup campground using ID
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err)
            res.redirect("/campgrounds");
        } else{
            //create new comment
            Comment.create(req.body.comment, function(err, comments){
                if(err){
                    req.flash("error", "Something went wrong!!!")
                    console.log(err);
                } else{
                    //add user info to comment in mongoose
                    comments.author.username = req.user.username;
                    comments.author.id = req.user._id;
                    comments.save();
                    //connect new comment to campground
                    campground.comments.push(comments);
                    campground.save();
                    //redirect to campgroung show page
                    req.flash("success", "Successfully added comment!!!")
                    res.redirect("/campgrounds/" + campground._id)
                }
            });
             
        }
    })
    
})

//COMMENT EDIT  
router.get("/:comment_id/edit", middleware.checkCommentOwnerShip, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect("back");
        } else{
            res.render("comments/edit", {campground_id : req.params.id, comment: foundComment});
        }
    })

})

//COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnerShip, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
})

//COMMENT DESTROY
router.delete("/:comment_id", middleware.checkCommentOwnerShip, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else{
            req.flash("success", "Comment deleted!!!")
            res.redirect("/campgrounds/" + req.params.id);
            
        }
    })
})



module.exports = router;