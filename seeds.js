var mongoose = require('mongoose');
var Recipe = require('./models/recipe');

var recipes = [
	{
		title: 'Pasta',
		image:
			'https://images.unsplash.com/photo-1546549032-9571cd6b27df?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=600&q=60',
		ingredients: [ 'pasta', 'sauce', 'water' ],
		steps: [ 'cook pasta', 'put sauce on pasta' ],
		time: 60
	},
	{
		title: 'Soup',
		image:
			'https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=600&q=60',
		ingredients: [ 'potatoes', 'carrots', 'water' ],
		steps: [ 'boil potatoes', 'add carrots to pot' ],
		time: 30
	},
	{
		title: 'Salad',
		image:
			'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=600&q=60',
		ingredients: [ 'lettuce', 'dressing', 'tomatoes' ],
		steps: [ 'chop lettuce', 'chop tomatoes', 'put dressing on lettuce and tomatoes' ],
		time: 15
	}
];

function seedDB () {
	Recipe.remove({}, function (err) {
		if (err) {
			console.log(err);
		}
		console.log('removed recipes');
		//add recipes
		recipes.forEach(function (seed) {
			Recipe.create(seed, function (err, recipe) {
				if (err) {
					console.log(err);
				}
				else {
					console.log('added recipe');
				}
			});
		});
	});
}

module.exports = seedDB;
