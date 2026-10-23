import { readFile, writeFile } from 'node:fs/promises';
const pages = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = pages.find(page => page.type === 'page');
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let seq = 0;
const pending = new Map();
socket.onmessage = event => { const data = JSON.parse(event.data); if (data.id && pending.has(data.id)) {
  const { resolve, reject } = pending.get(data.id); pending.delete(data.id); data.error ? reject(new Error(data.error.message)) : resolve(data.result);
} };
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result?.value;
};
try {
  const command = process.argv[2];
  if (command === 'navigate') console.log(await send('Page.navigate', { url: process.argv[3] }));
  if (command === 'viewport') console.log(await send('Emulation.setDeviceMetricsOverride', { width: Number(process.argv[3]), height: Number(process.argv[4]), deviceScaleFactor: 1, mobile: false }));
  if (command === 'layout') {
    await send('Emulation.setDeviceMetricsOverride', { width: Number(process.argv[3]), height: Number(process.argv[4]), deviceScaleFactor: 1, mobile: true });
    await evaluate('new Promise(resolve => setTimeout(resolve, 500))');
    console.log(JSON.stringify(await evaluate(`({viewport:document.documentElement.clientWidth,documentWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main *')].filter(el=>el.getBoundingClientRect().right>document.documentElement.clientWidth+1&&el.getBoundingClientRect().width>0).slice(0,8).map(el=>({tag:el.tagName,id:el.id,right:el.getBoundingClientRect().right}))})`)));
    if (process.argv[5]) { const result = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(process.argv[5], Buffer.from(result.data, 'base64')); }
  }
  if (command === 'close') console.log(await send('Browser.close'));
  if (command === 'inspect') console.log(JSON.stringify(await evaluate(`({url:location.href,text:document.body.innerText.slice(0,14000),inputs:[...document.querySelectorAll('input,textarea,select')].map(el=>({tag:el.tagName,id:el.id,name:el.name,type:el.type,placeholder:el.placeholder,value:el.type==='password'?'[hidden]':el.value})),buttons:[...document.querySelectorAll('button')].map(el=>({text:el.innerText,label:el.getAttribute('aria-label')}))})`), null, 2));
  if (command === 'evaluate') console.log(JSON.stringify(await evaluate(process.argv[3]), null, 2));
  if (command === 'run') console.log(JSON.stringify(await evaluate(await readFile(process.argv[3], 'utf8')), null, 2));
  if (command === 'login') {
    const credentials = { email: process.env.TEST_LOGIN_EMAIL, password: process.env.TEST_LOGIN_PASSWORD };
    if (!credentials.email || !credentials.password) throw new Error('Missing test credentials');
    console.log(await evaluate(`(()=>{ const credentials=${JSON.stringify(credentials)}; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; for(const [name,value] of Object.entries(credentials)){ const input=document.querySelector('input[name="'+name+'"]'); if(!input) throw Error('Missing input '+name); setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true})); } document.querySelector('form').requestSubmit();return 'Submitted login';})()`));
  }
  if (command === 'screenshot') {
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(process.argv[3], Buffer.from(result.data, 'base64')); console.log('Screenshot saved');
  }
} finally { socket.close(); }
