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

  // 2. Fetch summary — dynamically discovers all region IDs + current thermal values
  console.log('[Scraper] Step 2/3: Fetch forecast summary');
  const summary = await getForecastSummary(jwtToken);
  const { forecastSummaries: thermalForecasts, publishDate, calculationDate } = summary;
  console.log('[Scraper] Summary publishDate:', publishDate);
  console.log('[Scraper] Summary calculationDate:', calculationDate);

  if (!thermalForecasts || typeof thermalForecasts !== 'object') {
    console.error('[Scraper] Unexpected summary shape. Keys:', Object.keys(summary).join(', '));
    throw new Error('Unexpected getForecastSummary response shape');
  }

  const regionEntries = Array.isArray(thermalForecasts)
    ? thermalForecasts
    : Object.values(thermalForecasts);
  console.log(`[Scraper] Found ${regionEntries.length} regions in summary`);
  for (const e of regionEntries) {
    console.log(`[Scraper]   keys: ${Object.keys(e).join(', ')}`);
    console.log(`[Scraper]   id=${e.id} oneway=${e.oneway}km return=${e.return}km climb=${e.climb}`);
  }

  // 3. For each region, fetch detailed forecast (includes SVG chart)
  console.log('[Scraper] Step 3/3: Fetch per-region detail');
  const regionSummaries = {};
  let successCount = 0;

  for (const entry of regionEntries) {
    const { id: forecastId, oneway, return: returnKm, climb } = entry;
    console.log(`[Scraper] --- Fetching forecastId ${forecastId} ---`);
    try {
      const data = await getForecastData(jwtToken, forecastId);
      const { regionName, textForecast, chart } = data;
      console.log(`[Scraper]   regionName: "${regionName}"`);
      console.log(`[Scraper]   chart length: ${chart?.length ?? 0} chars`);
      console.log(`[Scraper]   textForecast length: ${textForecast?.length ?? 0} chars`);

      if (!regionName) {
        console.warn(`[Scraper]   WARNING: no regionName for forecastId ${forecastId}, skipping`);
        continue;
      }

      const outPath = path.join(OUTPUT_DIR, `${forecastId}_latest.json`);
      await fs.writeFile(
        outPath,
        JSON.stringify(
          { regionName, forecastId, oneway, return: returnKm, climb, textForecast, chart, publishDate, _scrapedAt: new Date().toISOString() },
          null, 2
        )
      );
      console.log(`[Scraper]   Saved: ${outPath}`);

      regionSummaries[regionName] = { forecastId, oneway, return: returnKm, climb };
      successCount++;
    } catch (err) {
      console.error(`[Scraper]   ERROR for forecastId ${forecastId}: ${err.message}`);
      if (err.response) {
        console.error(`[Scraper]   HTTP status: ${err.response.status}`);
        console.error(`[Scraper]   Response body: ${JSON.stringify(err.response.data)}`);
      }
      process.exitCode = 1;
    }
  }

  console.log(`[Scraper] Fetched ${successCount}/${regionEntries.length} regions successfully`);

  // Save lightweight summary (no chart data — used for map shading + tooltips)
  const summaryPath = path.join(OUTPUT_DIR, 'summary_latest.json');
  await fs.writeFile(
    summaryPath,
    JSON.stringify({ publishDate, calculationDate, regions: regionSummaries, _scrapedAt: new Date().toISOString() }, null, 2)
  );
  console.log('[Scraper] Saved summary:', summaryPath);
  console.log('[Scraper] Regions in summary:', Object.keys(regionSummaries).join(', '));
  console.log('[Scraper] ========================================');
  console.log('[Scraper] Done at', new Date().toISOString());
  console.log('[Scraper] ========================================');
}

main().catch((err) => {
  console.error('[Scraper] Fatal error:', err.message);
  process.exit(1);
});
