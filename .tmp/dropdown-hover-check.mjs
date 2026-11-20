const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();const socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>{socket.onopen=resolve});let id=0;const pending=new Map();socket.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){pending.get(data.id)(data.result);pending.delete(data.id)}};const send=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);socket.send(JSON.stringify({id,method,params}))});const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true})).result.value;
try{
 for(let index=0;index<3;index++){
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await new Promise(resolve=>setTimeout(resolve,200));
  const before=await evaluate(`(()=>{const el=document.querySelectorAll('#filter-gap-test button')[${index}],r=el.getBoundingClientRect();return {background:getComputedStyle(el).backgroundColor,x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.x,y:before.y});await new Promise(resolve=>setTimeout(resolve,300));
  const after=await evaluate(`getComputedStyle(document.querySelectorAll('#filter-gap-test button')[${index}]).backgroundColor`);
  console.log(JSON.stringify({index,before:before.background,after}));if(before.background!==after)throw Error('Dropdown hover background changed');
 }
}finally{socket.close()}
