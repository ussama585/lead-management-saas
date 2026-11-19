const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>{socket.onopen=resolve});
let id=0;const pending=new Map();
socket.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){pending.get(data.id)(data.result);pending.delete(data.id)}};
const send=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);socket.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
try {
 for(const width of [1440,768,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await new Promise(resolve=>setTimeout(resolve,200));
  const result=await evaluate(`(()=>{const root=document.querySelector('#filter-gap-test'),table=root.querySelector('table'),empty=root.querySelector('.table-empty-value'),select=root.querySelector('[data-slot="select-trigger"]'),header=[...root.querySelectorAll('th')].find(x=>x.innerText.includes('Department')),paper=root.querySelector('.MuiPaper-root');return {headers:[...table.querySelectorAll('thead th')].map(x=>x.innerText.trim()),empty:empty?.innerText,emptyAlign:getComputedStyle(empty.closest('td')).textAlign,zero:[...table.querySelectorAll('tbody td')].some(x=>x.innerText==='0'),selectRadius:getComputedStyle(select).borderRadius,headerAlignment:getComputedStyle(header).textAlign,border:getComputedStyle(paper).borderTopColor,containerFits:root.querySelector('.app-data-table').getBoundingClientRect().right<=root.getBoundingClientRect().right}})()`);
  console.log(JSON.stringify({width,...result}));
  if(result.headers.indexOf('Company')>result.headers.indexOf('Name')||result.empty!=='-'||result.emptyAlign!=='center'||!result.zero||result.selectRadius!=='12px'||result.headerAlignment!=='center'||result.border!=='rgb(211, 211, 211)'||!result.containerFits)throw Error('Global table styling failed');
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 const point=await evaluate(`(()=>{const r=document.querySelector('#filter-gap-test [aria-label="View history"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
 await new Promise(resolve=>setTimeout(resolve,200));
 const hover=await evaluate(`(()=>{const el=document.querySelector('#filter-gap-test [aria-label="View history"]');return {hover:el.matches(':hover'),background:getComputedStyle(el).backgroundColor,transform:getComputedStyle(el).transform}})()`);
 console.log(JSON.stringify(hover));
 if(!hover.hover||hover.transform!=='none'||hover.background!=='rgba(62, 106, 159, 0.1)')throw Error('Icon hover failed');
}finally{socket.close()}
