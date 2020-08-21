var express = require('express');
var router = express.Router();
var Recipe = require('../models/recipe');
var User = require('../models/user');
var middleware = require('../middleware/index.js');
var recipeScraper = require('recipe-scraper');
var scrapers = require('../middleware/scrapers.js');
var cheerio = require('cheerio');
var request = require('request');
// const bodyParser = require('body-parser');
// router.use(bodyParser.urlencoded());
// router.use(bodyParser.json());

// INDEX - show all recipes
router.get('/', middleware.isLoggedIn, function (req, res) {
	var userId = String(req.user._id);
	var query = { 'author.id': userId };

	// Pagination
	var perPage = 12;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;

	// Fuzzy search
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Recipe.find({
			'author.id': userId,
			$or: [ { title: regex }, { description: regex }, { url: regex }, { ingredients: regex }, { tags: regex } ]
		})
			.skip(perPage * pageNumber - perPage)
			.limit(perPage)
			.exec(function (err, allRecipes) {
				if (err || !allRecipes.length) {
					req.flash('error', 'No matches found.');
					res.redirect('back');
				}
				else {
					Recipe.countDocuments().exec(function (err, count) {
						if (err) {
							console.log(err);
							res.redirect('back');
						}
						else {
							res.render('recipes/index', {
								recipes: allRecipes,
								currentUser: req.user,
								current: pageNumber,
								pages: Math.ceil(allRecipes.length / perPage),
								search: req.query.search,
								tags: req.user.tags.sort()
							});
						}
					});
				}
			});
	}
	else if (req.query.SortAZ) {
		// Sort A to Z
		console.log('SORTING ASC');
		Recipe.find(query, (err, allRecipes) => {
			if (err) {
				console.log(err);
			}
			else {
				res.render('recipes/index', {
					recipes: allRecipes,
					currentUser: req.user,
					current: pageNumber,
					pages: Math.ceil(allRecipes.length / perPage),
					search: false,
					tags: req.user.tags.sort()
				});
			}
		}).sort({ title: 1 });
	}
	else if (req.query.SortZA) {
		// Sort Z to A
		console.log('SORTING DESC');
		Recipe.find(query, (err, allRecipes) => {
			if (err) {
				console.log(err);
			}
			else {
				res.render('recipes/index', {
					recipes: allRecipes,
					currentUser: req.user,
					current: pageNumber,
					pages: Math.ceil(allRecipes.length / perPage),
					search: false,
					tags: req.user.tags.sort()
				});
			}
		}).sort({ title: -1 });
	}
	else if (req.query.filter && req.query.filter !== 'all') {
		// Filter with tags
		var filter = req.query.filter;
		Recipe.find({ $and: [ { 'author.id': userId }, { tags: filter } ] })
			.skip(perPage * pageNumber - perPage)
			.limit(perPage)
			.exec(function (err, allRecipes) {
				Recipe.countDocuments().exec(function (err, count) {
					if (err) {
						console.log(err);
					}
					else {
						res.render('recipes/index', {
							recipes: allRecipes,
							currentUser: req.user,
							current: pageNumber,
							pages: Math.ceil(allRecipes.length / perPage),
							search: false,
							tags: req.user.tags.sort()
						});
					}
				});
			});
	}
	else {
		// Get all courts from DB
		Recipe.find(query, {}).skip(perPage * pageNumber - perPage).limit(perPage).exec(function (err, allRecipes) {
			Recipe.countDocuments().exec(function (err, count) {
				if (err) {
					console.log(err);
				}
				else {
					const recipeArray = Object.keys(allRecipes).map((i) => allRecipes[i]);

					res.render('recipes/index', {
						recipes: allRecipes,
						currentUser: req.user,
						current: pageNumber,
						pages: Math.ceil(allRecipes.length / perPage),
						search: false,
						tags: req.user.tags.sort()
					});
				}
			});
		});
	}
	// Recipe.find(query, function (err, allRecipes) {
	// 	if (err) {
	// 		console.log(err);
	// 	}
	// 	else {
	// 		res.render('recipes/index', { recipes: allRecipes, page: 'home' });
	// 	}
	// });
});

