const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const Reviews = require('./reviewsModel');

// making schema

const tourSchema = mongoose.Schema(
	{
		name: {
			type: String,
			required: [ true, 'A tour must have a name' ],
			unique: true,
			minlength: [ 10, 'minimum length of the name has to be 10' ],
			maxlength: [ 50, 'maximum length of the name is 50' ]
			// validate: [ validator.isAlpha, 'The name must be string' ]
		},
		price: {
			type: Number,
			required: [ true, 'A tour must have a price' ]
		},
		duration: {
			type: Number,
			required: [ true, 'A tour must have a duration' ]
		},
		maxGroupSize: {
			type: Number,
			required: [ true, 'A tour must have a size' ]
		},
		difficulty: {
			type: String,
			required: [ true, 'A tour must have a difficulty level' ],
			enum: {
				values: [ 'easy', 'medium', 'difficult' ],
				message: 'The values for difficulty can be either easy, medium or difficult only'
			}
		},
		ratingsQuantity: {
			type: Number,
			default: 0
		},
		ratingsAverage: {
			type: Number,
			default: 4.5,
			min: [ 1, 'rating has to be more than 1' ],
			max: [ 5, 'rating can not be more than 5' ],
			set: (val) => Math.round(val * 10) / 10 // the setters function which runs each time when new value is added
		},
		priceDiscount: {
			type: Number,
			validate: {
				validator: function(val) {
					return val < this.price; // if it returns true it means validation is success and if returns false means validation is failed.
				},
				message: 'The discount price must be less than the actual price'
			}
		},
		summary: {
			type: String,
			trim: true,
			required: [ true, 'A tour must have a summary' ]
		},
		description: {
			type: String,
			trim: true
		},
		imageCover: {
			type: String,
			required: [ true, 'A tour must have a cover image' ]
		},
		images: [ String ],
		createdDate: {
			type: Date,
			default: Date.now()
		},
		startDates: [ Date ],
		slug: String,
		secretTour: {
			type: Boolean,
			default: false
		},
		startLocation: {
			type: {
				type: String,
				default: 'Point',
				enum: 'Point'
			},
			coordinates: [ Number ],
			description: String,
			day: Number
		},
		locations: [
			{
				type: {
					type: String,
					default: 'Point',
					enum: 'Point'
				},
				coordinates: [ Number ],
				description: String,
				day: Number
			}
		],
		guides: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'Users'
			}
		]
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

// virtual columns

tourSchema.virtual('durationInWeek').get(function() {
	return this.duration / 7;
});

// virtual populate

tourSchema.virtual('reviews', {
	ref: 'Reviews',
	foreignField: 'Tour',
	localField: '_id'
});

// indexing is used to increase the efficiency of the data search

tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound index it is the one which works in the combination of more than one field

tourSchema.index({ slug: 1 });

// document middlewares

tourSchema.pre('save', function(next) {
	// defines the document pre middleware
	this.slug = slugify(this.name, { lower: true });
	next();
});

tourSchema.post('save', function(doc, next) {
	// defines the on document post middleware
	console.log(doc);
	next();
});

tourSchema.pre('find', function(next) {
	// this is hiding the secret tours from find query middleware
	this.find({ secretTour: { $ne: true } });
	next();
});

tourSchema.pre('findOne', function(next) {
	// this is hiding the secret tours from findById query middleware
	this.find({ secretTour: { $ne: true } });
	next();
});

// making models

const Tours = mongoose.model('Tours', tourSchema);

module.exports = Tours;
