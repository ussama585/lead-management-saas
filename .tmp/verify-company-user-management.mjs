import { writeFile } from 'node:fs/promises';
const targets = await fetch('http://127.0.0.1:9222/json/list').then(r => r.json());
const socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let seq = 0;
const pending = new Map();
const responses = [];
let loginResponse;
let verifiedResponse;
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
socket.onmessage = async event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) { const job = pending.get(message.id); pending.delete(message.id); message.error ? job.reject(new Error(message.error.message)) : job.resolve(message.result); }
  if (message.method === 'Network.responseReceived') {
    const { requestId, response } = message.params;
    if (/\/(accounts\/login|accounts\/validate-otp|company\/users\/|accounts\/all-users|accounts\/users-count)/.test(response.url)) responses.push({ requestId, url: response.url, status: response.status });
  }
  if (message.method === 'Network.loadingFinished') {
    const entry = responses.find(r => r.requestId === message.params.requestId);
    if (!entry) return;
    try {
      const raw = await send('Network.getResponseBody', { requestId: entry.requestId });
      const body = JSON.parse(raw.body);
      if (entry.url.endsWith('/accounts/login')) loginResponse = body;
      else if (entry.url.endsWith('/accounts/validate-otp')) verifiedResponse = body;
      else { entry.count = body.count; entry.rows = body.results?.length; entry.message = body.message || body.detail; }
    } catch { /* Preflight and non-JSON responses carry no listing data. */ }
  }
};
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result?.value;
};
const wait = async (check, label) => {
  for (let attempt = 0; attempt < 90; attempt++) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 500)); }
  throw new Error('Timed out waiting for ' + label);
};
try {
  await send('Network.enable');
  await wait(() => evaluate('Boolean(document.querySelector("input[name=email]"))'), 'login form');
  const credentials = { email: process.env.TEST_LOGIN_EMAIL, password: process.env.TEST_LOGIN_PASSWORD };
  if (!credentials.email || !credentials.password) throw new Error('Missing supplied login credentials');
  await evaluate(`(() => {const values=${JSON.stringify(credentials)}; const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set; for(const [name,value] of Object.entries(values)){const field=document.querySelector('input[name="'+name+'"]');set.call(field,value);field.dispatchEvent(new Event("input",{bubbles:true}));} return true;})()`);
  await evaluate('document.querySelector("form").requestSubmit()');
  await wait(() => Boolean(loginResponse), 'login API response');
  const otp = loginResponse.data?.otp || loginResponse.otp;
  if (!otp) throw new Error('Login API did not return OTP: ' + (loginResponse.message || 'no message'));
  await wait(() => evaluate('document.querySelectorAll("[role=dialog] input").length === 6'), 'OTP modal');
  for (let index = 0; index < String(otp).length; index++) {
    await evaluate(`(() => {const field=document.querySelectorAll("[role=dialog] input")[${index}];Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(field,${JSON.stringify(String(otp)[index])});field.dispatchEvent(new Event("input",{bubbles:true}));return true;})()`);
  }
  await evaluate('document.querySelector("[role=dialog] form").requestSubmit()');
  await wait(() => Boolean(verifiedResponse), 'OTP verification');
  const session = verifiedResponse.data ?? verifiedResponse;
  const account = session.user ?? session;
  console.log(JSON.stringify({ event: 'verified-account', role: account.user_type, company_id: account.company_id, company: account.company, responseKeys: Object.keys(account).filter(k => !/token|access|refresh|otp/i.test(k)) }));
  await wait(() => evaluate('location.pathname.startsWith("/company-admin")'), 'company admin dashboard');
  await evaluate('(() => {const button=[...document.querySelectorAll("[data-slot=sidebar-menu-button]")].find(e=>e.textContent.trim()==="User Management");if(!button)throw Error("User Management menu missing");button.click();return true;})()');
  await wait(() => evaluate('location.pathname.includes("user-management")'), 'User Management navigation');
  await new Promise(resolve => setTimeout(resolve, 10000));
  console.log(JSON.stringify({ event: 'listing-requests', requests: responses.filter(r => !/\/accounts\/(login|validate-otp)$/.test(r.url)).map(({ requestId, ...safe }) => safe) }));
  console.log(JSON.stringify({ event: 'page', ...await evaluate('({path:location.pathname,text:document.querySelector("main")?.innerText.slice(0,8000),storedCompany:(()=>{const u=JSON.parse(localStorage.getItem("user"));return {company_id:u.company_id,company:u.company}})()})') }));
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile('.tmp/company-admin-user-management-check.png', Buffer.from(screenshot.data, 'base64'));
} finally {
  socket.close();
}
