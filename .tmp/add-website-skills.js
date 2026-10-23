(async()=>{
 const pause=()=>new Promise(r=>setTimeout(r,450));
 const open=e=>e.closest('.ant-select').querySelector('.ant-select-selector').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));
 for(const name of ['Django','PostgreSQL','REST APIs']) {
  {
   open(document.getElementById('rc_select_15'));await pause();
   const input=document.getElementById('rc_select_15');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,name);input.dispatchEvent(new Event('input',{bubbles:true}));await pause();
   const opt=[...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')].find(e=>e.title===name);
   if(!opt)throw Error('Missing skill '+name);opt.click();await pause();
  }
  const modal=document.querySelector('.ant-modal-wrap:not([style*="display: none"]) .ant-modal');
  open(modal.querySelector('input'));await pause();
  const opts=[...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')];
  const exp=opts.find(e=>e.innerText.trim()==='3 Years');if(!exp)throw Error(opts.map(e=>e.innerText).join(','));exp.click();await pause();
  [...modal.querySelectorAll('button')].find(e=>e.innerText==='Done').click();await pause();await pause();
 }
 return document.body.innerText.slice(-1600);
})()
