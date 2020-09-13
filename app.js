var express         = require("express"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),    
    app             = express(),
    Campground      = require("./models/campground"),
    Comment         = require("./models/comment"),
    User            = require("./models/user"),
    Notification    = require("./models/notification"),
    seed            = require("./seeds"),
    methodOverride  = require("method-override"),
    indexRoutes     = require("./routes/index"),
    campgroundsRoutes = require("./routes/campgrounds"),
    commentsRoutes    = require("./routes/comments"),
    flash           = require("connect-flash"),
    moment          = require("moment");


//RESET DATA/
//seed();
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = moment;

// mongodb://127.0.0.1:27017/yelp_camp
var url = process.env.DATABASEURL;
// env var setting 
mongoose.connect(url);

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
app.use(async function(req, res, next){
    //pass currentUser to every ejs file
    res.locals.currentUser = req.user;
    if(req.user) {
        try{
            let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false}).exec();
            res.locals.notifications = user.notifications.reverse();
        } catch(err) {
            console.log(err.message);
        }
    }
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
})

//ROUTES
app.use(indexRoutes);
app.use("/campgrounds", campgroundsRoutes);
app.use("/campgrounds/:id/comments", commentsRoutes);

var port = process.env.PORT || 3000;

app.listen(port, function(){
    console.log("Server listening started!!!");
});