const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>{socket.onopen=resolve});
let id=0;const pending=new Map();
socket.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){pending.get(data.id)(data.result);pending.delete(data.id)}};
const send=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);socket.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
try{
 for(const width of [1440,768,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await new Promise(resolve=>setTimeout(resolve,200));
  const result=await evaluate(`(()=>{const root=document.querySelector('#filter-gap-test');return {companies:[...root.querySelectorAll('[data-company-kind]')].map(el=>{const c=el.querySelector('.lead-company-filter__control'),t=el.querySelector('[data-slot="select-trigger"] > span'),s=getComputedStyle(c);return {kind:el.dataset.companyKind,height:c.getBoundingClientRect().height,border:s.borderColor,radius:s.borderRadius,color:getComputedStyle(t).color,weight:getComputedStyle(t).fontWeight}}),dates:[...root.querySelectorAll('[data-date-kind]')].map(el=>{const t=el.querySelector('.date-range-trigger'),text=el.querySelector('.date-range-trigger__text'),s=getComputedStyle(t);return {kind:el.dataset.dateKind,fields:el.querySelectorAll('.lead-date-range-field').length,height:t.getBoundingClientRect().height,border:s.borderColor,radius:s.borderRadius,color:getComputedStyle(text).color,weight:getComputedStyle(text).fontWeight,clear:el.querySelectorAll('[aria-label="Clear date range"]').length}})}})()`);
  console.log(JSON.stringify({width,...result}));
  for(const control of [...result.companies,...result.dates])if(control.height!==40||control.radius!=='12px'||control.border!=='rgb(211, 211, 211)'||control.weight!=='600'||control.color!=='rgb(51, 65, 85)')throw Error('Inconsistent controls');
  if(result.dates.some(x=>x.fields!==1||x.clear!==1))throw Error('Duplicate date fields');
 }
 await evaluate(`document.querySelector('[data-date-kind="standalone"] [aria-label="Clear date range"]').click()`);
 await new Promise(resolve=>setTimeout(resolve,100));
 const cleared=await evaluate(`!document.querySelector('#filter-gap-test [aria-label="Clear date range"]')`);
 if(!cleared)throw Error('Date clear failed');
 console.log('Date clear: passed');
}finally{socket.close()}
