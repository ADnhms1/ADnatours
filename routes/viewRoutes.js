const express = require('express');
const router = express();
const viewController = require('../controllers/viewController');
const tourController = require('../controllers/tourController');
const userController = require('../controllers/userController');
const bookingController = require('../controllers/bookingController');

router.get('/', bookingController.createBookingCheckout, tourController.isLogged, viewController.getAllTourOverview);

router.get('/tours/:slug', tourController.isLogged, viewController.getTour);

router.get('/auth/login', tourController.isLogged, viewController.getLogin);

router.get('/auth/logout', viewController.getLogout);

router.get('/me', tourController.isLogged, viewController.getProfile);

router.post('/submit-user-data', tourController.protect, viewController.updateUserData);

router.get('/my-tours', tourController.isLogged, viewController.getMyTours);

// router.post('/update-user-password', tourController.protect, viewController.updatePassword);

module.exports = router;
