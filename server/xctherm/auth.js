import fs from 'node:fs/promises';
import path from 'node:path';
import axios from 'axios';

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

  const { jwtToken } = response.data;
  if (!jwtToken) {
    throw new Error(
      `refresh-token response had no jwtToken. Keys present: ${keys.join(', ')}`
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
