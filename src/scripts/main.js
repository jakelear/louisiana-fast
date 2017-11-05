import {
  get,
  showElement,
  hideElement,
  metersToFixedMiles,
  secondsToRoundedMinutes
} from './utils';
import mapboxKey from './mapbox_key';
import mapboxgl from 'mapbox-gl';
import turfDistance from '@turf/distance';

mapboxgl.accessToken = mapboxKey();

var locations = {};
var map;

const button = document.getElementById('chicken-btn');
button.addEventListener('click', function(event) {
  event.preventDefault();
  start();
});

/**
* getUserLocation
* - Gets the user's current location using browser geolocation
*/
function getUserLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

function init() {
  const phraseOne = document.getElementById('phrase-one');
  const phraseTwo = document.getElementById('phrase-two');
  const buttonLoader = document.getElementById('btn-loader');
  setTimeout(function() {
    phraseOne.classList.add('fade-in');
  }, 200);
  setTimeout(function() {
    phraseTwo.classList.add('fade-in');
  }, 700);

  setTimeout(function() {
    showElement(buttonLoader, 'block');
    getUserLocation()
      .then(position => {
        hideElement(buttonLoader);
        locations.user = {};
        locations.user.long = position.coords.longitude;
        locations.user.lat = position.coords.latitude;
        locations.user.coords = [locations.user.long, locations.user.lat];
        showStartButton();
      })
      .catch(err => {
        console.log(err.message);
      });
  }, 1200);

  function showStartButton() {
    const buttonFader = document.getElementById('btn-fader');
    buttonFader.classList.add('fade-in');
  }
}

/**
* start
* Runs when user presses the "Find the chicken" button
* - Uses the mapbox geocoding api to search for nearby Popeyes locations
* - Limited by proximity to the user's location
* -
* -
*/
function start() {
  let landingSection = document.getElementById('landing');
  let loadingSection = document.getElementById('loading');
  let resultsSection = document.getElementById('results');

  hideElement(landingSection);
  showElement(loadingSection, 'block');

  let rootGeocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/`;
  let searchTerm = `Popeyes Louisiana Kitchen`;
  let localGeocodingSearchUrl = `${rootGeocodingUrl}${searchTerm}.json?access_token=${mapboxgl.accessToken}&country=us&proximity=${locations
    .user.long}%2C%20${locations.user.lat}`;

  // Fetch the nearby Popeyes locations
  get(localGeocodingSearchUrl).then(
    function(response) {
      // Parse the response and store the features
      let nearbyLocations = JSON.parse(response).features;
      let nearestLocation = findNearest(locations.user.coords, nearbyLocations);
      let mapContainer = document.getElementById('map');

      // Show the results section before appending the map
      // So mapbox can append properly sized canvas
      hideElement(loadingSection);
      resultsSection.classList.remove('hidden');

      map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v9?optimize=true',
        center: locations.user.coords,
        zoom: 14
      });

      // create a HTML element for user and location markers
      var userMarker = document.createElement('div');
      userMarker.className = 'm-map__marker';

      var locMarker = document.createElement('div');
      locMarker.className = 'm-map__marker';
      locMarker.classList.add('red');

      map.on('load', e => {
        if (map.loaded()) {
          // make a marker for each feature and add to the map
          new mapboxgl.Marker(userMarker)
            .setLngLat(locations.user.coords)
            .addTo(map);
          new mapboxgl.Marker(locMarker)
            .setLngLat(nearestLocation.geometry.coordinates)
            .addTo(map);

          let resultsPhraseOne = document.getElementById('results-phrase-one');
          let resultsPhraseTwo = document.getElementById('results-phrase-two');

          setTimeout(function() {
            resultsPhraseOne.classList.add('fade-in');
          }, 400);
          setTimeout(function() {
            resultsPhraseOne.classList.remove('fade-in');
            resultsPhraseOne.classList.add('fade-out');
            resultsPhraseTwo.classList.add('fade-in');
            flyToLocation(nearestLocation);
            initDirections(nearestLocation);
          }, 2300);

          // turn off sourcedata listener if its no longer needed
          map.off('load');
        }
      });
    },
    function(error) {
      console.error('Failed!', error);
    }
  );

  function flyToLocation(location) {
    map.flyTo({
      center: location.geometry.coordinates,
      zoom: 12,
      speed: 0.6, // make the flying slow
      curve: 1 // change the speed at which it zooms out
    });
  }
}

function initDirections(destination) {
  let rootDirectionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/`;
  let mode = 'driving';
  let coordinates = `${locations.user.long}%2C${locations.user
    .lat}%3B${destination.geometry.coordinates[0]}%2C${destination.geometry
    .coordinates[1]}`;
  let directionsUrl = `${rootDirectionsUrl}${coordinates}.json?access_token=${mapboxgl.accessToken}&steps=true`;
  get(directionsUrl).then(function(response) {
    console.log(JSON.parse(response));
    renderDirections(JSON.parse(response));
  });
}

function renderDirections(data) {
  const directionsSection = document.getElementById('directions');
  const directionsList = document.getElementById('directions-list');

  // Convert the distance and time to miles and minutes
  let distance = metersToFixedMiles(data.routes[0].distance);
  let time = secondsToRoundedMinutes(data.routes[0].duration);

  // Build a header for the directions
  let directionsHeader = document.createElement('div');
  directionsHeader.className = 'm-directions__header';
  directionsHeader.innerHTML = `<p>You're ${distance} miles and about ${time} minutes away.</p><p>Hang in there.</p>`;

  // Build the directions list
  let directions = data.routes[0].legs[0].steps;
  for (var i = 0, len = directions.length; i < len; i++) {
    let template = `
      <span class="m-directions__instruction">${directions[i].maneuver
        .instruction}</span>
      <span class="m-directions__distance">${metersToFixedMiles(
        directions[i].distance
      )} mi</span>
    `;
    let item = document.createElement('li');
    item.className = 'm-directions__item';
    item.innerHTML = template;
    directionsList.appendChild(item);
    directionsSection.insertBefore(directionsHeader, directionsList);

    directionsSection.classList.add('fade-in');
  }
}

/***
* findNearest
* Takes the user location and an array of other locations
* Iterates over the array of locations, measuring the distance
* then sorting the array by distance and returning the nearest
*/
function findNearest(userLocation, searchLocations) {
  // From: https://www.mapbox.com/help/geocode-and-sort-stores/#find-distance-from-all-locations
  searchLocations.forEach(function(result) {
    // Add a distance property to each result
    // that contains the distance from the user browser location
    Object.defineProperty(result.properties, 'distance', {
      value: turfDistance(locations.user.coords, result.geometry, 'miles'),
      writable: true,
      enumerable: true,
      configurable: true
    });
  });

  // Sort the locations by distance
  searchLocations.sort(function(a, b) {
    if (a.properties.distance > b.properties.distance) {
      return 1;
    }
    if (a.properties.distance < b.properties.distance) {
      return -1;
    }
    return 0;
  });

  // Return the closest location by distance
  // TODO: It might be the case that the closest by distance is not the fastest,
  // so it could be worthwhile to measure travel time on the N closest locations
  return searchLocations[0];
}

init();
