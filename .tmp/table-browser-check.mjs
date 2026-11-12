import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire('C:/Users/Search O Pal/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/package.json');
const { chromium } = require('playwright');
const role = process.env.TABLE_QA_ROLE;
const base = 'https://saas-lead-generations.vercel.app/api';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const results = [];
try {
  const response = await context.request.post(`${base}/accounts/${role === 'super_admin' ? 'superuser/login' : 'login'}`, {
    multipart: { email: process.env.TABLE_QA_EMAIL, password: process.env.TABLE_QA_PASSWORD },
  });
  const challenge = await response.json();
  function findOtp(obj) {
    if (!obj || typeof obj !== 'object') return null;
    for (const [key, value] of Object.entries(obj)) {
      if (/otp|code/i.test(key) && /^\d{6}$/.test(String(value))) return String(value);
      if (value && typeof value === 'object') { const found = findOtp(value); if (found) return found; }
    }
    return null;
  }
  const otp = findOtp(challenge);
  if (!response.ok() || !otp) {
    console.log(JSON.stringify({ stage: 'login', role, httpStatus: response.status(), otpReturned: Boolean(otp), responseKeys: Object.keys(challenge) }));
    process.exitCode = 2;
  } else {
    const verified = await context.request.post(`${base}/accounts/validate-otp`, { multipart: { email: process.env.TABLE_QA_EMAIL, otp } });
    const payload = await verified.json();
    const session = payload.data ?? payload;
    const account = session.user ?? session;
    const access = session.access ?? payload.access;
    const refresh = session.refresh ?? payload.refresh;
    if (!verified.ok() || !access || !refresh) throw new Error('OTP verification did not return a usable session');
    await context.addInitScript(({ account, access, refresh }) => {
      localStorage.setItem('user', JSON.stringify(account));
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }, { account, access, refresh });
    const page = await context.newPage();
    await page.route('**/api/**', route => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.abort();
      return route.continue();
    });
    const prefix = role === 'super_admin' ? '/super-admin' : '/company-admin';
    const routes = ['user-management', ...(role === 'super_admin' ? ['companies'] : []), 'leads', 'data-leads', 'meta-leads', 'settings'];
    mkdirSync('.tmp/table-qa', { recursive: true });
    for (const route of routes) {
      const errors = [];
      const listener = error => errors.push(error.message);
      page.on('pageerror', listener);
      await page.goto(`http://127.0.0.1:5173${prefix}/${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      const tables = page.locator('.app-data-table');
      const tableCount = await tables.count();
      const headers = tableCount ? await tables.first().locator('thead th').allTextContents() : [];
      const interactions = [];
      if (route === 'companies') {
        const requests = [];
        const record = request => { if (request.url().includes('/companies') && request.method() === 'GET') requests.push(new URL(request.url()).search); };
        page.on('request', record);
        const sort = tables.first().locator('thead th').filter({ hasText: 'Company' }).getByRole('button').first();
        if (await sort.count()) { await sort.click(); await page.waitForTimeout(1200); interactions.push({ sortingRequests: [...requests] }); }
        await page.getByRole('textbox', { name: 'Search companies' }).fill('Search');
        await page.getByRole('textbox', { name: 'Search companies' }).press('Enter');
        await page.waitForTimeout(1200);
        interactions.push({ searchRequests: [...requests] });
        page.off('request', record);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(200);
      interactions.push({ mobileTableVisible: tableCount ? await tables.first().isVisible() : null });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({ path: `.tmp/table-qa/${role}-${route}.png`, fullPage: false });
      results.push({ route, tableCount, headers, interactions, errors });
      page.off('pageerror', listener);
    }
    writeFileSync(`.tmp/table-qa/${role}-results.json`, JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ role, results }));
  }
} finally { await browser.close(); }
