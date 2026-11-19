const pages = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const socket = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => { socket.onopen = resolve; });
let id = 0;
const pending = new Map();
socket.onmessage = event => { const data = JSON.parse(event.data); if (pending.has(data.id)) { pending.get(data.id)(data.result); pending.delete(data.id); } };
const send = (method, params = {}) => new Promise(resolve => { pending.set(++id, resolve); socket.send(JSON.stringify({id,method,params})); });
const evaluate = async expression => (await send('Runtime.evaluate', {expression, returnByValue:true})).result.value;
try {
  for (const width of [1440, 768, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {width,height:900,deviceScaleFactor:1,mobile:false});
    const points = await evaluate(`[...document.querySelectorAll('#filter-gap-test [aria-label="Clear selection"]')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})`);
    for (const point of points) {
      await send('Input.dispatchMouseEvent', {type:'mouseMoved',...point});
      await new Promise(resolve => setTimeout(resolve, 300));
      const result = await evaluate(`(()=>{const c=document.querySelector('#filter-gap-test [aria-label="Clear selection"]:hover');const a=c.parentElement.querySelector('.lucide-chevron-down');return {hover:c.matches(':hover'),gap:c.getBoundingClientRect().left-a.getBoundingClientRect().right,background:getComputedStyle(c).backgroundColor}})()`);
      console.log(JSON.stringify({width,...result}));
      if (!result || result.gap < 8) throw Error('Clear hover overlaps arrow');
    }
  }
} finally { socket.close(); }
