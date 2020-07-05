module.exports = (err, req, res, next) => {
	err.status = err.status || 'error';
	err.statusCode = err.statusCode || 500;

	if (process.env.NODE_ENV == 'development') {
		console.log(req.originalUrl);
		if (req.originalUrl.startsWith('/api')) {
			res.status(err.statusCode).json({
				status: err.status,
				message: err.message,
				err: err,
				stack: err.stack
			});
		} else {
			const loggedInUser = req.loggedInUser;
			res.status(err.statusCode).render('errorPage', {
				title: 'Something went wrong!',
				msg: err.message,
				loggedInUser
			});
		}
	} else if (process.env.NODE_ENV == 'production') {
		if (req.originalUrl.startsWith('/api')) {
			if (err.name == 'MongoError') {
				return res.status(err.statusCode).json({
					status: err.status,
					message: 'The name of each tour must be unique!'
				});
			} else if (err.name == 'CastError') {
				return res.status(err.statusCode).json({
					status: err.status,
					message: `The given id ${err.stringValue} is invalid and cannot be casted!`
				});
			} else if (err.name == 'ValidationError') {
				return res.status(err.statusCode).json({
					status: err.status,
					message: `${err.message}`
				});
			} else if (err.name == 'TokenExpiredError') {
				return res.status(401).json({
					status: 'Failure',
					message: 'The token has been expired, please login.'
				});
			} else if (err.name == 'JsonWebTokenError') {
				return res.status(401).json({
					status: 'Failure',
					message: 'The token is invalid, please login.'
				});
			}
			res.status(err.statusCode).json({
				status: err.status + ' statusssssss',
				message: err.message
			});
		} else {
			if (err.name == 'MongoError') {
				const loggedInUser = req.loggedInUser;
				return res.status(err.statusCode).render('errorPage', {
					title: 'Something went wrong!',
					msg: 'The name of each tour must be unique!',
					loggedInUser
				});
			} else if (err.name == 'CastError') {
				const loggedInUser = req.loggedInUser;
				return res.status(err.statusCode).render('errorPage', {
					title: 'Something went wrong!',
					msg: `The given id ${err.stringValue} is invalid and cannot be casted!`,
					loggedInUser
				});
			} else if (err.name == 'ValidationError') {
				const loggedInUser = req.loggedInUser;
				return res.status(err.statusCode).render('errorPage', {
					title: 'Something went wrong!',
					msg: `${err.message}`,
					loggedInUser
				});
			} else if (err.name == 'TokenExpiredError') {
				const loggedInUser = req.loggedInUser;
				return res.status(401).render('errorPage', {
					title: 'Something went wrong!',
					msg: 'The token has been expired, please login.',
					loggedInUser
				});
			} else if (err.name == 'JsonWebTokenError') {
				const loggedInUser = req.loggedInUser;
				return res.status(401).render('errorPage', {
					title: 'Something went wrong!',
					msg: 'The token is invalid, please login.',
					loggedInUser
				});
			}
			const loggedInUser = req.loggedInUser;
			return res.status(err.statusCode).render('errorPage', {
				title: 'Something went wrong!',
				msg: err.message,
				loggedInUser
			});
		}
	}

	next();
};
