const nodeMailer = require('nodemailer');
const ejs = require('ejs');
const htmlToText = require('html-to-text');
const { resetPassword } = require('../controllers/userController');

module.exports = class Email {
	// NODE_TLS_REJECT_UNAUTHORIZED='0' adding this to config.env file will remove ssl tls errors
	constructor(user, url) {
		this.to = user.email;
		this.firstName = user.userName.split(' ')[0];
		this.url = url;
		this.from = 'admin@natours.com';
	}

	newTransport() {
		if (process.env.NODE_ENV === 'production') {
			return nodeMailer.createTransport({
				service: 'SendGrid',
				auth: {
					user: process.env.SENDGRID_USERNAME,
					pass: process.env.SENDGRID_PASSWORD
				}
			});
		}

		return nodeMailer.createTransport({
			host: process.env.EMAIL_HOST,
			port: process.env.EMAIL_PORT,
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD
			}
		});
	}

	async send(template, subject) {
		// 1) render html page
		const html = await ejs.renderFile(`${__dirname}/../views/emails/${template}.ejs`, {
			firstName: this.firstName,
			url: this.url,
			subject
		});

		// 2) define email options
		const mailOptions = {
			from: this.from,
			to: this.to,
			subject,
			html,
			text: htmlToText.fromString(html)
		};

		// 3) create transport and send email
		await this.newTransport().sendMail(mailOptions);
	}

	async sendWelcome() {
		await this.send('Welcome', 'Welcome to the natours family.');
	}

	async sendResetPassword() {
		await this.send('resetPassword', 'Password reset token (valid for next 10 mins)');
	}
};

// // const sendEmail = async (options) => {
// // 	// create a transporter

// // 	const transporter = nodeMailer.createTransport({
// // 		host: process.env.EMAIL_HOST,
// // 		port: process.env.EMAIL_PORT,
// // 		auth: {
// // 			user: process.env.EMAIL_USERNAME,
// // 			pass: process.env.EMAIL_PASSWORD
// // 		}
// // 	});

// // 	// define the mail options/data

// // 	const mailOptions = {
// // 		from: 'admin@natours.com',
// // 		to: options.to,
// // 		subject: options.subject,
// // 		text: options.message
// // 	};

// // 	// actually sending the email
// // 	console.log(mailOptions);
// // 	await transporter.sendMail(mailOptions);
// // };

// // module.exports = sendEmail;
