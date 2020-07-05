const checkLogin = async (userName, password) => {
	console.log(userName, password);
	try {
		const rs = await axios({
			method: 'POST',
			url: 'http://127.0.0.1:2000/api/v1/users/signin',
			data: {
				userName,
				password
			},
			credentials: 'include'
		});
		if (rs.data.status === 'Success') {
			console.log(rs);
			console.log('====> Rs Is Here ');
			setCookie('token', rs.data.token, 30); // assigning client side cookie in the browser
			location.assign('/');
		}
	} catch (err) {
		console.log(err.response.data);
	}
};

document.querySelector('#loginForm').addEventListener('submit', (e) => {
	e.preventDefault();
	const uname = document.querySelector('#loginUsername').value;
	const upass = document.querySelector('#loginPassword').value;
	console.log(uname, upass);
	checkLogin(uname, upass);
});

function setCookie(name, value, days) {
	// this sets cookie in the browser from client side
	var expires = '';
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = '; expires=' + date.toUTCString();
	}
	document.cookie = name + '=' + (value || '') + expires + '; path=/';
}
function getCookie(name) {
	// this gets cookies from the client side
	var nameEQ = name + '=';
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}
function eraseCookie(name) {
	// this removes the cookie from the client side
	document.cookie = name + '=; Max-Age=-99999999;';
}
