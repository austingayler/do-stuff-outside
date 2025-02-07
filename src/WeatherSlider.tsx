import { useEffect, useRef, useState } from "react";

// TODO: I think loading a bunch of images isn't the best approach, best would be a server that compiles the images into a video
// and then serves that, run daily or so

const roundUpTo = (roundTo) => (x) => Math.ceil(x / roundTo) * roundTo;
const roundUpTo10Minutes = roundUpTo(1000 * 60 * 10);

function getRoundedDate(minutes, d = new Date()) {
  let ms = 1000 * 60 * minutes; // convert minutes to ms
  let roundedDate = new Date(Math.round(d.getTime() / ms) * ms);

  return roundedDate;
}

const WeatherSlider = () => {
  const [imgs, setImgs] = useState();

  useEffect(() => {
    const startDate = getRoundedDate(10, new Date());
    const currentDate = getRoundedDate(10, new Date());
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

    // Function to pad single digit numbers with leading zeros
    const pad = (num) => (num < 10 ? "0" : "") + num;

    function roundToNearest10Minutes(d) {
      const currentTime = new Date(d);
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

    // Generate array of strings in 10-minute increments for the next 24 hours
    const array_of_strings = [];
    while (currentDate < endDate) {
      const formattedDate =
        currentDate.getFullYear() +
        "" +
        pad(currentDate.getMonth() + 1) +
        "" +
        pad(currentDate.getDate()) +
        "_" +
        pad(currentDate.getHours()) +
        pad(currentDate.getMinutes());
      array_of_strings.push(formattedDate);
      currentDate.setMinutes(currentDate.getMinutes() + 10);
    }

    const url = (d) =>
      `https://media.meteonews.net/radarpre/chComMET_800x618_c1/radarpre_20240324_1920_${d}.png`;
    const p = array_of_strings.map((d) => fetch(url(d)).then((r) => r.blob()));

    Promise.all(p).then((values) => setImgs(values));
  });

  console.log(imgs);

  return (
    <div
      style={{
        height: 618,
        width: 800,
      }}
    >
      <p>asdf</p>
    </div>
  );
};

export default WeatherSlider;
