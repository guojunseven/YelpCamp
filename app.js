var express         = require("express"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),    
    app             = express(),
    Campground      = require("./models/campground"),
    Comment         = require("./models/comment"),
    User            = require("./models/user"),
    seed            = require("./seeds"),
    methodOverride  = require("method-override"),
    indexRoutes     = require("./routes/index"),
    campgroundsRoutes = require("./routes/campgrounds"),
    commentsRoutes    = require("./routes/comments"),
    flash           = require("connect-flash")


//RESET DATA/
//seed();
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(flash());
mongoose.connect("mongodb://localhost:27017/yelp_camp", { useNewUrlParser: true, useUnifiedTopology: true});
  

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Rusty is the cutest dog!!!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//middleware added to every routes
app.use(function(req, res, next){
    //pass currentUser to every ejs file
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
})

app.use(indexRoutes);
app.use("/campgrounds", campgroundsRoutes);
app.use("/campgrounds/:id/comments", commentsRoutes);

var port = process.env.PORT || 3000;

app.listen(port, function(){
    console.log("Server listening started!!!");
});