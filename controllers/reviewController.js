const Reviews = require('../models/reviewsModel');
const Tour = require('../models/tourModel');
const appError = require('../utils/appError');
const factoryFunction = require('./factoryFunctions');

exports.getAllReviews = async (req, res, next) => {
	try {
		const reviewsData = await Reviews.find().populate({ path: 'User', select: 'email userName photo' });

		res.status(200).json({
			status: 'Success',
			data: reviewsData
		});
	} catch (err) {
		res.status(500).json({
			status: 'Failure',
			message: err.stack
		});
	}
};

exports.checkParametersForAddReview = (req, res, next) => {
	if (!req.body.Tour) req.body.Tour = req.params.tourId;
	if (!req.body.User) req.body.User = req.user.id;
	next();
};

exports.addNewReview = factoryFunction.createRecord(Reviews);

exports.getReviewById = async (req, res, next) => {
	try {
		const review = await Reviews.findById(req.params.id);
		res.status(200).json({
			status: 'Success',
			data: review
		});
	} catch (err) {
		res.status(500).json({
			status: 'Failure',
			message: err
		});
	}
};

exports.getReviewByTour = async (req, res, next) => {
	try {
		const tourReviews = await Reviews.find({ Tour: req.params.tourId });
		res.status(200).json({
			status: 'Success',
			data: tourReviews
		});
	} catch (err) {
		res.status(500).json({
			status: 'Failure',
			message: err
		});
	}
};

exports.updateReview = factoryFunction.updateRecord(Reviews);

exports.deletReviewById = factoryFunction.deleteRecord(Reviews);
