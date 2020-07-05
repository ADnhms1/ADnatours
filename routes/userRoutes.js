const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const factoryFunction = require('../controllers/factoryFunctions');
const Users = require('../models/usersModel');

const userController = require('../controllers/userController');

router.post('/api/v1/users/signup', userController.userSignUp);

router.post('/api/v1/users/signin', userController.userSignIn);

router.post('/api/v1/users/forgotPassword', userController.forgotPassword);

router.patch('/api/v1/users/resetPassword/:token', userController.resetPassword);

router.delete(
	'/api/v1/users/delete/:id',
	tourController.protect,
	tourController.restrictUser('admin'),
	factoryFunction.deleteRecord(Users)
);

router.patch('/api/v1/users/updateUserPassword', tourController.protect, userController.updateUserPassword);

router.patch(
	'/api/v1/users/updateMe/',
	tourController.protect,
	userController.uploadImage,
	userController.resizeUserPhoto,
	userController.updateMe
); // step3 set the middleware which will copy the file from the field with the given name and store it at the given destination

router.get('/api/v1/users/me', tourController.protect, userController.getMyData);

module.exports = router;
