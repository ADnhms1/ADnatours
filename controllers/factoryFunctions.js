const Tour = require('../models/tourModel');
exports.deleteRecord = (Model) => {
	return async (req, res, next) => {
		try {
			console.log('Hi from factory func');
			console.log(`From delete ${Model}`);
			const deleteRecord = await Model.findByIdAndDelete(req.params.id);
			if (!deleteRecord) {
				const err = new appError('fail', 400, `Record with id ${req.params.id} not found in ${Model}`);
				return next(err);
			}
			res.status(200).json({
				status: 'Success',
				data: null
			});
		} catch (err) {
			res.status(400).json({
				status: 'Failure',
				message: err
			});
		}
	};
};

exports.updateRecord = (Model) => {
	return async (req, res, next) => {
		try {
			console.log(`From update ${Model}`);
			const updatedRecord = await Model.findByIdAndUpdate(req.params.id, req.body, {
				new: true,
				runValidators: true
			});
			res.status(200).send({
				status: 'success',
				data: {
					data: updatedRecord
				}
			});
		} catch (err) {
			next(err);
		}
	};
};

exports.createRecord = (Model) => async (req, res, next) => {
	try {
		const doc = await Model.create(req.body);

		res.status(201).json({
			status: 'success',
			data: {
				data: doc
			}
		});
	} catch (err) {
		res.send(err);
	}
};
