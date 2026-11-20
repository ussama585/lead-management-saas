const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>{socket.onopen=resolve});
let id=0;const pending=new Map();
socket.onmessage=event=>{const data=JSON.parse(event.data);if(pending.has(data.id)){pending.get(data.id)(data.result);pending.delete(data.id)}};
const send=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);socket.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
try{
 for(const width of [280,320,375,390,768]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
  await new Promise(resolve=>setTimeout(resolve,200));
  const result=await evaluate(`(()=>{const modal=document.querySelector('.otp-verification-dialog'),r=modal.getBoundingClientRect(),inputs=[...modal.querySelectorAll('input')];return {width:modal.clientWidth,scrollWidth:modal.scrollWidth,height:modal.clientHeight,scrollHeight:modal.scrollHeight,insideViewport:r.left>=0&&r.right<=innerWidth,inputs:inputs.map(el=>({width:el.getBoundingClientRect().width,inside:el.getBoundingClientRect().left>=r.left&&el.getBoundingClientRect().right<=r.right})),buttonInside:modal.querySelector('button[type="submit"]').getBoundingClientRect().right<=r.right}})()`);
  console.log(JSON.stringify({viewport:width,...result}));
  if(result.scrollWidth>result.width+1||result.scrollHeight>result.height+1||!result.insideViewport||!result.buttonInside||result.inputs.length!==6||result.inputs.some(x=>!x.inside))throw Error('OTP modal overflow');
 }
 const point=await evaluate(`(()=>{const r=document.querySelector('.otp-verification-dialog input').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
 await send('Input.insertText',{text:'123456'});
 const entered=await evaluate(`({digits:[...document.querySelectorAll('.otp-verification-dialog input')].map(el=>el.value).join(''),canVerify:!document.querySelector('.otp-verification-dialog button[type="submit"]').disabled})`);
 console.log(JSON.stringify(entered));
 if(entered.digits!=='123456'||!entered.canVerify)throw Error('OTP entry failed');
}finally{socket.close()}
