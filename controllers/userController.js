const Users = require('../models/usersModel');
const crypto = require('crypto');
const util = require('util');
const scrypt = util.promisify(crypto.scrypt);
const jwt = require('jsonwebtoken');
const appError = require('../utils/appError');
var cookie = require('cookie');
const constVar = require('../utils/ConstVar');
const Email = require('../utils/email');
const sharp = require('sharp');
const multer = require('multer'); // step1 get multer object (image upload)

// const multerStorage = multer.diskStorage({
// 	// step 2 create a multer storage which specifies the destination and file name format, here file parameter comes from the req.file where the uploaded file is added by multer middleware
// 	destination: (req, file, cb) => {
// 		cb(null, 'public/img/users');
// 	},
// 	filename: (req, file, cb) => {
// 		const ext = file.mimetype.split('/')[1];
// 		cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
// 	}
// });

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

exports.uploadImage = upload.single('photo'); //step 5 export the middleware such that it can be used in the routes file as middleware

exports.resizeUserPhoto = async (req, res, next) => {
	// step 6 here we craete a middleware for processing the image and converting it to 500,500 size, adding name format, assigning jpeg extention, formating to jpeg
	console.log('new File ' + req.file);
	if (!req.file) return next(); // if there is no file then simply next.

	req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

	await sharp(req.file.buffer)
		.resize(500, 500)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/users/${req.file.filename}`); // this stores the file to the given format, here it no longer will upload the image to the disk but will store it into buffer and then will go into resizeUserPhoto middleware and will format the image and then will finnaly add to the disk

	next();
};

exports.userSignUp = async (req, res, next) => {
	try {
		if (req.body.password != req.body.passwordConfirm) {
			throw new Error('Password do not match');
		}
		req.body.password = await encrptPassword(req.body.password);
		const [ , salt ] = req.body.password.split('.');
		req.body.salt = salt;
		const newUser = await Users.create(req.body);

		const url = `${req.protocol}://${req.get('host')}/me`;
		console.log(url);
		await new Email(newUser, url).sendWelcome();

		console.log('mail sent!');
		// creating jwt for authentication
		const token = makeToken(newUser._id, res);

		res.status(201).json({
			status: 'Success!',
			token,
			data: newUser
		});
	} catch (err) {
		next(err);
	}
};

exports.userSignIn = async (req, res, next) => {
	try {
		console.log('User send cookie : ' + req.cookies.jwt);
		console.log('getting data' + req.body);
		let user = await Users.find({ userName: req.body.userName });
		console.log(user);
		if (user.length == 1) {
			const rs = await checkPassword(req.body.password, user[0].salt, user[0].password);
			console.log('rs : ' + rs);
			if (rs) {
				// authenticating and creating jwt
				const token = makeToken(user[0]._id, res);
				console.log('this is the Token : ' + token);
				req.user = user[0];
				return res.status(200).json({
					status: 'Success',
					token
				});
			} else {
				next(new appError('Failure', 401, 'Invalid username of password'));
			}
		} else {
			next(new appError('Failure', 401, 'Invalid username of password'));
		}
	} catch (err) {
		next(err);
	}
};

