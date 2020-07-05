const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');

const usersSchema = mongoose.Schema({
	userName: {
		type: String,
		required: [ true, 'The username is a required field!' ],
		unique: true,
		minlength: [ 5, 'The minimum length of a username is 5' ],
		maxlength: [ 20, 'The maximum legth of a username is 20' ]
	},
	email: {
		type: String,
		required: [ true, 'The email is a required field!' ],
		unique: true,
		// the validate only works in case of User.create and User.save an does not work in update or findOneAndUpdate
		validate: {
			validator: validator.isEmail,
			message: 'The given value is not an email!'
		}
	},
	salt: String,
	role: {
		type: String,
		enum: [ 'user', 'guide', 'lead-guide', 'admin' ],
		default: 'user'
	},
	password: {
		type: String,
		required: [ true, 'The password is a required field' ],
		minlength: [ 8, 'The minimum length of a password must be 8' ]
		// maxlength: [ 40, 'The maximum length of a password can be not more than 40' ]
	},
	photo: {
		type: String,
		default: 'default.jpg'
	},
	passwordChangedAt: Date,
	passwordResetToken: String,
	passwordResetExpire: String
});

usersSchema.methods.changedPassword = function(JWTtimestamp) {
	// the method defined using the methods property becomes the global method which can be accessed on every document of the given collection
	if (this.passwordChangedAt) {
		const passwordChangedAt = parseInt(this.passwordChangedAt.getTime() / 1000); // here the getTime() function converts the date to milliseconds and then dividing it by 1000 gives seconds
		return JWTtimestamp < passwordChangedAt;
	}
	console.log('The user still does not has the passwordChanged  : ' + this.passwordChangedAt);
	return false;
};

usersSchema.methods.createForgotPasswordToken = function() {
	const resetValue = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto.createHash('sha256').update(resetValue).digest('hex');

	this.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000);

	return this.passwordResetToken;
};

const Users = mongoose.model('Users', usersSchema);

module.exports = Users;
