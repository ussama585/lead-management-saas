const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
await new Promise(r=>socket.onopen=r);let id=0;const pending=new Map();socket.onmessage=e=>{const d=JSON.parse(e.data);if(pending.has(d.id)){pending.get(d.id)(d.result);pending.delete(d.id)}};
const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);socket.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
try{
await evaluate(`(async()=>{await import('/src/assets/styles/data-leads-page.css');await import('/src/assets/styles/company-filter-layout.css');await import('/src/assets/styles/user-management-filters.css');document.querySelector('#width-test')?.remove();const host=document.createElement('div');host.id='width-test';host.style='position:fixed;inset:0;padding:24px;background:white;z-index:9999';host.innerHTML='<details open class="data-leads-ui leads-top-filters-accordion"><summary>Filters</summary><div class="lead-company-date-toolbar lead-company-date-toolbar--compact data-leads-ui data-leads-topbar lead-company-grid-layout"><div class="lead-company-date-toolbar__left"><div class="lead-company-filter"><div class="lead-company-filter__control">Company</div></div><div class="lead-company-project-slot"></div></div><div class="lead-company-date-toolbar__date"></div></div></details>';document.body.append(host)})()`);
for(const userManagement of [false,true])for(const width of [1440,900,600,390]){
await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
const result=await evaluate(`(()=>{const root=document.querySelector('#width-test'),bar=root.querySelector('.data-leads-topbar'),slot=root.querySelector('.lead-company-project-slot'),company=root.querySelector('.lead-company-filter');bar.classList.toggle('company-grid-user-management',${userManagement});slot.innerHTML='';const before=company.getBoundingClientRect().width;slot.innerHTML='<div class="lead-listing-filter-dropdowns"><div id="website-assignee-filter" class="lead-listing-filter-dropdown">Assignee</div></div>';if(bar.classList.contains('company-grid-user-management')){slot.firstElementChild.classList.add('user-management-filter-fields');slot.firstElementChild.setAttribute('data-filter-columns','4')}const after=company.getBoundingClientRect().width;return{before,after}})()`);
console.log(JSON.stringify({userManagement,width,...result}));if(Math.abs(result.before-result.after)>1)throw Error('Company width shifted');
}
await evaluate(`document.querySelector('#width-test').remove()`);
}finally{socket.close()}

