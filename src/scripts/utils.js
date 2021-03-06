// Simple XHR Get
export function get(url) {
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    req.open("GET", url);

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status == 200) {
        // Resolve the promise with the response text
        resolve(req.response);
      } else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error("Network Error"));
    };

    // Make the request
    req.send();
  });
}

// Hide Element
export function hideElement(el) {
  el.style.display = "none";
}

// Show Element
export function showElement(el, value) {
  el.style.display = value;
  el.style.visibility = "visible";
}

// Meters to miles, to two decimal points
export function metersToFixedMiles(m) {
  return (m * 0.000621371192).toFixed(2);
}

// Round seconds to nearest minute
export function secondsToRoundedMinutes(s) {
  return Math.round(s / 60);
}
