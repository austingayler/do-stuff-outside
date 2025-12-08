import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, "images");

// Ensure images directory exists
mkdirSync(imagesDir, { recursive: true });

// Elevation options
const twoK = "800h";
const threeK = "700h";
const fourK = "600h";
const elevations = [twoK, threeK, fourK];

// Location coordinates and zoom level
const lat = 46.683;
const lon = 7.85;
const zoom = 8;

// Function to get the next five days in the required format
function getNextFiveDays() {
  const dates = [];
  const now = new Date();

  for (let i = 0; i < 5; i++) {
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + i);
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, "0");
    const day = String(futureDate.getDate()).padStart(2, "0");
    const hours = String(futureDate.getHours()).padStart(2, "0");
    dates.push(`${year}${month}${day}${hours}`);
  }

  return dates;
}

// Main function to take screenshots for all combinations of elevations and dates
async function takeScreenshots() {
  const dates = getNextFiveDays();
  const browser = await puppeteer.launch();

  for (const elevation of elevations) {
    for (const day of dates) {
      const url = `https://www.windy.com/?${elevation},${day},${lat},${lon},${zoom}`;
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });
      await page.goto(url, { waitUntil: "networkidle2" });
      await page.screenshot({ path: join(imagesDir, `wind-${elevation}-${day}.png`) });
      await page.close();
      console.log(
        `Screenshot taken for elevation ${elevation} on date ${day}.`,
      );
    }
  }

  await browser.close();
}

takeScreenshots().catch((err) => console.error(err));