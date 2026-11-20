const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>{socket.onopen=resolve});
let id=0;const pending=new Map();
socket.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){pending.get(data.id)(data.result);pending.delete(data.id)}};
const send=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);socket.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
try{
 for(const width of [1440,900,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await new Promise(resolve=>setTimeout(resolve,200));
  const results=await evaluate(`(()=>{const root=document.querySelector('#filter-gap-test'),main=root.querySelector('main'),header=root.querySelector('.sop-main-header');root.scrollTop=0;return Object.entries(window.pageGapFixtures).map(([section,html])=>{main.innerHTML=html;return {section,gap:main.querySelector('[data-gap-target]').getBoundingClientRect().top-header.getBoundingClientRect().bottom,padding:parseFloat(getComputedStyle(main).paddingTop)}})})()`);
  console.log(JSON.stringify({width,results}));
  if(results.some(result=>Math.abs(result.gap-result.padding)>1))throw Error('Inconsistent header-to-page spacing');
 }
}finally{socket.close()}
