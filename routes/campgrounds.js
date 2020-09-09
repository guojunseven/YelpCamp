var express = require("express"),
    router = express.Router(), 
    Campground = require("../models/campground"),
    middleware = require("../middleware");

//import geocoder google
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX
router.get("/", function(req,  res){
    Campground.find({}, function(err, campgrounds){
        if(err) {
            console.log(err);
        } else {
            res.render("campgrounds/index", {campgrounds: campgrounds, page: "campgrounds"});
        }
    });
})

//NEW
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});

//CREATE
router.post("/", middleware.isLoggedIn, function(req, res){
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price;
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            console.log(err, data);
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
    newCampground = {name: name, price: price, image: image, description: description, author: author, location: location, lat: lat, lng: lng}
    //create a new campground and save it to DB
    Campground.create(newCampground, function(err, campground){
        if(err){
            console.log(err.message);
            return res.redirect('back');
        } else{
            console.log("NEWLY CAMPGROUND ADDED");
            console.log(campground);
            res.redirect("/campgrounds");
        }                  
    });
});
});

//SHOW
router.get("/:id", function(req, res){
    //find the specific image info by its id
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log("INFO FOUND!!!");
            res.render("campgrounds/show", {campground: foundCampground});
        }
    })
    
})

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnerShip, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
        
    });
});

//UPDATGE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnerShip, function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
    
        //find and update the corresponding campground
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
            if(err){
                req.flash("error", err.message);
                res.redirect("/campgrounds");
            } else{
                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + req.params.id);
            }
        })
})
});


//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnerShip, async function(req, res){
    try {
        let foundCampground = await Campground.findById(req.params.id);
        await foundCampground.remove();
        req.flash("success", "Campground deleted!!!")
        res.redirect("/campgrounds");
      } catch (error) {
        res.redirect("/campgrounds");
      }
    });
   


module.exports = router;