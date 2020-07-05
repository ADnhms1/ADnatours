// external libraries
const axios = require('axios');
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const compression = require('compression'); // it is used to compress all text and json responses that server sends back (usually added before deployment)

// external security libraries

const rateLimiter = require('express-rate-limit');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoDataSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const httpParameterPolution = require('hpp');

// config files

dotenv.config({ path: './config.env' });

app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', 'views');

// database connection

let dbConnection = process.env.DATABASE;
dbConnection = dbConnection.replace('<username>', process.env.DATABASE_USER);
dbConnection = dbConnection.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose
	.connect(dbConnection, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false
	})
	.then((con) => {
		console.log('Connected!');
	});

// internal files
const errorHandler = require('./utils/appError');
const tourRoutes = require('./routes/tourRoutes');
const errorController = require('./controllers/errorController');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const viewRoutes = require('./routes/viewRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
var cors = require('cors');

// global middleware

app.use(compression());

app.use(cors()); // Use this after the variable declaration

// helmet middleware for setting http headers for security

app.use(helmet());

// simple version of body parser

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// sanitization of the data for removing any nosql/sql query injection attack

app.use(mongoDataSanitize());

// the xss-clean helps us to remove all potential html and javascript code attack which is added as input

app.use(xssClean());

// morgan middleware for identifing which req are made along with all other details in console

if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}
// creating and assiging rate limiter middleware

const limiter = rateLimiter({
	max: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many request from the same IP address, please try again after an hour.'
});

app.use('/api', limiter);

// handling http parameter pollution which remnoves duplicate parameter values ex : ?sort=name&sort=price

app.use(
	httpParameterPolution({
		whitelist: [ 'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price' ]
	})
);

// handling uncaughtException

process.on('uncaughtException', (err) => {
	console.log(`${err.name}, hint : some error might have occured in the source , ${err.stack}`);
	process.exit(1);
});

// using routes

// /api/v1/users/signin

app.use(tourRoutes);
app.use(reviewRoutes);
app.use(viewRoutes);
app.use(userRoutes);
app.use(bookingRoutes);

const userController = require('./controllers/userController');

app.get('/test', (req, res) => {
	const token = userController.makeToken('dsywdywdg', res);
	res.send(token);
});

// error handling for uncaught urls

app.all('*', (req, res, next) => {
	// creating error using class and handling it using the global err handling middleware
	const appError = new errorHandler('Failure', 404, `The path ${req.originalUrl} is not found in this server`);
	next(appError);
});

// global error handling middleware

app.use(errorController);

// starting server

const server = app.listen(2000, () => {
	console.log('listening!');
});

// handling unhandeledrejectection

process.on('unhandledRejection', (err, req, res) => {
	console.log(`${err.name},stack : ${err.stack}, hint : please check your credentials or the internet connection!`);
	console.log('Closing the application!');
	server.close(() => {
		process.exit(1); // here parameter 1 refers unhandeldrejection and 0 refers success and close
	});
});
