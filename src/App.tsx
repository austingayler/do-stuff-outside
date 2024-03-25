import { useEffect, useState } from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import WeatherMap from "./WeatherMap";
import WeatherSlider from "./WeatherSlider";

const dabsLink = "https://www.skybriefing.com/portal/delegate/dabs?today";

function App() {
  const [count, setCount] = useState(0);

  const [minutesOffset, setMinutesOffset] = useState(0);
  const [dabs, setDabs] = useState(null);

  const handleChange = (event) => {
    const minutesToAdd = parseInt(event.target.value);
    setMinutesOffset(minutesToAdd);
  };

  const generateTimeOptions = () => {
    const options = [];
    const currentTime = new Date();
    const endTime = new Date(currentTime.getTime() + 2 * 24 * 60 * 60 * 1000); // Two days ahead

    while (currentTime < endTime) {
      options.push(currentTime);
      currentTime.setMinutes(currentTime.getMinutes() + 10);
    }

    return options;
  };

  const selectedTime = new Date(
    new Date().getTime() + minutesOffset * 60 * 1000
  );

  function roundToNearest10Minutes() {
    const currentTime = new Date(selectedTime);
    const minutes = currentTime.getMinutes();
    const remainder = minutes % 10;

    // Round the minutes to the nearest 10
    if (remainder < 5) {
      currentTime.setMinutes(minutes - remainder);
    } else {
      currentTime.setMinutes(minutes + (10 - remainder));
    }
    currentTime.setSeconds(0);
    currentTime.setMilliseconds(0);

    return currentTime;
  }

  return (
    <>
      <div className="w-full flex flex-col justify-center items-center gap-4">
        <h1>DO STUFF OUTSIDE</h1>
        {/* <WeatherMap time={roundToNearest10Minutes()} />
        <div>
          <input
            type="range"
            min="0"
            max={`${60 * 24 * 2}`}
            step="1"
            value={minutesOffset}
            onChange={handleChange}
          />
          <p>{selectedTime.toLocaleString()}</p>
          <p>{roundToNearest10Minutes().toLocaleString()}</p>
        </div> */}

        {/* <WeatherSlider /> */}

        <a
          href="https://jungfrau.roundshot.co/interlaken-harderkulm/"
          target="_blank"
        >
          <img
            src={
              "https://images-webcams.windy.com/74/1697034574/current/original/1697034574.jpg?token=swisswebcams.ch:9156f0c37c25cc78a1e06141918809d3:1710835200"
            }
            className="aspect-auto w-full object-cover"
            alt="View from Harder Kulm"
            key={Date.now()}
          />
        </a>

        <iframe
          width="80%"
          height="450"
          src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=7&overlay=rain&product=ecmwf&level=surface&lat=46.808&lon=8.152&detailLat=44.91813929958517&detailLon=5.998535156250001&marker=true&message=true"
        ></iframe>

        <img
          src={
            "https://www.srf.ch/meteo/static/prognosetafeln/wind/FOEHNDIAGRAMM.jpg"
          }
          className="aspect-auto object-cover w-1/2"
          style={{ width: 638, height: 477 }}
          alt="Foehn diagram"
          key={Date.now()}
        />
        <img
          src={
            "https://www.srf.ch/meteo/static/prognosetafeln/wind/BISENDIAGRAMM.jpg"
          }
          className="aspect-auto object-cover"
          style={{ width: 638, height: 477 }}
          alt="Bise diagram"
          key={Date.now()}
        />
        <a target="_blank" href={dabsLink} style={{ fontSize: 72 }}>
          DABS
          <sup className="new-tab-icon">↗</sup>
        </a>

        <iframe
          style={{ width: "80%", height: 500 }}
          allow="geolocation"
          src="https://winds.mobi/stations/list?lat=46.6833&lon=7.8500&zoom=15"
        />
      </div>
    </>
  );
}

export default App;
