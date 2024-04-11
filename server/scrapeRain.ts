import fs from "fs";
import path from "path";
import { promisify } from "util";
const __dirname = path.resolve();

import fetch from "node-fetch";

const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);

async function downloadAndSaveImages(timestamps) {
  const imagesDir = path.join(__dirname, "rain");
  const currentTimestamp = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir);
    }

    const createImgUrl = (time: number) =>
      `https://search.ch/meteo/images/cosmo/PREC1/${time}.png`;

    // Download and save images
    for (const timestamp of timestamps) {
      const imageUrl = createImgUrl(timestamp);
      const imagePath = path.join(imagesDir, `${timestamp}.png`);

      // Download image
      const response = await fetch(imageUrl);
      const imageStream = fs.createWriteStream(imagePath);
      response.body.pipe(imageStream);

      console.log(`Image ${timestamp}.png downloaded and saved.`);

      //   // Delete images older than current time
      //   if (Number(timestamp) < currentTimestamp - twentyFourHours) {
      //     await unlink(imagePath);
      //     console.log(`Image ${timestamp}.png deleted.`);
      //   }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

export function roundToNearest10Minutes(selectedTime) {
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

let startTime = roundToNearest10Minutes(new Date());
const endTime = roundToNearest10Minutes(
  new Date(startTime.getTime() + 25 * 60 * 60 * 1000)
);

const imgTimes: number[] = [];
while (startTime < endTime) {
  imgTimes.push(startTime.valueOf() / 1000);
  startTime.setMinutes(startTime.getMinutes() + 10);
  startTime = new Date(startTime.getTime() + 10 * 60 * 1000);
}

console.log(imgTimes.map((a) => a.valueOf() / 1000));

downloadAndSaveImages(imgTimes);
