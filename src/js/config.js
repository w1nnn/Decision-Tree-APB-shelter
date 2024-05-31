export const getPathUrl = (routeType) => {
  const pathParams = {
    walking: "foot-hiking",
    driving: "driving-car",
    cycling: "cycling-regular",
  };

  return `https://api.openrouteservice.org/v2/directions/${pathParams[routeType]}`;
};

export const headers = {
  Accept:
    "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
  "Content-Type": "application/json",
  Authorization: "5b3ce3597851110001cf6248e515b644174f4b1d9b5e9767e8b4c611",
};
