export const hidealert = () => {
	const alert = document.querySelector('.alert');
	if (el) {
		alert.parentElement.removeChild(el);
	}
};

export const showAlert = (type, msg) => {
	hidealert();
	const markUp = `<div class="alert alert--${type}">${msg}</div>`;
	document.querySelector('body').insertAdjacentHTML('afterbegin', markUp);
	window.setTimeout(hidealert, 5000);
};
