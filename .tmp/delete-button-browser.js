(async () => {
 const {default:React}=await import('/node_modules/.vite/deps/react.js');
 const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
 const {default:Modal}=await import('/src/components/settings-delete-modal.jsx');
 document.querySelector('#filter-gap-test')?.remove();
 const host=document.createElement('div');host.id='filter-gap-test';document.body.append(host);
 const h=React.createElement;
 function Demo(){const[pending,setPending]=React.useState(false);return h(Modal,{title:'Delete test item',itemName:'Example',open:true,loading:pending,onConfirm:()=>setPending(true),onCancel:()=>{}})}
 ReactDOM.createRoot(host).render(h(Demo));
 await new Promise(resolve=>setTimeout(resolve,300));
 const read=()=>Object.fromEntries([...document.querySelectorAll('[role="dialog"] button')].filter(el=>['Cancel','Delete'].includes(el.textContent.trim())).map(el=>{const r=el.getBoundingClientRect();return [el.textContent.trim(),{width:r.width,height:r.height,flight:el.classList.contains('button-flight'),disabled:el.disabled,background:getComputedStyle(el).backgroundImage}]}));
 const before=read();
 [...document.querySelectorAll('[role="dialog"] button')].find(el=>el.textContent.trim()==='Delete').click();
 await new Promise(resolve=>setTimeout(resolve,100));
 const after=read();
 for(const label of ['Cancel','Delete']){
  if(!after[label].disabled||!after[label].flight||after[label].width!==before[label].width||after[label].height!==before[label].height||after[label].background!==before[label].background)throw Error('Button UI changed during deletion');
 }
 return {before,after,spinner:Boolean(document.querySelector('[role="dialog"] .animate-spin'))};
})()
