const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const tourController = require('../controllers/tourController');
const factoryFunction = require('../controllers/factoryFunctions');

// router.use(tourController.protect);

router.get('/api/v1/reviews/getAll', reviewController.getAllReviews);

router.get('/api/v1/reviews/:id', reviewController.getReviewById);

router.post(
	'/api/v1/tour/:tourId/reviews/add',
	tourController.protect,
	tourController.restrictUser('user'),
	reviewController.checkParametersForAddReview,
	reviewController.addNewReview
);

router.get('/api/v1/tour/:tourId/reviews', reviewController.getReviewByTour);

router.delete(
	'/api/v1/reviews/:id',
	tourController.protect,
	tourController.restrictUser('admin'),
	reviewController.deletReviewById
);

// review Update authentication remaining

router.patch(
	'/api/v1/reviews/:id',
	tourController.protect,
	tourController.restrictUser('admin'),
	reviewController.updateReview
);

module.exports = router;
