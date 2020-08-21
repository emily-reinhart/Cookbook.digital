var Recipe = require('../models/recipe');
var cheerio = require('cheerio');

var scraperObj = {};

scraperObj.allrecipes = async function (html) {
	try {
		var $ = cheerio.load(html);
		var title = $('#recipe-main-content').text();
		var desc = $('.submitter__description').text().trim();
		var time = $("[itemprop = 'totalTime']").text().trim();
		var servings = $("[itemprop = 'recipeYield']").attr('content');
		var image = $('.rec-photo').attr('src');
		var ingredients = [];
		var steps = [];
		$("[itemprop = 'recipeIngredient']").each(function (i) {
			ingredients.push($(this).text());
		});
		$('.recipe-directions__list--item').each(function (i) {
			if ($(this).text().trim() !== '') {
				steps.push($(this).text().trim());
			}
		});
	} catch (e) {
		console.log(e);
	}
	return [ title, desc, time, servings, image, ingredients, steps ];
};

scraperObj.bonappetit = async function (html) {
	try {
		var $ = cheerio.load(html);
		var title = $("[property = 'og:title']").attr('content');
		var desc = $("[property = 'og:description']").attr('content');
		var image = $("[property = 'og:image']").attr('content');
		var servings = $('.recipe__header__servings').text();
		var time = '';
		var ingredients = [];
		var steps = [];
		$('.ingredients__text').each(function (i) {
			ingredients.push($(this).text());
		});
		$('.step').each(function (i) {
			steps.push($(this).text());
		});
	} catch (e) {
		console.log(e);
	}
	return [ title, desc, time, servings, image, ingredients, steps ];
};

scraperObj.budgetbytes = async function (html) {
	try {
		var $ = cheerio.load(html);
		var title = $('.title').text();
		var desc = $('.p1').text();
		var image = $("[property = 'og:image']").attr('content');
		var servings = $('.wprm-recipe-servings').text();
		var time = $('.wprm-recipe-total_time').text();
		var ingredients = [];
		var steps = [];
		$('.wprm-recipe-ingredient-notes').remove();
		$('.wprm-recipe-ingredient').each(function (i) {
			ingredients.push($(this).text());
		});
		$('.wprm-recipe-instruction-text').each(function (i) {
			steps.push($(this).text());
		});
	} catch (e) {
		console.log(e);
	}
	return [ title, desc, time, servings, image, ingredients, steps ];
};

scraperObj.cookieandkate = async function (html) {
	try {
		var $ = cheerio.load(html);
		var title = $('.tasty-recipes h2').text();
		var desc = $('.tasty-recipes-description').text();
		var image = $("[property = 'og:image']").attr('content');
		$('.tasty-recipes-yield-scale').remove();
		var servings = $('.tasty-recipes-yield').text().split(' servings')[0];
		var time = $('.tasty-recipes-total-time').text().split(' minutes')[0];
		var ingredients = [];
		var steps = [];
		$('.tasty-recipe-ingredients li').each(function (i) {
			ingredients.push($(this).text());
		});
		$('.tasty-recipe-instructions li').each(function (i) {
			steps.push($(this).text());
		});
	} catch (e) {
		console.log(e);
	}
	return [ title, desc, time, servings, image, ingredients, steps ];
};

scraperObj.epicurious = async function (html) {
	try {
		var $ = cheerio.load(html);
		var title = $("[property = 'og:title']").attr('content');
		var desc = $("[property = 'og:description']").attr('content');
		var image = $("[property = 'og:image']").attr('content');
		var servings = $("[itemProp = 'recipeYield']").text().split('Makes ')[1].split(' servings')[0];
		var time = '';
		var ingredients = [];
		var steps = [];
		$('.ingredient-group').each(function (i) {
			if ($(this).find('strong').text() !== '') {
				ingredients.push($(this).find('strong').text());
			}
			$(this).find('.ingredient').each(function (i) {
				ingredients.push($(this).text());
			});
		});
		$('.preparation-group').each(function (i) {
			if ($(this).find('strong').text() !== '') {
				steps.push($(this).find('strong').text().trim());
			}
			$(this).find('.preparation-step').each(function (i) {
				steps.push($(this).text().trim());
			});
		});
	} catch (e) {
		console.log(e);
	}
	return [ title, desc, time, servings, image, ingredients, steps ];
};

scraperObj.food = async function (html) {
	try {
		var $ = cheerio.load(html);
		var title = $('.recipe-title').text();
		var desc = $("[name = 'og:description']").attr('content');
		var image = $("[name = 'og:image']").attr('content');
		var servings = $('.recipe-facts__servings a').text();
		$('.recipe-facts__title').remove();
		var time = $('.recipe-facts__time span').text().split('m')[0];
		var ingredients = [];
		var steps = [];
		$('.recipe-ingredients__ingredient').each(function (i) {
			ingredients.push($(this).text().trim());
		});
		$('.recipe-directions__step').each(function (i) {
			steps.push($(this).text());
		});
	} catch (e) {
		console.log(e);
	}
	return [ title, desc, time, servings, image, ingredients, steps ];
};

