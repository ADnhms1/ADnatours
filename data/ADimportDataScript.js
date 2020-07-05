const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../models/tourModel');
const User = require('../models/usersModel');
const Review = require('../models/reviewsModel');

const connectionString =
	'mongodb+srv://ADnhmm:ADnhmm@cluster0-jizj2.mongodb.net/ADnhmm_natours?retryWrites=true&w=majority';

mongoose
	.connect(connectionString, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false
	})
	.then((con) => {
		console.log('Connected!');
	});

const importRecords = async () => {
	try {
		const allTourRecords = await fs.readFileSync('./tours.json');
		const addingTourResult = await Tour.create(JSON.parse(allTourRecords), { validateBeforeSave: false });
		const allUserRecords = await fs.readFileSync('./users.json');
		const addingUserResult = await User.create(JSON.parse(allUserRecords), { validateBeforeSave: false });
		const allReviewRecords = await fs.readFileSync('./review.json');
		const addingReviewResult = await Review.create(JSON.parse(allReviewRecords));
		console.log('added!');
	} catch (err) {
		console.log(err);
	}
	process.exit();
};

const deleteRecords = async () => {
	console.log('in delete!');
	try {
		await Tour.deleteMany();
		await User.deleteMany();
		await Review.deleteMany();
		console.log('Deleted!');
	} catch (err) {
		console.log(err);
	}
	process.exit();
};

if (process.argv[2] == '--import') {
	importRecords();
} else if (process.argv[2] == '--delete') {
	deleteRecords();
}

console.log(process.argv);
