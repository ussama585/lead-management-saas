const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>{socket.onopen=resolve});
let id=0;const pending=new Map();
socket.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){pending.get(data.id)(data.result);pending.delete(data.id)}};
const send=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);socket.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
const read=()=>evaluate(`(()=>{const root=document.querySelector('#filter-gap-test'),a=root.querySelector('.sop-main-header').getBoundingClientRect(),b=root.querySelector('.sop-sidebar-header').getBoundingClientRect();return {top:a.top,height:a.height,bottom:a.bottom,sidebarBottom:b.bottom}})()`);
try{
 for(const width of [1440,900]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await evaluate(`document.querySelector('#filter-gap-test').scrollTop=0`);
  await new Promise(resolve=>setTimeout(resolve,300));
  const before=await read();
  await evaluate(`document.querySelector('#filter-gap-test').scrollTop=500`);
  await new Promise(resolve=>setTimeout(resolve,200));
  const after=await read();
  console.log(JSON.stringify({width,before,after}));
  if(before.height!==after.height||before.top!==after.top||Math.abs(after.bottom-after.sidebarBottom)>1)throw Error('Header scroll alignment failed');
 }
 await evaluate(`document.querySelector('#filter-gap-test [data-slot="sidebar-trigger"]').click()`);
 await new Promise(resolve=>setTimeout(resolve,400));
 console.log(JSON.stringify({collapsed:await read()}));
}finally{socket.close()}
