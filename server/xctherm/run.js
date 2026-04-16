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
  console.log('[Scraper] ========================================');
  console.log('[Scraper] XCTherm forecast scrape starting');
  console.log('[Scraper] Time:', new Date().toISOString());
  console.log('[Scraper] OUTPUT_DIR:', OUTPUT_DIR);
  console.log('[Scraper] ========================================');

  console.log('[Scraper] Step 1/3: Authenticate');
  const jwtToken = await getAuthToken(TOKEN_CACHE_PATH);
  console.log('[Scraper] Auth OK');

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  console.log('[Scraper] Output directory ready:', OUTPUT_DIR);

  console.log('[Scraper] Step 2/3: Fetch forecast summary');
  const summary = await getForecastSummary(jwtToken);
  const { forecastSummaries, publishDate, calculationDate } = summary;
  console.log('[Scraper] Summary publishDate:', publishDate);
  console.log('[Scraper] Summary calculationDate:', calculationDate);

  if (!forecastSummaries || !Array.isArray(forecastSummaries) || forecastSummaries.length === 0) {
    console.error('[Scraper] Unexpected summary shape. Keys:', Object.keys(summary).join(', '));
    throw new Error('Unexpected getForecastSummary response shape');
  }

  console.log(`[Scraper] Found ${forecastSummaries.length} forecast days`);

  // Step 3: fetch all days
  console.log('[Scraper] Step 3/3: Fetch per-region detail for all days');
  const days = [];
  const seenForecastIds = new Set();
  let totalSuccess = 0;

  for (let dayIndex = 0; dayIndex < forecastSummaries.length; dayIndex++) {
    const daySummary = forecastSummaries[dayIndex];
    const { date } = daySummary;
    const thermalForecasts = daySummary.thermalForecasts;
    console.log(`[Scraper] --- Day ${dayIndex}: ${date} ---`);

    if (!thermalForecasts || typeof thermalForecasts !== 'object') {
      console.warn(`[Scraper]   No thermalForecasts for day ${dayIndex}, skipping`);
      continue;
    }

    const regionEntries = Array.isArray(thermalForecasts)
      ? thermalForecasts
      : Object.values(thermalForecasts);

    const dayRegions = {};

    for (const entry of regionEntries) {
      const { id: forecastId, oneway, return: returnKm, climb } = entry;

      // Only fetch the chart once per unique forecastId (different days have different IDs)
      if (!seenForecastIds.has(forecastId)) {
        seenForecastIds.add(forecastId);
        try {
          const data = await getForecastData(jwtToken, forecastId);
          const { regionName, textForecast, chart } = data;
          if (!regionName) { console.warn(`[Scraper]   No regionName for ${forecastId}`); continue; }
          const outPath = path.join(OUTPUT_DIR, `${forecastId}_latest.json`);
          await fs.writeFile(
            outPath,
            JSON.stringify({ regionName, forecastId, oneway, return: returnKm, climb, textForecast, chart, publishDate, _scrapedAt: new Date().toISOString() }, null, 2)
          );
          console.log(`[Scraper]   Saved ${forecastId}_latest.json → ${regionName} (${oneway}km oneway)`);
          dayRegions[regionName] = { forecastId, oneway, return: returnKm, climb };
          totalSuccess++;
        } catch (err) {
          console.error(`[Scraper]   ERROR fetching ${forecastId}: ${err.message}`);
          if (err.response) console.error(`[Scraper]   HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`);
          process.exitCode = 1;
        }
      } else {
        // Already fetched — still include in day summary using cached name lookup
        // We need the regionName; re-use from a previously-saved file if possible
        try {
          const cached = JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, `${forecastId}_latest.json`), 'utf-8'));
          dayRegions[cached.regionName] = { forecastId, oneway, return: returnKm, climb };
        } catch { /* skip if not found */ }
      }
    }

    days.push({ date, regions: dayRegions });
    console.log(`[Scraper]   Day ${dayIndex} regions: ${Object.keys(dayRegions).join(', ')}`);
  }

  console.log(`[Scraper] Fetched ${totalSuccess} unique forecast files across ${forecastSummaries.length} days`);

  // Save multi-day summary (no chart data — used for map shading, tooltips, day buttons)
  const summaryPath = path.join(OUTPUT_DIR, 'summary_latest.json');
  await fs.writeFile(
    summaryPath,
    JSON.stringify({ publishDate, calculationDate, days, _scrapedAt: new Date().toISOString() }, null, 2)
  );
  console.log('[Scraper] Saved summary:', summaryPath);
  console.log('[Scraper] ========================================');
  console.log('[Scraper] Done at', new Date().toISOString());
  console.log('[Scraper] ========================================');
}
  console.log('[Scraper] Time:', new Date().toISOString());
  console.log('[Scraper] OUTPUT_DIR:', OUTPUT_DIR);
  console.log('[Scraper] ========================================');

main().catch((err) => {
  console.error('[Scraper] Fatal error:', err.message);
  process.exit(1);
});
