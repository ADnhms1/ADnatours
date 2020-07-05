const locations = JSON.parse(document.getElementById('map').dataset.location);

console.log('ADnhmm from mapbox.js ' + locations[0].coordinates);

mapboxgl.accessToken = 'pk.eyJ1IjoiYWRuaG1tIiwiYSI6ImNrYmcwamZrNjBlZmUycm1sdnQyNDlnbGMifQ._2tySeH-g-c40kYM6VWS1Q';
var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/adnhmm/ckbg17xdc4nqj1ijy3d82kpki',
	scrollZoom: false
	// center: [ 72.613508, 23.000937 ],
	// zoom: 10,
	// interactive: false
});

const bounds = new mapboxgl.LngLatBounds(); // we create the bounds which represent the lat lng location

locations.forEach((l) => {
	// create marker for locating the lnglat

	const el = document.createElement('div');
	el.className = 'marker';

	// add marker

	new mapboxgl.Marker({
		element: el, // adding the element created
		anchor: 'bottom' // location where the marker will be displayed
	})
		.setLngLat(l.coordinates) // assigning the location of lng lat
		.addTo(map); // finally adding it to the map which is defined above

	new mapboxgl.Popup({
		// creating popup which allows to display some text/data
		offset: 30
	})
		.setLngLat(l.coordinates)
		.setHTML(`<p>Day ${l.day} : ${l.description}</p>`) // adding the html content which will be displayed on the popup
		.addTo(map);

	// extend mapbounds to include current location

	bounds.extend(l.coordinates);
});

map.fitBounds(bounds, {
	// moves and fits the map location and gives that amazing zoom effect
	padding: { top: 150, bottom: 150, left: 100, right: 100 }
});
