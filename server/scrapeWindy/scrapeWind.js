import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, "images");

// Ensure images directory exists
mkdirSync(imagesDir, { recursive: true });

// Elevation options - maps our naming to xctherm button IDs
const elevations = [
  { id: "wind_amsl_2000", name: "800h" }, // 2000m
  { id: "wind_amsl_3000", name: "700h" }, // 3000m
  { id: "wind_amsl_4000", name: "600h" }, // 4000m
];

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
    dates.push(`${year}${month}${day}`);
  }

  return dates;
}

// Main function to take screenshots for all combinations of elevations and dates
async function takeScreenshots() {
  const dates = getNextFiveDays();
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  console.log("Navigating to xctherm.com/icon");
  await page.goto("https://xctherm.com/icon", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  for (const elevation of elevations) {
    // Click the elevation button
    console.log(`Selecting elevation: ${elevation.id}`);
    await page.click(`#${elevation.id}`);
    await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});

    for (const day of dates) {
      // Click the date button
      console.log(`Selecting date: ${day}`);
      await page.click(`button#${day}`);
      await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});

      // Wait a moment for the map to render
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Screenshot the map container
      const mapElement = await page.waitForSelector("#map", {
        timeout: 30000,
      });
      const screenshotPath = join(
        imagesDir,
        `wind-${elevation.name}-${day}.png`,
      );
      await mapElement.screenshot({ path: screenshotPath });

      console.log(`Screenshot saved: ${screenshotPath}`);
    }
  }

  await browser.close();
  console.log("All screenshots completed!");
}

takeScreenshots().catch((err) => {
  console.error("Scraper failed:", err);
  process.exit(1);
});
