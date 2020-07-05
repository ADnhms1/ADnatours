const express = require('express');
const router = express();
const tourController = require('../controllers/tourController');
const bookingController = require('../controllers/bookingController');

router.get('/api/v1/bookings/booking-session/:tourId', tourController.protect, bookingController.getCheckoutSession);

router.get(
	'/api/v1/bookings/getAllBookings',
	tourController.protect,
	tourController.restrictUser('admin', 'lead-guide'),
	bookingController.getAllBookings
);

module.exports = router;