// Show edit tags page
router.get('/tags', middleware.isLoggedIn, function (req, res) {
	res.render('recipes/tags', { page: 'tags', tags: req.user.tags.sort() });
});

// Update tags
router.put('/tags', middleware.isLoggedIn, function (req, res) {
	var tags = req.body.tag;
	var userID = req.user.id;
	User.findByIdAndUpdate(userID, { tags: tags }, { safe: true, upsert: true, new: true }, function (err, model) {
		if (err) {
			console.log(err);
		}
		else {
			var userId = String(req.user._id);
			var query = { 'author.id': userId };
			Recipe.find({ 'author.id': req.user._id }, {}, function (err, foundRecipes) {
				if (err) {
					console.log(err);
				}
				else {
					foundRecipes.forEach(function (recipe) {
						var updatedTags = [];
						recipe.tags.forEach(function (tag) {
							if (model.tags.includes(tag)) {
								updatedTags.push(tag);
							}
						});
						recipe.tags = updatedTags;
						recipe.save();
					});
					req.flash('success', 'Tags Updated!');
					return res.redirect('/recipes');
				}
			});
		}
	});
});

// IMPORT NEW Form
router.get('/import/new', middleware.isLoggedIn, function (req, res) {
	res.render('recipes/import', { page: 'new' });
});

// CREATE IMPORT - add new recipe from import to db
router.post('/import', middleware.isLoggedIn, function (req, res) {
	var url = req.body.url;
	console.log(url);

	var author = {
		id: req.user._id,
		username: req.user.username
	};
	var websites = [
		'allrecipes.com',
		'bonappetit.com',
		'budgetbytes.com',
		'cookieandkate.com',
		'epicurious.com',
		'food.com',
		'foodandwine.com',
		'foodnetwork.com',
		'seriouseats.com',
		'thepioneerwoman.com',
		'thespruceeats.com'
	];
	var website = '';
	websites.forEach(function (site) {
		if (url.includes(site)) {
			website = site.split('.com')[0];
		}
	});
	if (website === '') {
		console.log('Not supported');
		async function someAsyncFunc () {
			let recipe = await recipeScraper(url);
		}
		recipeScraper(url)
			.then((recipe) => {
				var title = recipe.name;
				var time = recipe.time.ready;
				var servings = recipe.servings;
				var image = recipe.image;
				var url = url;
				var ingredients = recipe.ingredients;
				var steps = recipe.instructions;
				var author = {
					id: req.user._id,
					username: req.user.username
				};
				var newRecipe = {
					title: title,
					time: time,
					servings: servings,
					image: image,
					url: url,
					ingredients: ingredients,
					steps: steps,
					author: author
				};
				Recipe.create(newRecipe, function (err, newlyCreated) {
					if (err) {
						console.log(err);
						req.flash('error', "I'm sorry something went wrong.");
						res.redirect('/recipes/type/new');
					}
					else {
						// redirect back to view all
						res.redirect('/recipes/' + newlyCreated._id);
					}
				});
			})
			.catch((error) => {
				// do something with error
				console.log(error);
				req.flash('error', error.message);
				res.redirect('recipes/type/new');
			});
	}
	else {
		request(url, function (error, response, html) {
			if (!error && response.statusCode == 200) {
				var results = scrapers[website](html);
				results.then(function (result) {
					var newRecipe = {
						title: result[0],
						description: result[1],
						time: result[2],
						servings: result[3],
						image: result[4],
						url: url,
						ingredients: result[5],
						steps: result[6],
						author: author
					};
					Recipe.create(newRecipe, function (err, newlyCreated) {
						if (err) {
							console.log(err);
						}
						else {
							// redirect back to view all
							res.redirect('/recipes/' + newlyCreated._id);
						}
					});
				});
			}
			else {
				console.log('error', error.message);
			}
		});
	}
});

// NEW - show form to add new recipe
router.get('/type/new', middleware.isLoggedIn, function (req, res) {
	res.render('recipes/new', { page: 'new' });
});

