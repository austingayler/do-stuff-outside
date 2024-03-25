import { useRef } from "react";
import { ImageOverlay, MapContainer, TileLayer } from "react-leaflet";

const b = [
  [45.18624, 11.457574],
  [48.389974, 5.023348],
];

const center = {
  base: "",
  base_url: "/",
  marker: false,
  zi: 0,
  x: 662000,
  y: 190000,
  drawing: "",
  additional_poi: null,
  mode: "map",
  q: null,
  time: null,
  date: null,
  layer: null,
  base_type: "default",
  dimensions: [490000, 330000],
  lon: 8.251683,
  lat: 46.85824,
  infocard: null,
  messages: "",
};

const SimpleMap = ({ time }: { time: Date }) => {
  const mapRef = useRef(null);

  const img = Math.round(time.valueOf() / 1000);
  console.log({ time: time.valueOf(), img });

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={7}
      ref={mapRef}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Additional map layers or components can be added here */}
      <ImageOverlay
        bounds={b}
        // url="https://search.ch/meteo/images/cosmo/PREC1/1711252800.png"
        url={`https://search.ch/meteo/images/cosmo/PREC1/${img}.png`}
      />
    </MapContainer>
  );
};

export default SimpleMap;
