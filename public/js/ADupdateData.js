// const updatePasswordButton = document.querySelector('#updatePassword');
// console.log('AD from ADupdateData.js');

// if (updatePasswordButton) {
// 	console.log('YES!');
// }

// const updatePassword = async (currentPass, updatePass) => {
// 	console.log(currentPass, updatePass);
// 	try {
// 		const rs = await axios({
// 			method: 'PATCH',
// 			url: 'http://127.0.0.1:2000/api/v1/users/updateUserPassword',
// 			data: {
// 				currentPass,
// 				updatePass
// 			}
// 		});
// 		// if (rs.data.status === 'Success') {
// 		// 	console.log(rs);
// 		// 	console.log('====> Rs Is Here ');
// 		// 	setCookie('token', rs.data.token, 30); // assigning client side cookie in the browser
// 		// 	location.assign('/me');
// 		// }
// 		console.log(rs);
// 	} catch (err) {
// 		console.log('Erorrrrrrr : ' + err.data.err);
// 	}
// };

// function setCookie(name, value, days) {
// 	// this sets cookie in the browser from client side
// 	var expires = '';
// 	if (days) {
// 		var date = new Date();
// 		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
// 		expires = '; expires=' + date.toUTCString();
// 	}
// 	document.cookie = name + '=' + (value || '') + expires + '; path=/';
// }

// document.querySelector('#updatePassword').addEventListener('click', (e) => {
// 	e.preventDefault();
// 	const currentPass = document.querySelector('#currentPassword').value;
// 	const newPassword = document.querySelector('#newPassword').value;
// 	const confirmPassword = document.querySelector('#confirmPassword').value;

// 	if (newPassword !== confirmPassword) {
// 		console.log('Invalid details');
// 		location.assign('/me');
// 	} else {
// 		updatePassword(currentPass, confirmPassword);
// 	}
// });

const updateDetails = async (userName, email, photo) => {
	try {
		const rs = await axios({
			method: 'PATCH',
			url: 'http://127.0.0.1:2000/api/v1/users/updateMe/',
			data: {
				userName,
				email,
				photo
			},
			credentials: 'include'
		});
		if (rs.data.status === 'Success') {
			console.log(rs);
			console.log('====> Rs Is Here ');
			// setCookie('token', rs.data.token, 30); // assigning client side cookie in the browser
			location.assign('/me');
		}
	} catch (err) {
		console.log(err.response.data);
	}
};

document.querySelector('#profileForm').addEventListener('submit', (e) => {
	e.preventDefault();
	const userName = document.querySelector('#profileUserame').value;
	const email = document.querySelector('#profileEmail').value;
	const photo = document.querySelector('#photo').value.split('\\')[2];
	console.log(userName, email, photo);
	updateDetails(userName, email, photo);
});
