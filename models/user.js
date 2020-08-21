var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var bcrypt = require('bcrypt-nodejs');

var UserSchema = new mongoose.Schema({
	username: { type: String, unique: true, required: true },
	password: String,
	email: { type: String, unique: true, required: true },
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	tags: [ String ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
