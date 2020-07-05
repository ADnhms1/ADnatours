console.log('from stripe.js');
const stripe = Stripe(
	'pk_test_51H17jrINYEQko8X4BgX17gPpYu5Tg4GfAKW5eFRqTGDRBHTMZwKS7RAagvflldEwQc98onxU3xMhSWXmwMqLNuBL00rxvFdSGv' // this requires a public key which is in the dashboard of stripe
);

const bookTour = async (tourId) => {
	try {
		// 1) get checkout session
		const session = await axios(`http://localhost:2000/api/v1/bookings/booking-session/${tourId}`);
		console.log(session);

		// 2) finally charge user here redirectToCheckout will show stripe created payment page.
		await stripe.redirectToCheckout({
			sessionId: session.data.session.id
		});
	} catch (err) {
		console.log(err);
	}
};

const bookTourButton = document.querySelector('#bookTour');

if (bookTourButton) {
	bookTourButton.addEventListener('click', (e) => {
		const tourId = e.target.dataset.tourId;
		e.target.textContent = 'Processing...';
		console.log('AD here is the id : ' + tourId);
		bookTour(tourId);
	});
}
