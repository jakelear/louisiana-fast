# Louisiana-fast
A button with one purpose: find the nearest Popeyes Louisiana Kitchen, and get directions to it.

## How does it work?
1. Use browser geolocation to locate the user.
2. Use [Mapbox Geocoding (with proximity)](https://www.mapbox.com/api-documentation/#geocoding) to find the nearest Popeyes locations
3. Use [Turf Distance](https://github.com/Turfjs/turf/tree/master/packages/turf-distance) to find which location is closest.
4. Use [Mapbox Directions](https://www.mapbox.com/api-documentation/#directions) to get distance, travel time, and directions.

## To run
1. Clone the repo
2. `npm install`
3. `npm run dev`
4. App will run at [localhost:9000](http://localhost:9000) with livereload
5. Webpack bundle analyzer will run at [localhost:8888](http://localhost:8888)