scraperObj.foodandwine = async function (html) {
	try {
		var $ = cheerio.load(html);
		var title = $("[property = 'og:title']").attr('content');
		var desc = $("[property = 'og:description']").attr('content');
		var image = $("[property = 'og:image']").attr('content');
		let metaBody = $('.recipe-meta-item-body');
		var time = $(metaBody.get(1)).text().trim().split(' ')[0];
		var servings = metaBody.last().text().trim().split(': ')[1];
		var ingredients = [];
		var steps = [];
		$('.ingredients li').each(function (i) {
			ingredients.push($(this).text().trim());
		});
		$('.step .paragraph').each(function (i) {
			steps.push($(this).text().trim());
		});
	} catch (e) {
		console.log(e);
	}
	return [ title, desc, time, servings, image, ingredients, steps ];
};

scraperObj.foodnetwork = async function (html) {
	try {
		var $ = cheerio.load(html);
		var title = $("[property = 'og:title']").attr('content');
		var desc = $("[property = 'og:description']").attr('content');
		var image = $("[property = 'og:image']").attr('content');
		var servings = $('.o-RecipeInfo__a-Description').last().text().split(' servings')[0];
		var time = $('.o-RecipeInfo__a-Description').first().text().trim();
		var ingredients = [];
		var steps = [];
		$('.o-Ingredients__a-Ingredient').each(function (i) {
			ingredients.push($(this).text().trim());
		});
		$('.o-Method__m-Step').each(function (i) {
			steps.push($(this).text().trim());
		});
	} catch (e) {
		console.log(e);
	}
	return [ title, desc, time, servings, image, ingredients, steps ];
};

scraperObj.seriouseats = async function (html) {
	try {
		var $ = cheerio.load(html);
		var title = $("[property = 'og:title']").attr('content');
		var desc = $("[property = 'og:description']").attr('content');
		var image = $("[property = 'og:image']").attr('content');
		var servings = $('.yield').text().split('Serves ')[1];
		var time = '';
		var ingredients = [];
		var steps = [];
		$('.ingredient').each(function (i) {
			if ($(this).text().trim() !== '') {
				ingredients.push($(this).text().trim());
			}
		});
		$('.recipe-procedure-text').each(function (i) {
			steps.push($(this).text().trim());
		});
	} catch (e) {
		console.log(e);
	}
	return [ title, desc, time, servings, image, ingredients, steps ];
};

scraperObj.thepioneerwoman = async function (html) {
	try {
		var $ = cheerio.load(html);
		var title = $("[property = 'og:title']").attr('content');
		var desc = $("[property = 'og:description']").attr('content');
		var image = $("[property = 'og:image']").attr('content');
		var servings = $('.recipe-summary-time dd').last().text().split(' Servings')[0];
		var time = 0;
		var cookTime = $("[itemprop = 'cookTime']").text().toLowerCase();
		var prepTime = $("[itemprop = 'prepTime']").text().toLowerCase();
		if (cookTime[cookTime.length - 1] === 'h') {
			time += Number(cookTime.match(/[0-9]+/g)) * 60;
		}
		else {
			time += Number(cookTime.match(/[0-9]+/g));
		}
		if (prepTime[prepTime.length - 1] === 'h') {
			time += Number(prepTime.match(/[0-9]+/g)) * 60;
		}
		else {
			time += Number(prepTime.match(/[0-9]+/g));
		}
		var ingredients = [];
		var steps = [];
		$("[itemprop = 'recipeIngredient']").each(function (i) {
			if ($(this).text().trim() !== '') {
				ingredients.push($(this).text().trim());
			}
		});
		$("[itemprop = 'recipeInstructions']").each(function (i) {
			var allSteps = $(this).text().split('\n');
			allSteps.forEach(function (step) {
				if (step !== '') {
					steps.push(step.trim());
				}
			});
		});
	} catch (e) {
		console.log(e);
	}
	return [ title, desc, time, servings, image, ingredients, steps ];
};

scraperObj.thespruceeats = async function (html) {
	try {
		var $ = cheerio.load(html);
		var title = $('.heading__title').text();
		var desc = $("[property = 'og:description']").attr('content');
		var image = $("[property = 'og:image']").attr('content');
		var servings = $('.meta-text__data').last().text();
		if (servings.includes('(')) {
			servings = servings.split('(')[1].split(' ')[0];
		}
		else {
			servings = servings.split(' ')[0];
		}
		var time = $('.meta-text__data').first().text().split(' ')[0];

		var ingredients = [];
		var steps = [];
		$('.ingredient').each(function (i) {
			ingredients.push($(this).text().trim());
		});
		$('.section--instructions p').remove('.recipe-search-suggestions__heading');
		$('.section--instructions p').each(function (i) {
			steps.push($(this).text().trim());
		});
	} catch (e) {
		console.log(e);
	}
	return [ title, desc, time, servings, image, ingredients, steps ];
};

// scraperObj.yummly = async function (html) {
// 	try {
// 		var $ = cheerio.load(html);
// 		var title = $('.recipe-title').text();
// 		var desc = $("[property = 'og:description']").attr('content');
// 		var image = $("[property = 'og:image']").attr('content');
// 		var servings = $('.servings input').attr('value');
// 		var time = $('.recipe-summary-item').find('.value').text();
// 		console.log(time);

// 		var ingredients = [];
// 		var steps = [];
// 		$('.IngredientLine').each(function (i) {
// 			ingredients.push($(this).text().trim());
// 		});
// 		$('.o-Method__m-Step').each(function (i) {
// 			steps.push($(this).text().trim());
// 		});
// 		console.log(ingredients);
// 		console.log(steps);
// 	} catch (e) {
// 		console.log(e);
// 	}
// 	return [ title, desc, time, servings, image, ingredients, steps ];
// };

module.exports = scraperObj;
