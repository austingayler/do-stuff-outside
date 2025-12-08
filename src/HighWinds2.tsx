import { useState, useEffect } from "react";

const twoK = "800h";
const threeK = "700h";
const fourK = "600h";
const elevations = [twoK, threeK, fourK];

const lat = 46.683;
const lon = 7.85;
const zoom = 8;

function getNextFiveDays() {
  const dates = [];
  const now = new Date();

  for (let i = 0; i < 5; i++) {
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + i);
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, "0");
    const day = String(futureDate.getDate()).padStart(2, "0");
    // const hours = String(futureDate.getHours()).padStart(2, "0");
    dates.push(`${year}${month}${day}`);
  }

  return dates;
}

const createWindyImageUrl = (elevation: string, day: string) =>
  `/api/images/wind-${elevation}-${day}.png`;

// TODO: Implement xctherm scraper
// const createXcThermImageUrl = (elevation: string, day: string) =>
//   `/api/images/xctherm-${elevation}-${day}.png`;

const days = getNextFiveDays();

const images = elevations.flatMap((elevation) =>
  days.map((day) => createWindyImageUrl(elevation, day)),
);

// const xcThermImages = days.map((day) => createXcThermImageUrl("4000", day));

const HighWinds2: React.FC = () => {
  return (
    <>
      <div>
        {images.map((src) => (
          <img
            key={src}
            src={src}
            alt="Windy weather snapshot"
            style={{
              width: "100%",
              height: "auto",
              marginBottom: 20,
            }}
          />
        ))}
      </div>
      {/* TODO: Implement xctherm scraper
      <div>
        {xcThermImages.map((src) => (
          <img
            key={src}
            src={src}
            alt="XCTherm weather snapshot"
            style={{
              width: "100%",
              height: "auto",
              marginBottom: 20,
            }}
          />
        ))}
      </div>
      */}
    </>
  );
};

export default HighWinds2;
