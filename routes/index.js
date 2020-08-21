var express = require('express');
var router = express.Router();
var Recipe = require('../models/recipe');
var passport = require('passport');
var User = require('../models/user');
var async = require('async');
var crypto = require('crypto');

// Mailgun Config
var api_key = process.env.MAILGUN_API;
var domain = process.env.MAILGUN_DOMAIN;
var mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });

// Root Route/Landing Page
router.get('/', function (req, res) {
	if (req.user) {
		return res.redirect('/recipes');
	}
	var query = { 'author.id': null };

	// Pagination
	var perPage = 12;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;

	// get all recipes from DB
	Recipe.find(query, {}).skip(perPage * pageNumber - perPage).limit(perPage).exec(function (err, allRecipes) {
		Recipe.countDocuments().exec(function (err, count) {
			if (err) {
				console.log(err);
			}
			else {
				res.render('demolanding', {
					recipes: allRecipes,
					currentUser: req.user,
					current: pageNumber,
					pages: Math.ceil(count / perPage),
					search: false
				});
			}
		});
	});
});

// Show demo recipe
router.get('/demo/:id', function (req, res) {
	Recipe.findById(req.params.id, function (err, foundRecipe) {
		if (err) {
			console.log(err);
		}
		else {
			// render show template with recipe
			console.log(req.user);
			console.log(foundRecipe.author.id);

			if (!req.user && foundRecipe.author.id) {
				console.log('wrong user', foundRecipe.author.id);
				res.redirect('/');
			}
			else {
				res.render('recipes/show', { recipe: foundRecipe, currentUser: req.user });
			}
		}
	});
});

// References
router.get('/references', function (req, res) {
	res.render('references', { page: 'references' });
});

// Show register form
router.get('/register', function (req, res) {
	if (!req.user) {
		res.render('register', { page: 'register' });
	}
	else {
		req.flash('error', 'You are already logged in.');
		return res.redirect('back');
	}
});

// Signup Logic
router.post('/register', function (req, res) {
	var newUser = new User({ username: req.body.username, email: req.body.email });
	User.register(newUser, req.body.password, function (err, user) {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('register');
		}
		passport.authenticate('local')(req, res, function () {
			req.flash('success', 'Welcome to your recipe book ' + user.username + '!');
			res.redirect('/recipes');
		});
	});
});

// Show login form
router.get('/login', function (req, res) {
	if (!req.user) {
		res.render('login', { page: 'login' });
	}
	else {
		req.flash('error', 'You are already logged in.');
		return res.redirect('back');
	}
});

// Login logic
router.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/recipes',
		failureRedirect: '/login',
		failureFlash: true
	}),
	function (req, res) {}
);

// Logout route
router.get('/logout', function (req, res) {
	req.logout();
	req.flash('success', 'Logged out!');
	res.redirect('/');
});

// Forgot password form
router.get('/forgot', function (req, res) {
	console.log('forgot');
	res.render('forgot', { page: 'forgot' });
});

// Forgot password route
router.post('/forgot', function (req, res, next) {
	async.waterfall(
		[
			function (done) {
				crypto.randomBytes(20, function (err, buf) {
					var token = buf.toString('hex');
					done(err, token);
				});
			},
			function (token, done) {
				User.findOne({ email: req.body.email }, function (err, user) {
					if (!user) {
						req.flash('error', 'No account with that email address exists.');
						return res.redirect('/forgot');
					}

					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

					user.save(function (err) {
						done(err, token, user);
					});
				});
			},
			function (token, user, done) {
				var data = {
					from: 'Emily from The Recipe Cookbook <emily@mail.cookbook.digital>',
					to: user.email,
					subject: 'Password Reset - The Recipe Cookbook',
					text:
						'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
						'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
						'http://' +
						req.headers.host +
						'/reset/' +
						token +
						'\n\n' +
						'If you did not request this, please ignore this email and your password will remain unchanged.\n'
				};
				mailgun.messages().send(data, function (error, body) {
					if (error) {
						console.log(error);
					}
					else {
						req.flash(
							'success',
							'An e-mail has been sent to ' + user.email + ' with further instructions.'
						);
						console.log(body);
						return res.redirect('/forgot');
					}
				});
			}
		],
		function (err) {
			if (err) return next(err);
			res.redirect('/forgot');
		}
	);
});

// Reset password form
router.get('/reset/:token', function (req, res) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (
		err,
		user
	) {
		if (!user) {
			req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('/forgot');
		}
		console.log('token', req.params.token);

		res.render('reset', { token: req.params.token });
	});
});

// Reset password route
router.post('/reset/:token', function (req, res) {
	async.waterfall(
		[
			function (done) {
				User.findOne(
					{ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },
					function (err, user) {
						if (!user) {
							req.flash('error', 'Password reset token is invalid or has expired.');
							return res.redirect('back');
						}
						if (req.body.password === req.body.confirm) {
							user.setPassword(req.body.password, function (err) {
								user.resetPasswordToken = undefined;
								user.resetPasswordExpires = undefined;

								user.save(function (err) {
									req.logIn(user, function (err) {
										done(err, user);
									});
								});
							});
						}
						else {
							req.flash('error', 'Passwords do not match.');
							return res.redirect('back');
						}
					}
				);
			},
			function (user, done) {
				var data = {
					from: 'Emily from The Recipe Cookbook <emily@mail.cookbook.digital>',
					to: user.email,
					subject: 'Your Password Has Been Changed - The Recipe Cookbook',
					text:
						'Hello,\n\n' +
						'This is a confirmation that the password for your account ' +
						user.email +
						' has just been changed.\n'
				};
				mailgun.messages().send(data, function (error, body) {
					if (error) {
						console.log(error);
					}
					else {
						req.flash('success', 'Password has been changed!');
						console.log(body);
						done();
					}
				});
			}
		],
		function (err) {
			res.redirect('/recipes');
		}
	);
});

module.exports = router;
