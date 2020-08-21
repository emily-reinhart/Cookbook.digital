var Recipe = require('../models/recipe');

var middlewareObj = {};

middlewareObj.isLoggedIn = function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/login');
};

middlewareObj.checkOwnership = function (req, res, next) {
	if (req.isAuthenticated()) {
		Recipe.findById(req.params.id, function (err, foundRecipe) {
			if (err) {
				req.flash('error', 'Not Found');
				res.redirect('back');
			}
			else {
				if (!foundRecipe) {
					req.flash('error', 'Recipe Not Found');
					return res.redirect('back');
				}

				if (foundRecipe.author.id.equals(req.user._id)) {
					next();
				}
				else {
					req.flash('error', "You don't have permission to do that.");
					res.redirect('back');
				}
			}
		});
	}
	else {
		req.flash('error', 'Please Login First!');
		res.redirect('/login');
	}
};

module.exports = middlewareObj;
