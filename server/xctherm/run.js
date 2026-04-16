import fs from 'node:fs/promises';
import path from 'node:path';
import axios from 'axios';
import { getAuthToken } from './auth.js';

const BASE_URL = 'https://xctherm.com';

const COMMON_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: BASE_URL,
  Referer: `${BASE_URL}/en/welcome`,
};

/**
 * Fetch the forecast summary — returns all active regions with their current
 * forecast IDs and thermal values (oneway km, return km, climb rate).
 * No sensitive data is included in the response.
 */
async function getForecastSummary(jwtToken) {
  const response = await axios.get(`${BASE_URL}/api/thermalforecast/getForecastSummary`, {
    params: { _: Date.now() },
    headers: { ...COMMON_HEADERS, Authorization: `Bearer ${jwtToken}` },
    timeout: 30000,
  });
  return response.data;
}

/**
 * Fetch forecast detail for a single forecast ID (includes SVG chart).
 */
async function getForecastData(jwtToken, forecastId) {
  const response = await axios.get(`${BASE_URL}/api/thermalForecast/getForecastData`, {
    params: { id: forecastId, aspectRatio: 1.982233502538071 },
    headers: { ...COMMON_HEADERS, Authorization: `Bearer ${jwtToken}` },
    timeout: 30000,
  });
  return response.data;
}

const OUTPUT_DIR =
  process.env.FORECAST_DATA_PATH ||
  path.join(new URL('.', import.meta.url).pathname, 'forecasts');

const TOKEN_CACHE_PATH = path.join(
  new URL('.', import.meta.url).pathname,
  'token-cache.json'
);

async function main() {
  console.log('[Scraper] Starting xctherm forecast scrape...');

  const jwtToken = await getAuthToken(TOKEN_CACHE_PATH);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // 1. Fetch summary — gives us all active region IDs + thermal values dynamically
  console.log('[Scraper] Fetching forecast summary...');
  const summary = await getForecastSummary(jwtToken);
  const { thermalForecasts, publishDate, calculateDate } = summary;

  if (!thermalForecasts || typeof thermalForecasts !== 'object') {
    throw new Error('Unexpected getForecastSummary response shape');
  }

  // 2. For each region, fetch detailed forecast (includes SVG chart)
  const regionSummaries = {};

  for (const entry of Object.values(thermalForecasts)) {
    const { id: forecastId, oneway, return: returnKm, climb } = entry;
    console.log(`[Scraper] Fetching forecastId ${forecastId}...`);
    try {
      const data = await getForecastData(jwtToken, forecastId);
      const { regionName, textForecast, chart } = data;

      if (!regionName) {
        console.warn(`[Scraper] No regionName for forecastId ${forecastId}, skipping`);
        continue;
      }

      // Save per-region file by ID (stable, not dependent on display name)
      await fs.writeFile(
        path.join(OUTPUT_DIR, `${forecastId}_latest.json`),
        JSON.stringify(
          { regionName, forecastId, oneway, return: returnKm, climb, textForecast, chart, publishDate, _scrapedAt: new Date().toISOString() },
          null, 2
        )
      );
      console.log(`[Scraper] Saved ${forecastId}_latest.json (${regionName}, oneway: ${oneway}km)`);

      regionSummaries[regionName] = { forecastId, oneway, return: returnKm, climb };
    } catch (err) {
      console.error(`[Scraper] Failed forecastId ${forecastId}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  // 3. Save lightweight summary file (no chart data, used for map shading + tooltips)
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'summary_latest.json'),
    JSON.stringify({ publishDate, calculateDate, regions: regionSummaries, _scrapedAt: new Date().toISOString() }, null, 2)
  );
  console.log('[Scraper] Saved summary_latest.json');
  console.log('[Scraper] Done.');
}

main().catch((err) => {
  console.error('[Scraper] Fatal error:', err.message);
  process.exit(1);
});
