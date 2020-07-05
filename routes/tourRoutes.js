const express = require('express');

const router = express.Router();

const tourController = require('../controllers/tourController');

const checkProdAvailability = tourController.checkAvail;

router.get('/api/v1/tours/top-5-best', tourController.top5best, tourController.getAllTours);

router.get(
	'/api/v1/tours/stats',
	tourController.protect,
	tourController.restrictUser('admin', 'lead-guide', 'guide'),
	tourController.protect,
	tourController.aggregateStats
);

router.get(
	'/api/v1/tours/mounthly-plans/:year',
	tourController.protect,
	tourController.restrictUser('admin', 'guide', 'lead-guide'),
	tourController.monthlyPlans
);

router.get('/api/v1/tours', tourController.getAllTours);

router.post('/api/v1/tours', tourController.addNewTour);

router.get('/api/v1/tours/:id', tourController.getTourById);

router.patch(
	'/api/v1/tours/:id',
	tourController.protect,
	tourController.restrictUser('admin', 'lead-guide'),
	checkProdAvailability,
	tourController.uploadTourImages,
	tourController.resizeTourImages,
	tourController.updateTour
);

router.delete(
	'/api/v1/tours/:id',
	tourController.protect,
	tourController.restrictUser('admin', 'lead-guide'),
	checkProdAvailability,
	tourController.deleteTour
);

router.get('/api/v1/tours-distance/:distance/center/:latlong/unit/:unit', tourController.getTourWithIn);

module.exports = router;
