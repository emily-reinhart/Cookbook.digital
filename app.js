require('dotenv').config();

var express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	mongoose = require('mongoose'),
	flash = require('connect-flash'),
	passport = require('passport'),
	LocalStrategy = require('passport-local'),
	methodOverride = require('method-override'),
	session = require('express-session'),
	MongoStore = require('connect-mongo')(session),
	Recipe = require('./models/recipe'),
	User = require('./models/user'),
	seedDB = require('./seeds');

// Requiring Routes
var recipeRoutes = require('./routes/recipes'),
	indexRoutes = require('./routes/index');

// Connect to database
mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useUnifiedTopology: true
	})
	.then(() => {
		console.log('Connected to DB');
	})
	.catch((err) => {
		console.log('ERROR', err.message);
	});
app.use(bodyParser.urlencoded({ extended: true }));
//designates that rendered files will be .ejs file types
app.set('view engine', 'ejs');
//designates location of templates
app.use(express.static(__dirname + '/public'));
app.use(methodOverride('_method'));
app.use(flash());

//adds to db
// seedDB();

// PASSPORT CONFIGURATION
app.use(
	session({
		secret: 'Zoe loves beef jerky!',
		resave: false,
		saveUninitialized: false,
		store: new MongoStore({ mongooseConnection: mongoose.connection }),
		cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
	})
);
// app.use(
// 	require('express-session')({
// 		secret: 'Zoe loves beef jerky!',
// 		resave: false,
// 		saveUninitialized: false
// 	})
// );
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	next();
});

app.use('/', indexRoutes);
app.use('/recipes', recipeRoutes);

var port = process.env.PORT || 3000;
app.listen(port, process.env.IP, function () {
	console.log('Server Has Started!');
});
