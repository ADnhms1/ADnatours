const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
	tour: {
		type: mongoose.Schema.ObjectId,
		ref: 'Tours',
		required: [ true, 'A booking must have a tour.' ]
	},
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'Users',
		required: [ true, 'A booking must have a user.' ]
	},
	price: {
		type: Number,
		required: [ true, 'A booking must have a price' ]
	},
	createdAt: {
		type: Date,
		default: Date.now()
	},
	paid: {
		type: Boolean,
		default: true
	}
});

bookingSchema.pre('find', function(next) {
	this.populate('user').populate({
		path: 'tour',
		select: 'name'
	});
	this.populate('tour');
	next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
