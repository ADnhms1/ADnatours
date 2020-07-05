const Tour = require('../models/tourModel');
const Reviews = require('../models/reviewsModel');
const ConstVar = require('../utils/ConstVar');
const { isLogged } = require('./tourController');
const appError = require('../utils/appError');
const User = require('../models/usersModel');
const { default: validator } = require('validator');
const axios = require('axios');
const Booking = require('../models/bookingModel');

exports.getAllTourOverview = async (req, res) => {
	const allTourData = await Tour.find();
	var loggedInUser = req.loggedInUser;
	console.log('From getAllTourOverview ' + loggedInUser);
	res.status(200).render('overview', {
		data: allTourData,
		title: 'All Tours',
		loggedInUser
	});
};

exports.getTour = async (req, res, next) => {
	const data = await Tour.findOne({ slug: req.params.slug }).populate('guides'); // restricting guide data and removing username password details still left

	if (!data) {
		return next(new appError('Failure', 404, 'Tour not found!'));
	}

	const reviews = await Reviews.find({ Tour: data._id }).populate('User');
	var loggedInUser = req.loggedInUser;
	console.log('From getTour ' + loggedInUser);
	res.status(200).render('tour', { data, reviews, title: data.name, loggedInUser });
};

exports.getLogin = (req, res) => {
	var loggedInUser = req.loggedInUser;
	console.log('From getLogin ' + loggedInUser);
	if (!loggedInUser) {
		res.status(200).render('login', { title: 'Login', loggedInUser });
	} else {
		res.redirect('/');
	}
};

exports.getLogout = (req, res) => {
	if (req.headers.cookie) {
		console.log(req.headers.cookie);
		req.headers.cookie = null;
		res.clearCookie('token');
		res.redirect('/auth/login');
	}
};

exports.getProfile = (req, res) => {
	var loggedInUser = req.loggedInUser;
	console.log('From getProfile ' + loggedInUser);
	if (loggedInUser) {
		res.status(200).render('profile', { title: 'Login', loggedInUser });
	} else {
		res.redirect('/');
	}
};

exports.updateUserData = async (req, res, next) => {
	// external image upload is remaining
	if (!validator.isEmail(req.body.email)) {
		return next(new appError('Failure', '401', 'Invalid Email Format!'));
	}
	console.log(
		'Current user ' + req.user + ' body' + req.body.userName + ' : ' + req.body.email + ' : ' + req.body.photo
	);
	const user = await User.findByIdAndUpdate(
		req.user.id,
		{
			userName: req.body.userName,
			email: req.body.email,
			photo: req.body.photo ? req.body.photo : req.user.photo
		},
		{
			new: true,
			runValidators: true
		}
	);
	console.log('Updated user : ' + user.userName + user.email);
	// res.status(200).render('profile', { title: 'Login', loggedInUser: user });
	res.redirect('/me');
};

exports.getMyTours = async (req, res, next) => {
	// console.log(req.isLogged)
	// 1) Find all bookings
	const bookings = await Booking.find({ user: req.loggedInUser.id });

	// 2) Find tours with the returned IDs
	const tourIDs = bookings.map((el) => el.tour);
	const tours = await Tour.find({ _id: { $in: tourIDs } });

	var loggedInUser = req.loggedInUser;
	console.log('From getMyTours ' + loggedInUser);

	res.status(200).render('overview', {
		title: 'My Tours',
		data: tours,
		loggedInUser
	});
};

// exports.updatePassword = async (req, res, next) => {					// update password is remaining
// 	console.log('From updatepassword : ' + req.user);
// 	console.log(
// 		'update password : ' + req.body.currentPass + ' : ' + req.body.newPassword + ' : ' + req.body.confirmPassword
// 	);
// 	const currentPass = req.body.currentPass;
// 	const newPassword = req.body.newPassword;
// 	const confirmPassword = req.body.confirmPassword;
// 	if (newPassword !== confirmPassword) {
// 		return next(new appError('Failure', 401, 'Invalid Details, password does not match!'));
// 	}

// 	const rs = await axios({
// 		method: 'PATCH',
// 		url: 'http://127.0.0.1:2000/api/v1/users/updateUserPassword',
// 		data: {
// 			currentPass,
// 			updatePass: confirmPassword,
// 			user: req.user
// 		}
// 	});

// 	console.log('Current cookie : ' + req.headers.cookie);
// 	req.headers.cookie = `token=${rs.data.token}`;
// 	console.log('Updated cookie : ' + req.headers.cookie);
// };
