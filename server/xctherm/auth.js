import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';

const LOGIN_URL = 'https://xctherm.com/en/welcome';
const TOKEN_VALIDITY_DAYS = 7;

/**
 * Authenticate with xctherm.com using Puppeteer.
 * Credentials are read exclusively from environment variables — never hardcoded.
 * Returns a bearer token for use with the xctherm API.
 */
export async function getAuthToken(tokenCachePath) {
  const email = process.env.XCTHERM_EMAIL;
  const password = process.env.XCTHERM_PASSWORD;

  if (!email || !password) {
    throw new Error('XCTHERM_EMAIL and XCTHERM_PASSWORD environment variables are required');
  }

  // Try cached token first
  if (tokenCachePath) {
    try {
      const data = await fs.readFile(tokenCachePath, 'utf-8');
      const cached = JSON.parse(data);
      if (cached.expiresAt && cached.expiresAt > Date.now() + 60 * 60 * 1000) {
        console.log('[Auth] Using cached token, expires:', new Date(cached.expiresAt).toISOString());
        return cached.jwtToken;
      }
      console.log('[Auth] Cached token expired, re-authenticating...');
    } catch {
      // No cache or unreadable — proceed to login
    }
  }

  console.log('[Auth] Starting browser-based login...');
  let browser;
  let jwtToken = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0'
    );

    // Intercept the refresh-token response to capture the JWT
    page.on('response', async (response) => {
      if (
        response.url().includes('/api/accounts/refresh-token') &&
        response.status() === 200
      ) {
        try {
          const data = await response.json();
          if (data.jwtToken) {
            jwtToken = data.jwtToken;
            console.log('[Auth] JWT token captured');
          }
        } catch {
          // Non-JSON response
        }
      }
    });

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Click the login button (try multiple selectors)
    let opened = false;
    for (const selector of [
      '.btn-2 a[href*="loginButtonClick"]',
      '.btn-2 a',
    ]) {
      const btn = await page.$(selector);
      if (btn) {
        await btn.click();
        opened = true;
        break;
      }
    }
    if (!opened) {
      // Fall back to finding any "Login" text link or button
      const handle = await page.evaluateHandle(() => {
        const all = [...document.querySelectorAll('a, button')];
        return all.find(el => /^log ?in$/i.test(el.textContent.trim())) || null;
      });
      if (handle.asElement()) {
        await handle.asElement().click();
      } else {
        throw new Error('Could not find login button on the page');
      }
    }

    await page.waitForSelector('.modalWindow', { timeout: 10000 });

    const emailInput = await page.$('.modalWindow input[type="text"]');
    if (!emailInput) throw new Error('Email input not found');
    await emailInput.type(email, { delay: 50 });

    const passwordInput = await page.$('.modalWindow input[type="password"]');
    if (!passwordInput) throw new Error('Password input not found');
    await passwordInput.type(password, { delay: 50 });

    const submitBtn = await page.$('.modalWindow button[type="submit"]');
    if (!submitBtn) throw new Error('Submit button not found');

    await Promise.all([
      submitBtn.click(),
      page.waitForResponse(
        (r) => r.url().includes('/api/accounts/refresh-token'),
        { timeout: 15000 }
      ),
    ]);

    await new Promise((r) => setTimeout(r, 1000));

    if (!jwtToken) {
      throw new Error('Login completed but no JWT token was captured');
    }

    // Persist token cache if a path was provided
    if (tokenCachePath) {
      const expiresAt = Date.now() + TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
      try {
        await fs.mkdir(path.dirname(tokenCachePath), { recursive: true });
        await fs.writeFile(
          tokenCachePath,
          JSON.stringify({ jwtToken, expiresAt, createdAt: Date.now() }, null, 2)
        );
        console.log('[Auth] Token cached successfully');
      } catch {
        // Cache failure is non-fatal
      }
    }

    console.log('[Auth] Login successful');
    return jwtToken;
  } finally {
    if (browser) await browser.close();
  }
}
