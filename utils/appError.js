class appError extends Error {
	constructor(status, statusCode, message) {
		super(message);
		this.status = status || 'error';
		this.statusCode = statusCode || 500;
	}
}

module.exports = appError;
