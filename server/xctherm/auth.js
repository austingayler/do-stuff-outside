import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const LOGIN_URL = 'https://xctherm.com/en/welcome';
const TOKEN_VALIDITY_MS = 12 * 60 * 60 * 1000; // 12h

/**
 * Full browser-based login using Puppeteer.
 * Credentials read from XCTHERM_EMAIL + XCTHERM_PASSWORD env vars — never hardcoded.
 */
async function loginWithPuppeteer(email, password) {
  console.log('[Auth] Launching headless browser...');
  const execPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (execPath) console.log('[Auth] Using custom executable:', execPath);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: execPath || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });

  let jwtToken = null;

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    );

    // Intercept refresh-token response to capture JWT
    page.on('response', async (response) => {
      if (response.url().includes('/api/accounts/refresh-token') && response.status() === 200) {
        try {
          const data = await response.json();
          if (data.jwtToken) {
            jwtToken = data.jwtToken;
            console.log('[Auth] JWT captured from network response. Length:', jwtToken.length);
          }
        } catch { /* non-JSON */ }
      }
    });

    console.log('[Auth] Navigating to login page...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 45000 });
    console.log('[Auth] Page loaded. Title:', await page.title());

    // Multi-strategy login button click
    console.log('[Auth] Looking for login button...');
    let clicked = false;

    // Strategy 1: known selector
    for (const sel of ['.btn-2 a[href*="loginButtonClick"]', '.btn-2 a', '[href*="loginButtonClick"]']) {
      const el = await page.$(sel);
      if (el) {
        console.log('[Auth] Clicking login button via selector:', sel);
        await el.click();
        clicked = true;
        break;
      }
    }

    // Strategy 2: call JS function directly
    if (!clicked) {
      console.log('[Auth] Trying JS loginButtonClick()...');
      const ok = await page.evaluate(() => {
        if (typeof window.loginButtonClick === 'function') { window.loginButtonClick(); return true; }
        return false;
      });
      if (ok) { clicked = true; console.log('[Auth] loginButtonClick() called via JS'); }
    }

    // Strategy 3: find by text content
    if (!clicked) {
      console.log('[Auth] Searching for login link by text...');
      const handle = await page.evaluateHandle(() => {
        for (const el of document.querySelectorAll('a, button')) {
          if (/^log ?in$/i.test(el.textContent.trim())) return el;
        }
        return null;
      });
      const el = handle.asElement();
      if (el) {
        await el.click();
        clicked = true;
        console.log('[Auth] Clicked login element found by text');
      }
    }

    if (!clicked) {
      // Dump page HTML for debugging before throwing
      const html = await page.content();
      console.error('[Auth] Page HTML snippet:', html.slice(0, 2000));
      throw new Error('Could not find login button on page');
    }

    console.log('[Auth] Waiting for login modal...');
    await page.waitForSelector('.modalWindow', { timeout: 15000 });
    console.log('[Auth] Modal opened');

    const emailInput = await page.$('.modalWindow input[type="text"], .modalWindow input[type="email"]');
    if (!emailInput) throw new Error('Email input not found in modal');
    await emailInput.type(email, { delay: 40 });
    console.log('[Auth] Email entered');

    const passInput = await page.$('.modalWindow input[type="password"]');
    if (!passInput) throw new Error('Password input not found in modal');
    await passInput.type(password, { delay: 40 });
    console.log('[Auth] Password entered');

    const submitBtn = await page.$('.modalWindow button[type="submit"]');
    if (!submitBtn) throw new Error('Submit button not found in modal');

    console.log('[Auth] Submitting login form...');
    await Promise.all([
      submitBtn.click(),
      page.waitForResponse(
        (r) => r.url().includes('/api/accounts/refresh-token'),
        { timeout: 20000 }
      ),
    ]);

    // Brief wait for the response handler to process
    await new Promise((r) => setTimeout(r, 500));

    if (!jwtToken) throw new Error('Form submitted but no JWT was captured in network responses');
    return jwtToken;

  } finally {
    await browser.close();
    console.log('[Auth] Browser closed');
  }
}

/**
 * Return a valid JWT, using a disk cache to avoid logging in on every run.
 */
