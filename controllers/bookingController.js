const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // this requires a private key which is in the dashboard of stripe
const Tour = require('../models/tourModel');
const User = require('../models/usersModel');
const appError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const factoryFunctions = require('./factoryFunctions');
const Booking = require('../models/bookingModel');

exports.getCheckoutSession = async (req, res, next) => {
	// 1) get tour data
	const tourData = await Tour.findById(req.params.tourId);

	// 2) create checkout session

	const session = await stripe.checkout.sessions.create({
		// session information
		payment_method_types: [ 'card' ],
		success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user
			.id}&price=${tourData.price}`,
		cancel_url: `${req.protocol}://${req.get('host')}/tours/${tourData.slug}`,
		customer_email: req.user.email,
		client_reference_id: req.params.tourId,
		// product information
		line_items: [
			{
				name: `${tourData.name} Tour`,
				description: tourData.summary,
				images: [ `https://www.natours.dev/img/tours/${tourData.imageCover}` ],
				amount: tourData.price * 100,
				currency: 'usd',
				quantity: 1
			}
		]
	});

	// send the session

	res.status(200).json({
		status: 'success',
		session
	});
};

exports.createBookingCheckout = async (req, res, next) => {
	console.log('In createBookingCheckout start!');
	const { tour, user, price } = req.query;
	if (!tour && !user && !price) return next();

	await Booking.create({ tour, user, price });
	console.log('In createBookingCheckout End!');
	res.redirect('/');
};

exports.getAllBookings = async (req, res, next) => {
	const allBookings = await Booking.find();
	res.status(200).json({
		status: 'Success',
		data: allBookings
	});
};
