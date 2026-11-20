(async()=>{
 const{default:React}=await import('/node_modules/.vite/deps/react.js');
 const{default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
 const{Select}=await import('/src/components/ui/app-select.jsx');
 const{default:SalesSelect}=await import('/src/pages/sales-executive/sales-data-select.jsx');
 const native=await import('/src/components/ui/select.jsx');
 document.querySelector('#filter-gap-test')?.remove();const host=document.createElement('div');host.id='filter-gap-test';host.style='position:fixed;inset:0;z-index:99;background:white;padding:24px;display:flex;flex-direction:column;gap:24px';document.body.append(host);
 const h=React.createElement;
 ReactDOM.createRoot(host).render(h(React.Fragment,{},h(Select,{placeholder:'Shared dropdown',options:[],style:{width:240}}),h('div',{style:{width:240}},h(SalesSelect,{placeholder:'Sales dropdown',options:[]})),h(native.Select,{},h(native.SelectTrigger,{style:{width:240}},h(native.SelectValue,{placeholder:'Native dropdown'})))));
 await new Promise(resolve=>setTimeout(resolve,200));return 'Rendered dropdown variants';
})()
