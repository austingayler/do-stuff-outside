import { useEffect, useRef, useState } from "react";
import { ImageOverlay, MapContainer, TileLayer } from "react-leaflet";
import { roundToNearest10Minutes } from "./util";
import chBg from "/ch.png";

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

type RainMap = Record<number, Blob>;

const SimpleMap = () => {
  const [iframeFocused, setIframeFocused] = useState(false);

  const handleFocus = () => {
    setIframeFocused(true);
  };

  const handleBlur = () => {
    setIframeFocused(false);
  };

  const mapRef = useRef(null);
  const [minutesOffset, setMinutesOffset] = useState(0);
  const [imgs, setImgs] = useState<RainMap>({});

  const time = new Date();
  const img = Math.round(time.valueOf() / 1000);

  const handleChange = (event) => {
    const minutesToAdd = parseInt(event.target.value);
    setMinutesOffset(minutesToAdd);
  };

  const selectedTime = new Date(
    new Date().getTime() + minutesOffset * 60 * 1000
  );

  useEffect(() => {
    let startTime = roundToNearest10Minutes(new Date());
    const endTime = roundToNearest10Minutes(
      new Date(startTime.getTime() + 24 * 60 * 60 * 1000)
    );

    const imgTimes: number[] = [];
    while (startTime < endTime) {
      imgTimes.push(startTime.valueOf() / 1000);
      // startTime.setMinutes(startTime.getMinutes() + 10);
      startTime = new Date(startTime.getTime() + 10 * 60 * 1000);
    }

    // const createImgUrl = (time: number) =>
    //   `https://search.ch/meteo/images/cosmo/PREC1/${time}.png`;

    const createImgUrl = (time: number) =>
      `http://localhost:3002/rain/${time}.png`;
    // `http://localhost:3002/rain/1711543200.png`;

    const p = imgTimes.map((d) => fetch(createImgUrl(d)).then((r) => r.blob()));

    Promise.all(p).then((values) => {
      const data: Record<number, Blob> = {};
      values.forEach((blob, i) => {
        const key = imgTimes[i];
        data[key] = blob;
      });
      setImgs(data);
      // return setImgs(values);
    });

    return () => {
      Object.keys(imgs).forEach((key) => {
        // const blob = imgs[key];
        // URL.revokeObjectURL(blobUrl);
      });
    };
  }, []);

  const t = roundToNearest10Minutes(selectedTime).valueOf() / 1000;
  const i = imgs[t];
  let url;
  if (i) url = URL.createObjectURL(i);

  return (
    <>
      {/* <div
        className="w-full"
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{ pointerEvents: iframeFocused ? "auto" : "none" }}
      >
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
          {url && <ImageOverlay bounds={b} url={url} />}
        </MapContainer>
      </div> */}
      <div
        style={{
          width: 584,
          height: 425,
          backgroundImage: `url(${chBg})`,
          backgroundSize: "cover",
          position: "relative",
        }}
      >
        {url && (
          <img
            src={url} // Replace './image.jpg' with the path to your image
            alt="image"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        )}
      </div>
      <input
        type="range"
        min="0"
        max={`${60 * 24 * 1}`}
        step="10"
        value={minutesOffset}
        onChange={handleChange}
        className="w-1/2"
      />
      {/* <p>{selectedTime.toLocaleString()}</p> */}
      <p>{roundToNearest10Minutes(selectedTime).toLocaleString()}</p>
    </>
  );
};

export default SimpleMap;
