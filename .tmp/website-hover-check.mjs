const pages = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const socket = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => { socket.onopen = resolve; });
let id=0; const pending=new Map();
socket.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){pending.get(data.id)(data.result);pending.delete(data.id)}};
const send=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);socket.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true})).result.value;
try {
 for(const selector of ['#manage-hover-test','[aria-label="Follow Ups"]','[aria-label="History"]']) {
   const point=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
   await new Promise(resolve=>setTimeout(resolve,300));
   const result=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(el);return {hover:el.matches(':hover'),background:s.backgroundColor,transform:s.transform,animation:s.animationName,hands:el.querySelector('.animated-follow-up-icon__hands')?getComputedStyle(el.querySelector('.animated-follow-up-icon__hands')).stroke:null}})()`);
   console.log(JSON.stringify({selector,...result}));
   if(!result.hover || result.transform!=='none')throw Error('Hover check failed');
 }
} finally {socket.close()}
