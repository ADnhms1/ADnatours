const { promisify } = require('util');
const fs = require('fs');
const Tour = require('../models/tourModel');
const User = require('../models/usersModel');
const appError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const factoryFunctions = require('./factoryFunctions');

let toursData = fs.readFileSync('./data/tours-simple.json');
toursData = JSON.parse(toursData);

const sharp = require('sharp');
const multer = require('multer'); // step1 get multer object (image upload)
const { Promise } = require('mongoose');

const multerStorage = multer.memoryStorage(); // step 2 here we define multer to store the image in the buffer and not directly into the disk

const multerFilter = (req, file, cb) => {
	// step 3 create a multer filter which filters out other not required files and sends an error if any other file is uploaded other then given type
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new appError('Failure', 400, 'Please upload an image!'), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter
}); // step4 assign multerStrorage and multerFilter to multer parameter and create an upload object which is used by the middleware

exports.uploadTourImages = upload.fields([
	{
		name: 'imageCover',
		maxCount: 1
	},
	{
		name: 'images',
		maxCount: 3
	}
]);

exports.resizeTourImages = async (req, res, next) => {
	console.log(req.files);
	if (!req.files.imageCover || !req.files.images) {
		return next();
	}

	req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

	await sharp(req.files.imageCover[0].buffer)
		.resize(2000, 1333)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/tours/${req.body.imageCover}`); // this stores the file to the given format, here it no longer will upload the image to the disk but will store it into buffer and then will go into resizeUserPhoto middleware and will format the image and then will finnaly add to the disk

	console.log('added! ' + req.body.imageCover);

	req.body.images = []; // we store this in the body.images because the update function accepts it which will update the body data to the tour

	await Promise.all(
		req.files.images.map(async (file, i) => {
			const filename = `tour-${req.params.id}-${Date.now()}-${i}.jpeg`;
			await sharp(file.buffer) // as we use map this will return a 3 promises for 3 images thus we wrap it with Promise.all() that will collect all promises and will await all together.
				.resize(2000, 1333)
				.toFormat('jpeg')
				.jpeg({ quality: 90 })
				.toFile(`public/img/tours/${filename}`);
			req.body.images.push(filename);
		})
	);

	console.log('added! ' + req.body.images);
	next();
};

exports.checkAvail = (req, res, next) => {
	console.log('From checkAvail');
	if (req.params.id > toursData.length - 1) {
		return res.status(404).send('Not found!');
	} else {
		next();
	}
};

exports.getAllTours = async (req, res) => {
	let query = { ...req.query };
	const excludingList = [ 'sort', 'page', 'fields', 'limit' ];

	// deleting not required search parameters

	excludingList.forEach((el) => {
		delete query[el];
	});

	// converting the lt,lte,gt,gte to $gt,$gte,$lt,$lte

	let objString = JSON.stringify(query);
	objString = objString.replace('"gt"', '"$gt"');
	objString = objString.replace('"gte"', '"$gte"');
	objString = objString.replace('"lt"', '"$lt"');
	objString = objString.replace('"lte"', '"$lte"');
	query = JSON.parse(objString);

	console.log(objString);

	//executing find

	try {
		console.log('From getAllTours');
		// making query
		let queryString = Tour.find(query); // here we have not executed the Tour.find() method yet because we have to apply sort pageination etc

		// sort operation

		if (req.query.sort) {
			const sortBy = req.query.sort.split(',').join(' '); // removing , and adding space beacuse we can sort multiple columns and in url it has to be , and here we need a space
			queryString = queryString.sort(sortBy);
		} else {
			queryString = queryString.sort('-createdDate'); // default sort is by create date of the tour
		}

		// limiting fields

		if (req.query.fields) {
			let columns = req.query.fields;
			columns = columns.split(',').join(' ');
			queryString = queryString.select(columns);
		}

		// // pagination

		let limit = req.query.limit * 1 || 100; // it specifies the maximum record on each page
		let page = req.query.page * 1 || 1; // it specifies the page to be displayed
		let skip = (page - 1) * limit; // it specifies the records to be skipped depending on the page requested

		if (req.query.page) {
			const totalDocuments = await Tour.countDocuments();
			if (skip >= totalDocuments) {
				return res.status(400).json({
					status: 'failure',
					message: 'not enough data for given page'
				});
			}
		}

		queryString = queryString.limit(limit).skip(skip);

		//finally execiuting query
		const allTours = await queryString; // finally we execute the Tour.find with all given extention of sort and pagination
		res.status(200).json({
			status: 'success',
			data: {
				tours: allTours
			}
		});
	} catch (err) {
		res.status(404).json({
			status: 'failure',
			message: err
		});
	}
};

exports.addNewTour = factoryFunctions.createRecord(Tour);

exports.getTourById = async (req, res, next) => {
	try {
		console.log('from get A Data');
		const tourRecord = await Tour.findById(req.params.id)
			.populate({
				path: 'guides',
				select: '-__v'
			})
			.populate('reviews');
		if (!tourRecord) {
			const err = new appError('fail', 400, `Record with id ${req.params.id} not found`);
			return next(err);
		}
		res.send({
			status: 'success',
			data: {
				tours: tourRecord
			}
		});
	} catch (err) {
		next(err);
	}
};

exports.updateTour = factoryFunctions.updateRecord(Tour);

exports.deleteTour = factoryFunctions.deleteRecord(Tour);

exports.checkTourBody = (req, res, next) => {
	if (!req.body.name || !req.body.price) {
		return res.status(400).json({
			status: 'Bad request',
			response: 'Incomplete data'
		});
	}
	next();
};

exports.top5best = (req, res, next) => {
	req.query.sort = '-ratingsAverage price';
	req.query.limit = 5;
	console.log(req.query);
	next();
};

exports.aggregateStats = async (req, res) => {
	try {
		const stats = await Tour.aggregate([
			{
				$match: {
					ratingsAverage: { $gte: 4.5 }
				}
			},
			{
				$group: {
					_id: '$difficulty',
					countOfDocuments: { $sum: 1 },
					maxPrice: { $max: '$price' },
					minPrice: { $min: '$price' },
					avgRatings: { $avg: '$ratingsAverage' },
					countOfRatings: { $sum: '$ratingsQuantity' }
				}
			},
			{
				$sort: {
					difficulty: 1
				}
			}
		]);

		res.status(200).json({
			status: 'success',
			data: stats
		});
	} catch (err) {
		res.status(400).json({
			status: 'Failure',
			message: err
		});
	}
};

exports.monthlyPlans = async (req, res) => {
	//this is used to get the bussiest months where it find the months and the number of tours in each of them
	try {
		const year = req.params.year;
		console.log(year);
		const plan = await Tour.aggregate([
			{
				$unwind: '$startDates' // it create a sperate record for each document,for each document which has an array of element
			},
			{
				$match: {
					// finds records matching the condition
					startDates: {
						$gte: new Date(`${year}-01-01`),
						$lte: new Date(`${year}-12-31`)
					}
				}
			},
			{
				$group: {
					// uses group by to get the result
					_id: { $month: '$startDates' },
					countOfTours: { $sum: 1 } // adds one each time , as it works as a loop
				}
			},
			{
				$addFields: { month: '$_id' } // adds a new field where we can get the value from an existing field
			},
			{
				$project: {
					_id: 0 // project helps us to specify the columns and 0 and 1 helps us to make sure to show or remove the column
				}
			}
		]);
		res.status(200).json({
			status: 'Success',
			data: plan
		});
	} catch (err) {
		res.status(400).json({
			status: 'Failure',
			message: err
		});
	}
};

// /api/v1/tours-distance/:distance/center/:latlang/unit/:unit

exports.getTourWithIn = async (req, res, next) => {
	try {
		const { distance, latlong, unit } = req.params;
		const lat = latlong.split(',')[0];
		const long = latlong.split(',')[1];
		const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
		if (!lat || !long) {
			return next(new appError('Invalid request', 400, 'PLease provide latitude longitude details as lat,long'));
		}
		const allTours = await Tour.find({
			startLocation: { $geoWithin: { $centerSphere: [ [ long, lat ], radius ] } }
		});
		res.status(200).json({
			status: 'Success',
			data: {
				data: allTours
			}
		});
	} catch (err) {
		res.status(500).json({
			status: 'Error',
			err: err
		});
	}
};

exports.protect = async (req, res, next) => {
	// it is to check if the user is logged in
	let token, rs;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	} else if (req.cookies.jwt) {
		token = req.cookies.jwt;
	} else if (req.headers.cookie) {
		token = req.headers.cookie.split('=')[1];
	}
	try {
		rs = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
	} catch (err) {
		console.log('In err' + err + ' token : ' + token + ' headers : ' + req.headers.cookie);
		return next(err); // if the user is not login
	}
	// it checks if the users is been deleted , if deleted freshUser which gets the data will be null
	const freshUser = await User.findOne({ _id: rs.id });
	if (freshUser == null) {
		next(new appError('Invalid user', 401, 'The user belonging to the token no longer exists.'));
	}
	// this checks if the password has been changed if changed the global method defined in the schema will return true
	const isPasswordChanged = freshUser.changedPassword(rs.iat);
	console.log(isPasswordChanged);
	if (isPasswordChanged) {
		console.log(fr);
		next(new appError('Invalid user', 401, 'Invalid credentials, please try login again.'));
	}
	// finally grant access to the protected route
	req.user = freshUser;
	console.log('Protect satified!');
	next();
};

exports.isLogged = async (req, res, next) => {
	// it is to check if the user is logged in
	console.log(req.headers.cookie + ' from isLogged');
	if (req.headers.cookie) {
		token = req.headers.cookie.split('=')[1];
		try {
			rs = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
		} catch (err) {
			return next(); // if the user is not login
		}
		// it checks if the users is been deleted , if deleted freshUser which gets the data will be null
		const freshUser = await User.findOne({ _id: rs.id });
		if (freshUser == null) {
			return next();
		}
		// this checks if the password has been changed if changed the global method defined in the schema will return true
		const isPasswordChanged = freshUser.changedPassword(rs.iat);
		console.log(isPasswordChanged);
		if (isPasswordChanged) {
			console.log(fr);
			return next();
		}
		// finally grant access to the protected route
		req.loggedInUser = freshUser;
		console.log('AD the user is added!');
		return next();
	}
	console.log('AD the user was not found in the isLogged!');
	next();
};

exports.restrictUser = (...users) => {
	return (req, res, next) => {
		console.log(`role : ${req.user}`);
		if (!users.includes(req.user.role)) {
			return next(new appError('Invalid access', 403, 'You do not have the rights to perform the action.'));
		}
		next();
	};
};
