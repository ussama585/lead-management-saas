const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>{socket.onopen=resolve});
let id=0;const pending=new Map();
socket.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){pending.get(data.id)(data.result);pending.delete(data.id)}};
const send=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);socket.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};
const read=selector=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)}),icon=el.querySelector('.button-flight-icon'),svg=icon?.querySelector('svg'),r=el.getBoundingClientRect(),ir=icon?.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height,panelWidth:ir?.width,panelX:ir?.x,transform:svg?getComputedStyle(svg).transform:null,background:getComputedStyle(el).backgroundImage+getComputedStyle(el).backgroundColor}})()`);
try {
 for(const selector of ['#hover-save','#hover-add','#hover-manage','#hover-disabled']) {
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
  await new Promise(resolve=>setTimeout(resolve,200));
  const before=await read(selector);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.x,y:before.y});
  await new Promise(resolve=>setTimeout(resolve,400));
  const after=await read(selector);
  const stable=['width','height','panelWidth','panelX','transform'].every(key=>before[key]===after[key]);
  const colorCorrect=selector==='#hover-disabled'?before.background===after.background:before.background!==after.background;
  console.log(JSON.stringify({selector,stable,panelWidth:after.panelWidth,colorCorrect}));
  if(!stable||!colorCorrect)throw Error('Button hover failed');
 }
}finally{socket.close()}
