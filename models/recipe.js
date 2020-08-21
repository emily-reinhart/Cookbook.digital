var mongoose = require('mongoose');

// schema setup
var recipeSchema = new mongoose.Schema({
	title: String,
	description: String,
	time: String,
	servings: String,
	image: String,
	url: String,
	ingredients: [ String ],
	steps: [ String ],
	tags: [ String ],
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
		username: String
	}
});

module.exports = mongoose.model('Recipe', recipeSchema);
