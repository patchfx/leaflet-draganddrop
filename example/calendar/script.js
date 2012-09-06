$(function () {
	// Set up the full calendar
	$('#calendar').fullCalendar({
		events: []
	});

	// Set up the Leaflet map
	var cloudmade = L.tileLayer('http://{s}.tile.cloudmade.com/{key}/997/256/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade',
		key: 'BC9A493B41014CAABB98F0471D759707'
	});

	var map = L.map('map')
		.setView([-37.7874, 175.2791], 14)
		.addLayer(cloudmade);

	// Configure the drop manager. Need to tell the DropManager what elements are drop containers.
	var calendarDayCells = $('.fc-widget-content'),
		dropManager = new L.DropManager(calendarDayCells);

	// Add some drag and drop markers to the map 
	var markers = new L.FeatureGroup();
	populateStores(6, map, dropManager, markers);
	map.addLayer(markers);
});

function populateStores(numOfStores, map, dropManager, markers) {
	var latLngWithinBounds, storeJson;

	for (var i = 0; i < numOfStores; i++) {
		latLngWithinBounds = getRandomLatLng(map);
		storeJson = getStoreJson(i, latLngWithinBounds);

		marker = new L.DragAndDropMarker(latLngWithinBounds, {
			dropManager: dropManager,
			data: storeJson
		});

		// Set up the marker popup and event handlers
		marker
			.bindPopup(
				'<strong>' + storeJson.description + '</strong><br>' +
				storeJson.lat + ', ' + storeJson.lon
			)
			// Drop event handlers. You can customize this for your purposes.
			.on('overdropcontainer', function (e) {
				// Highlights the drop container that we are over. 
				$(e.container).addClass('drop-container-over');						
			})
			.on('leftdropcontainer', function (e) {
				$(e.container).removeClass('drop-container-over');
			})
			.on('dropped', function (e) {
				var $calendar = $('#calendar'),
					$droppedCell = $(e.container),
					eventObject = {
						id: e.data.store_id,
						title: e.data.description,
						start: getDroppedDate($droppedCell, $calendar),
						storeData: e.data
					};

				// Add event to calendar
				$calendar.fullCalendar('renderEvent', eventObject, true);

				if (console) {
					console.log(e.data);
				}
			});
		markers.addLayer(marker);
	}
};

// Calculates an random LatLng within the map vounds
function getRandomLatLng(map) {
	var bounds = map.getBounds(),
		southWest = bounds.getSouthWest(),
		northEast = bounds.getNorthEast(),
		lngSpan = northEast.lng - southWest.lng,
		latSpan = northEast.lat - southWest.lat;

	return new L.LatLng(
		southWest.lat + latSpan * Math.random(),
		southWest.lng + lngSpan * Math.random()
	);
};

// Generates an example store JSON object based off the id and LatLng
function getStoreJson(id, latLng) {
	return {
		"store_id": id,
		"description":"Store: " + id,
		"easting":"356966",
		"northing":"405374",
		"type":"Store",
		"draggable":"Y",
		"lat": latLng.lat.toFixed(6),
		"lon": latLng.lng.toFixed(6),
		"format":"green_store"
	};
};


function getDroppedDate($dayCell, $calendar) {
	var calendarDate = $calendar.fullCalendar('getDate'),
		dayNumber = parseInt($dayCell.find('.fc-day-number').text(), 10);

	// Check the dropped cell is a day in another month
	if ($dayCell.hasClass('fc-other-month')) {
		// If in the first row then must be in the previous month
		if ($dayCell.parent().hasClass('fc-week0')) {
			calendarDate.setMonth(calendarDate.getMonth() - 1);
		} else { // Otherwise in next month
			calendarDate.setMonth(calendarDate.getMonth() + 1);
		}
	}
	
	// Set the date to be the day of the day cell
	 calendarDate.setDate(dayNumber);

	 return calendarDate;
};