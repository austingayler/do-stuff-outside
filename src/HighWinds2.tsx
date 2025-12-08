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

const elevationLabels: Record<string, string> = {
  [twoK]: "2000m",
  [threeK]: "3000m",
  [fourK]: "4000m",
};

function formatDay(day: string, index: number): string {
  const month = day.slice(4, 6);
  const date = day.slice(6, 8);
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthName = monthNames[Number.parseInt(month, 10) - 1];
  const dateNum = Number.parseInt(date, 10);

  if (index === 0) {
    return `Today (${monthName} ${dateNum})`;
  }
  if (index === 1) {
    return `Tomorrow (${monthName} ${dateNum})`;
  }
  return `${monthName} ${dateNum}`;
}

// const xcThermImages = days.map((day) => createXcThermImageUrl("4000", day));

const HighWinds2: React.FC = () => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>Elevation</th>
            {days.map((day, index) => (
              <th key={day} style={{ padding: 8, border: "1px solid #ccc" }}>
                {formatDay(day, index)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {elevations.map((elevation) => (
            <tr key={elevation}>
              <td
                style={{
                  padding: 8,
                  border: "1px solid #ccc",
                  fontWeight: "bold",
                }}
              >
                {elevationLabels[elevation]}
              </td>
              {days.map((day, index) => (
                <td key={day} style={{ padding: 4, border: "1px solid #ccc" }}>
                  <img
                    src={createWindyImageUrl(elevation, day)}
                    alt={`Wind at ${elevationLabels[elevation]} on ${formatDay(day, index)}`}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
    </div>
  );
};

export default HighWinds2;
