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

    // Multi-strategy login button click — use JS .click() to bypass visibility checks
    console.log('[Auth] Looking for login button...');
    let clicked = false;

    // Strategy 1: known selectors, JS click bypasses viewport/visibility constraints
    for (const sel of ['.btn-2 a[href*="loginButtonClick"]', '.btn-2 a', '[href*="loginButtonClick"]']) {
      const el = await page.$(sel);
      if (el) {
        console.log('[Auth] Found login button via selector:', sel, '— clicking via JS...');
        await el.evaluate((node) => node.click());
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

    // Strategy 3: find by text content, JS click
    if (!clicked) {
      console.log('[Auth] Searching for login link by text...');
      clicked = await page.evaluate(() => {
        for (const el of document.querySelectorAll('a, button')) {
          if (/^log ?in$/i.test(el.textContent.trim())) { el.click(); return true; }
        }
        return false;
      });
      if (clicked) console.log('[Auth] Clicked login element found by text');
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
      submitBtn.evaluate((el) => el.click()),
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