exports.forgotPassword = async (req, res, next) => {
	// console.log(req.body.email);
	let user;
	try {
		user = await Users.findOne({ email: req.body.email });
		if (!user) {
			return next(new appError('Invalid email', 403, 'No user found with the given email.'));
		}
		const token = user.createForgotPasswordToken();
		await user.save({ validateBeforeSave: false });
		const resetLink = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${token}`;
		// const options = {
		// 	to: user.email,
		// 	subject: 'Password reset token (valid for next 10 mins)',
		// 	message: `Hello greeting from natours! hope you are doing good, natours just found a request from your account asking for a forgot password, the given is a link that allows you to reset your password ${resetLink}\nIn case if you did not make the request please ignore the email!`
		// };
		// await sendEmail(options);
		await new Email(user, resetLink).sendResetPassword();
		res.status(200).json({
			status: 'success',
			message: 'reset token send!'
		});
	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpire = undefined;
		await user.save({ validateBeforeSave: false });
		res.status(500).json({
			status: 'system failure',
			message: 'something went wrong try again later.',
			err: err
		});
	}
};

exports.getMyData = async (req, res, next) => {
	const currentUserRecord = await Users.findById(req.user.id);
	res.status(200).json({
		status: 'Success',
		data: currentUserRecord
	});
};

exports.updateMe = async (req, res, next) => {
	try {
		// check if the password is not added in the body to update
		if (req.body.password) {
			return next(new appError('Invalid insertion', 400, 'You can not update password details in here.'));
		}
		// filter out unwanted field names
		const filteredBody = filterUpdateFields(req.body, 'userName', 'email');

		if (req.file) filteredBody.photo = req.file.filename; // cheching if there is a file in req which means image was added then we set filteredBody with an image in its photo object which will add image name to the database(we only add image names to the database that will get the image then from public/img folders)

		console.log(filteredBody);

		// update data
		const updated = await Users.findByIdAndUpdate(req.user.id, filteredBody, {
			new: true,
			runValidators: true
		});

		res.status(200).json({
			status: 'Success',
			message: `The details where successfully updated ${updated}`
		});
	} catch (err) {
		next(new appError('Error', 500, 'Something went really wrong. ' + err));
	}
};

exports.updateUserPassword = async (req, res, next) => {
	try {
		const rs = await checkPassword(req.body.currentPass, req.user.salt, req.user.password);
		if (!rs) {
			return next(
				new appError('Invalid password', 403, 'The password given does not match the current user password.')
			);
		}
		const user = await Users.findOne({ _id: req.user._id });
		const newHashedPassword = await encrptPassword(req.body.updatePass);
		const [ , salt ] = newHashedPassword.split('.');
		user.salt = salt;
		user.password = newHashedPassword;
		await user.save();
		const token = makeToken(user._id, res);
		res.status(200).json({
			status: 'Success',
			message: 'The password was successfully updated!',
			token
		});
	} catch (err) {
		res.status(500).json({
			status: 'Failure',
			message: 'Something went really wrong.',
			err
		});
	}
};

exports.resetPassword = async (req, res, next) => {
	try {
		const forgotPasswordUser = await Users.findOne({
			passwordResetToken: req.params.token
		});
		let tokenExpireTime = new Date(forgotPasswordUser.passwordResetExpire).getTime();
		const currentTime = Date.now();
		console.log(`Current time : ${currentTime} , tokenExpiretime : ${tokenExpireTime}`);
		console.log(`diff : ${tokenExpireTime - currentTime}`);
		if (tokenExpireTime < currentTime) {
			return next(
				new appError('Token expired', 403, 'The password change token has been expired please try again.')
			);
		}

		console.log(`encrypting password`);

		// encrypting new password
		let encrptedPassword = await encrptPassword(req.body.password);
		const [ , salt ] = encrptedPassword.split('.');

		console.log(`encrypted pass : ${encrptPassword} salt ${salt}`);

		// reseting values
		forgotPasswordUser.password = encrptedPassword;
		forgotPasswordUser.salt = salt;
		forgotPasswordUser.passwordResetExpire = undefined;
		forgotPasswordUser.passwordResetToken = undefined;

		forgotPasswordUser.save();

		const token = makeToken(forgotPasswordUser._id, res);

		res.status(200).json({
			status: 'Success',
			token
		});
	} catch (err) {
		res.status(500).json({
			status: 'Failure',
			message: err.stack
		});
	}
};

const encrptPassword = async (password) => {
	const salt = crypto.randomBytes(8).toString('hex');
	let hashedPassword = await scrypt(password, salt, 64);
	hashedPassword = `${hashedPassword.toString('hex')}.${salt}`;
	return hashedPassword;
};

const makeToken = (id, res) => {
	const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN
	});
	const cookieOptions = {
		expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
		httpOnly: false
	};
	if (process.env.NODE_ENV === 'production') cookieOptions.secure = false;
	try {
		console.log('in try');
		res.cookie('jwt', token, cookieOptions);
	} catch (error) {
		console.log(error.Error);
	}
	return token;
};

// exports.makeToken = (id, res) => {
// 	const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
// 		expiresIn: process.env.JWT_EXPIRES_IN
// 	});
// 	const cookieOptions = {
// 		expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
// 		httpOnly: true
// 	};
// 	if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
// 	res.cookie('jwt', token, cookieOptions);
// 	return token;
// };

const checkPassword = async (password, salt, hashedPassword) => {
	let hashPassword = await scrypt(password, salt, 64);
	hashPassword = `${hashPassword.toString('hex')}.${salt}`;
	console.log(
		'Stored pass : ' +
			hashedPassword +
			' newFormed : ' +
			hashPassword +
			' salt : ' +
			salt +
			' password : ' +
			password
	);
	if (hashPassword === hashedPassword) {
		return true;
	} else {
		return false;
	}
};

const filterUpdateFields = (updateObj, ...allowedFields) => {
	const newObject = {};
	Object.keys(updateObj).forEach((each) => {
		if (allowedFields.includes(each)) {
			newObject[each] = updateObj[each];
		}
	});
	return newObject;
};
