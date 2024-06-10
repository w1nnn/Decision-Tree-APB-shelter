import axios from "axios";
import "./src/css/style.css";
import "ol/ol.css";
import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import OSM from "ol/source/OSM.js";
import Overlay from "ol/Overlay.js";
import { fromLonLat } from "ol/proj.js";
import { LineString } from "ol/geom.js";
import markerImage from "./assets/marker.png";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import { Style, Stroke } from "ol/style.js";
import { Feature } from "ol";
import { getPathUrl, headers } from "./src/js/config.js";

const map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: fromLonLat([119.428038, -5.153766]),
    zoom: 17,
  }),
});

const data = {
  coordinates: [
    [119.428038, -5.153766],
    [119.428491, -5.15286],
  ],
};

const generateRandomCoordinates = (center, radius, numPoints) => {
  const randomCoordinates = [];
  const [centerLon, centerLat] = center;

  for (let i = 0; i < numPoints; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radius;
    const newLon = centerLon + distance * Math.cos(angle);
    const newLat = centerLat + distance * Math.sin(angle);
    randomCoordinates.push([newLon, newLat]);
  }

  return randomCoordinates;
};

const centerPoint = [119.428038, -5.153766];
const radius = 0.01;
const numPoints = 10;

const randomCoordinates = generateRandomCoordinates(
  centerPoint,
  radius,
  numPoints
);
console.log(randomCoordinates);

randomCoordinates.forEach((coord) => {
  const markerElement = document.createElement("div");
  markerElement.classList.add("random-marker");

  const popupElement = document.createElement("div");
  popupElement.classList.add("popup");

  const contentElement = document.createElement("div");
  contentElement.classList.add("popup-content");
  contentElement.innerText = "Aman";

  popupElement.appendChild(contentElement);

  markerElement.appendChild(popupElement);

  const markerOverlay = new Overlay({
    position: fromLonLat(coord),
    positioning: "center-center",
    element: markerElement,
    stopEvent: false,
  });

  map.addOverlay(markerOverlay);
});

const url = getPathUrl("walking");

axios
  .post(url, data, { headers })
  .then((response) => {
    console.log(response.data);

    const geometry = response.data.routes[0].geometry;
    const route = new LineString(
      decodePolyline(geometry).map((coord) => fromLonLat(coord))
    );

    const routeStyle = new Style({
      stroke: new Stroke({
        color: "blue",
        width: 5,
      }),
    });

    const routeFeature = new Feature({
      geometry: route,
    });

    routeFeature.setProperties({
      distance: response.data.routes[0].summary.distance,
      duration: response.data.routes[0].summary.duration / 60,
    });

    routeFeature.setStyle(routeStyle);

    map.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: [routeFeature],
        }),
      })
    );

    map.on("pointermove", function (event) {
      const features = map.getFeaturesAtPixel(event.pixel);
      let info = document.getElementById("info");
      if (features.length > 0) {
        let distance = features[0].getProperties().distance;
        let duration = features[0].getProperties().duration;
        console.log("Distance:", distance);
        console.log("Duration:", duration);
        info.innerHTML =
          "Distance: " +
          distance.toFixed(2) +
          " meters<br>" +
          "Duration: " +
          duration.toFixed(2) +
          " minutes";
      } else {
        info.innerHTML = "&nbsp;";
      }
    });

    const marker = new Overlay({
      position: fromLonLat(response.data.metadata.query.coordinates[0]),
      positioning: "center-center",
      element: document.getElementById("marker"),
      stopEvent: false,
      className: "marker",
    });
    map.addOverlay(marker);

    const marker2 = new Overlay({
      position: fromLonLat(response.data.metadata.query.coordinates[1]),
      positioning: "center-center",
      element: document.createElement("img"),
      stopEvent: false,
    });
    marker2.getElement().src = markerImage;
    map.addOverlay(marker2);
  })
  .catch((error) => {
    console.error("Error:", error);
  });

const decodePolyline = (encoded) => {
  const len = encoded.length;
  let index = 0;
  let lat = 0;
  let lng = 0;
  const points = [];

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) != 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) != 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lng * 1e-5, lat * 1e-5]);
  }

  return points;
};
