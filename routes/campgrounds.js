var express = require("express"),
    router = express.Router(), 
    Campground = require("../models/campground"),
    middleware = require("../middleware");

// multer adn cloudinary configuration
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'ddtsikyfz', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//import geocoder google
var NodeGeocoder = require('node-geocoder');
const e = require("express");
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX
router.get("/", function(req,  res){
    //search
    var noMatch;
    if (req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), "gi");
        Campground.find({name: regex}, function(err, campgrounds){
            if(err) {
                console.log(err);
            } else {
                if (campgrounds.length<1){
                    var noMatch = "No campgrounds match " + req.query.search + " , please try again!";
                }
                res.render("campgrounds/index", {campgrounds: campgrounds, page: "campgrounds", noMatch: noMatch});
            }
        });
    } else {
        Campground.find({}, function(err, campgrounds){
            if(err) {
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: campgrounds, page: "campgrounds", noMatch: noMatch});
            }
        });
    }
})

//NEW
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});

//CREATE
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
    cloudinary.uploader.upload(req.file.path, function(result){
        var name = req.body.name;
        var image = result.secure_url;
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
        //newCampground = {name: name, price: price, image: image, description: description, author: author}
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
router.put("/:id", middleware.checkCampgroundOwnerShip, upload.single('image'), function(req, res){
    cloudinary.uploader.upload(req.file.path, function(result){
        //check if upload image
        if(result.secure_url && result.secure_url.length > 0){
            req.body.campground.image = result.secure_url;
        };
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
   
function escapeRegex(text){
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;