export async function getAuthToken(tokenCachePath) {
  const email = process.env.XCTHERM_EMAIL;
  const password = process.env.XCTHERM_PASSWORD;
  if (!email || !password) {
    throw new Error('XCTHERM_EMAIL and XCTHERM_PASSWORD environment variables are required');
  }

  if (tokenCachePath) {
    console.log('[Auth] Checking token cache:', tokenCachePath);
    try {
      const raw = await fs.readFile(tokenCachePath, 'utf-8');
      const cached = JSON.parse(raw);
      const remainingMs = (cached.expiresAt || 0) - Date.now();
      const remainingMin = Math.round(remainingMs / 60000);
      console.log('[Auth] Cache found, expires:', new Date(cached.expiresAt).toISOString(), `(${remainingMin} min remaining)`);
      if (remainingMs > 30 * 60 * 1000) {
        console.log('[Auth] Using cached JWT');
        return cached.jwtToken;
      }
      console.log('[Auth] Cache expiring soon, logging in fresh...');
    } catch (err) {
      console.log(err.code === 'ENOENT' ? '[Auth] No cache, logging in fresh...' : `[Auth] Cache unreadable (${err.message}), logging in fresh...`);
    }
  }

  const jwtToken = await loginWithPuppeteer(email, password);
  console.log('[Auth] Login successful');

  if (tokenCachePath) {
    try {
      await fs.mkdir(path.dirname(tokenCachePath), { recursive: true });
      await fs.writeFile(
        tokenCachePath,
        JSON.stringify({ jwtToken, expiresAt: Date.now() + TOKEN_VALIDITY_MS, cachedAt: new Date().toISOString() }, null, 2)
      );
      console.log('[Auth] JWT cached at:', tokenCachePath);
    } catch (err) {
      console.warn('[Auth] Cache write failed (non-fatal):', err.message);
    }
  }

  return jwtToken;
}


const BASE_URL = 'https://xctherm.com';
const TOKEN_VALIDITY_MS = 12 * 60 * 60 * 1000; // 12h conservative; actual JWT may be shorter

/**
 * Exchange the long-lived refreshToken cookie for a short-lived JWT.
 * Reads XCTHERM_REFRESH_TOKEN from env — never hardcoded. No browser required.
 */
async function fetchJwtFromRefreshToken(refreshToken) {
  console.log('[Auth] Calling POST /api/accounts/refresh-token...');
  console.log('[Auth] Refresh token length:', refreshToken.length, 'chars');

  let response;
  try {
    response = await axios.post(
      `${BASE_URL}/api/accounts/refresh-token`,
      {}, // empty body — server reads the token from the Cookie header
      {
        headers: {
          Cookie: `refreshToken=${refreshToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          Origin: BASE_URL,
          Referer: `${BASE_URL}/en/welcome`,
        },
        timeout: 15000,
      }
    );
  } catch (err) {
    const status = err.response?.status;
    const body = JSON.stringify(err.response?.data ?? {});
    throw new Error(`refresh-token request failed: HTTP ${status} — ${body}`);
  }

  console.log('[Auth] Response status:', response.status);
  const keys = Object.keys(response.data || {});
  console.log('[Auth] Response keys:', keys.join(', ') || '(none)');

  const { jwtToken, error: apiError } = response.data;
  console.log('[Auth] jwtToken type:', typeof jwtToken, '| length:', jwtToken?.length ?? 'n/a');
  if (apiError) console.log('[Auth] API error field:', apiError);

  if (!jwtToken) {
    throw new Error(
      `refresh-token returned no JWT. API error: "${apiError ?? 'none'}". ` +
      'The refresh token may be expired — get a fresh one from xctherm.com cookies and update the XCTHERM_REFRESH_TOKEN secret.'
    );
  }
  console.log('[Auth] JWT obtained successfully. Length:', jwtToken.length, 'chars');
  return jwtToken;
}

/**
 * Return a valid JWT, using a disk cache to avoid hitting the endpoint on every run.
 * Pass tokenCachePath=null to skip caching.
 */
export async function getAuthToken(tokenCachePath) {
  const refreshToken = process.env.XCTHERM_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error(
      'XCTHERM_REFRESH_TOKEN env var is required. ' +
      'Get it from xctherm.com: DevTools → Application → Cookies → refreshToken value. ' +
      'Add it as a GitHub repository secret named XCTHERM_REFRESH_TOKEN.'
    );
  }

  if (tokenCachePath) {
    console.log('[Auth] Checking token cache:', tokenCachePath);
    try {
      const raw = await fs.readFile(tokenCachePath, 'utf-8');
      const cached = JSON.parse(raw);
      const remainingMs = (cached.expiresAt || 0) - Date.now();
      const remainingMin = Math.round(remainingMs / 60000);
      console.log('[Auth] Cache found, expires:', new Date(cached.expiresAt).toISOString(), `(${remainingMin} min remaining)`);
      if (remainingMs > 30 * 60 * 1000) {
        console.log('[Auth] Using cached JWT');
        return cached.jwtToken;
      }
      console.log('[Auth] Cache expires soon, fetching fresh JWT...');
    } catch (err) {
      console.log(err.code === 'ENOENT' ? '[Auth] No cache file, fetching fresh JWT...' : `[Auth] Cache read failed (non-fatal): ${err.message}`);
    }
  }

  const jwtToken = await fetchJwtFromRefreshToken(refreshToken);

  if (tokenCachePath) {
    try {
      await fs.mkdir(path.dirname(tokenCachePath), { recursive: true });
      await fs.writeFile(
        tokenCachePath,
        JSON.stringify({ jwtToken, expiresAt: Date.now() + TOKEN_VALIDITY_MS, cachedAt: new Date().toISOString() }, null, 2)
      );
      console.log('[Auth] JWT cached at:', tokenCachePath);
    } catch (err) {
      console.warn('[Auth] Cache write failed (non-fatal):', err.message);
    }
  }

  return jwtToken;
}
