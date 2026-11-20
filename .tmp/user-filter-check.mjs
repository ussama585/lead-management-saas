const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>{socket.onopen=resolve});
let id=0;const pending=new Map();
socket.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){pending.get(data.id)(data.result);pending.delete(data.id)}};
const send=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);socket.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
try{
 for(const width of [1440,768,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await new Promise(resolve=>setTimeout(resolve,150));
  const result=await evaluate(`(()=>{const host=document.querySelector('#filter-gap-test'),toolbar=host.querySelector('.data-leads-local-toolbar'),bounds=toolbar.getBoundingClientRect();return {overflow:[...toolbar.querySelectorAll('button')].some(button=>{const r=button.getBoundingClientRect();return r.right>bounds.right+1||r.left<bounds.left-1}),scrollWidth:toolbar.scrollWidth,width:toolbar.clientWidth,selects:[...toolbar.querySelectorAll('[data-slot="select-trigger"]')].map(el=>({width:el.getBoundingClientRect().width,top:el.getBoundingClientRect().top})),createWidth:host.querySelector('.user-management-create-button').getBoundingClientRect().width}})()`);
  console.log(JSON.stringify({viewport:width,...result}));
  if(result.overflow||result.scrollWidth>result.width+1)throw Error('User Management filter overflow');
 }
 await evaluate(`document.querySelector('#filter-gap-test .user-management-create-button').click()`);
 if(!await evaluate('window.userCreateClicked'))throw Error('Create callback failed');
 console.log('Create callback: passed');
}finally{socket.close()}