// CREATE - add new recipe to db
router.post('/type', middleware.isLoggedIn, function (req, res) {
	var title = req.body.title;
	var description = req.body.description;
	var time = req.body.time + ' minutes';
	var servings = req.body.servings;
	var image = req.body.image;
	var url = req.body.url;
	var ingredients = req.body.ingredients.split('\r\n');
	var steps = req.body.steps.split('\r\n');
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	var newRecipe = {
		title: title,
		description: description,
		time: time,
		servings: servings,
		image: image,
		url: url,
		ingredients: ingredients,
		steps: steps,
		author: author
	};
	console.log(newRecipe);

	Recipe.create(newRecipe, function (err, newlyCreated) {
		if (err) {
			console.log(err);
		}
		else {
			// redirect back to view all
			res.redirect('/recipes/' + newlyCreated._id);
		}
	});
});

// SHOW - show more info about recipe
router.get('/:id', middleware.checkOwnership, function (req, res) {
	Recipe.findById(req.params.id, function (err, foundRecipe) {
		if (err) {
			console.log(err);
		}
		else {
			Recipe.find({}, function (err, allRecipes) {
				if (err) {
					console.log(err);
				}
				else {
					res.render('recipes/show', { recipe: foundRecipe, tags: req.user.tags.sort() });
				}
			});
			// render show template with recipe
			// res.render('recipes/show', { recipe: foundRecipe, recipes, recipes });
		}
	});
});

// Add Tags
router.put('/:id/tags', middleware.checkOwnership, function (req, res) {
	var tags = req.body.tag;
	var recipeID = req.params.id;
	var userID = req.user.id;
	User.findByIdAndUpdate(userID, { $addToSet: { tags: tags } }, { safe: true, upsert: true, new: true }, function (
		err,
		model
	) {
		if (err) {
			console.log(err);
		}
		else {
			Recipe.findByIdAndUpdate(
				recipeID,
				{ $addToSet: { tags: tags } },
				{ safe: true, upsert: true, new: true },
				function (err, model) {
					if (err) {
						console.log(err);
					}
					else {
						return res.redirect('/recipes/' + recipeID);
					}
				}
			);
		}
	});
});

// EDIT Form
router.get('/:id/edit', middleware.checkOwnership, function (req, res) {
	Recipe.findById(req.params.id, function (err, foundRecipe) {
		if (err) {
			req.flash('error', 'Page not found.');
			console.log(err);
		}
		else {
			// render edit form
			res.render('recipes/edit', { recipe: foundRecipe });
		}
	});
});

// Edit Logic
router.put('/:id', middleware.checkOwnership, function (req, res) {
	var editIng = req.body.recipe.ingredients.split('\r\n');
	req.body.recipe.ingredients = editIng;
	var editSteps = req.body.recipe.steps.split('\r\n');
	req.body.recipe.steps = editSteps;
	Recipe.findByIdAndUpdate(req.params.id, req.body.recipe, function (err, updatedRecipe) {
		if (err) {
			req.flash('error', err.message);
			res.redirect('back');
		}
		else {
			req.flash('success', 'Recipe Updated!');
			res.redirect('/recipes/' + req.params.id);
		}
	});
});

// DESTROY
router.delete('/:id', middleware.checkOwnership, function (req, res) {
	Recipe.findByIdAndRemove(req.params.id, function (err) {
		if (err) {
			req.flash('error', err.message);
			res.redirect('/recipes');
		}
		else {
			req.flash('success', 'Recipe Deleted!');
			res.redirect('/recipes');
		}
	});
});

function escapeRegex (text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function compare (a, b) {
	const titleA = a.title.toUpperCase();
	const titleB = b.title.toUpperCase();
	let comparison = 0;
	if (titleA > titleB) {
		comparison = 1;
	}
	else if (titleA < titleB) {
		comparison = -1;
	}
	return comparison;
}

function removeA (arr) {
	var what,
		a = arguments,
		L = a.length,
		ax;
	while (L > 1 && arr.length) {
		what = a[--L];
		while ((ax = arr.indexOf(what)) !== -1) {
			arr.splice(ax, 1);
		}
	}
	return arr;
}

module.exports = router;
