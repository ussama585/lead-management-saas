const pages = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>{socket.onopen=resolve});
let id=0;const pending=new Map();
socket.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){pending.get(data.id)(data.result);pending.delete(data.id)}};
const send=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);socket.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};
try {
 for(const width of [1440,900,600,390]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await new Promise(resolve=>setTimeout(resolve,150));
  const result=await evaluate(`(()=>{const root=document.querySelector('#filter-gap-test'),accordion=root.querySelector('details'),fields=[...root.querySelectorAll('.lead-listing-filter-dropdown, .lead-project-size-filter, .lead-date-range-field')];const box=accordion.getBoundingClientRect();return {widths:fields.map(x=>x.getBoundingClientRect().width),company:root.querySelector('.lead-company-filter').getBoundingClientRect().width,gap:getComputedStyle(root.querySelector('.data-leads-topbar')).gap,overflow:fields.some(x=>x.getBoundingClientRect().right>box.right),radii:[...root.querySelectorAll('[data-slot="select-trigger"]')].map(x=>getComputedStyle(x).borderRadius)}})()`);
  console.log(JSON.stringify({width,...result}));
  if(result.overflow || Math.max(...result.widths)-Math.min(...result.widths)>1 || Math.abs(result.company-result.widths[0])>1)throw Error('Responsive filter layout failed');
 }
 const clear=await evaluate(`(()=>{const b=document.querySelector('#filter-gap-test .lead-date-range-field__clear');b.click();return true})()`);
 await new Promise(resolve=>setTimeout(resolve,100));
 const cleared=await evaluate(`!document.querySelector('#filter-gap-test .lead-date-range-field__clear')`);
 if(!cleared)throw Error('Date clear failed');
 console.log('Date range clear: passed');
}finally{socket.close()}
