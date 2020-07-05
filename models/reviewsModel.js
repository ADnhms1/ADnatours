const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
	{
		review: {
			type: String,
			required: [ true, 'The review string is a crucial part and is needed to create a review.' ]
		},
		rating: {
			type: Number,
			min: 1,
			max: 5
		},
		createdAt: {
			type: Date,
			default: Date.now()
		},
		Tour: {
			type: mongoose.Schema.ObjectId,
			ref: 'Tours',
			required: [ true, 'The tour field is mendatory to create a tour' ]
		},
		User: {
			type: mongoose.Schema.ObjectId,
			ref: 'Users',
			required: [ true, 'The user field is mendatory to create a review' ]
		}
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

reviewSchema.index({ Tour: 1, User: 1 }, { unique: true }); // here this will make the tour and user field combo to be unique

const Reviews = mongoose.model('Reviews', reviewSchema);

module.exports = Reviews;
