(async () => {
 const {default:React}=await import('/node_modules/.vite/deps/react.js');
 const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
 const {default:Table}=await import('/src/components/tables/new-table.jsx?pill-row-check=4');
 const antd=await import('/node_modules/.vite/deps/antd.js');const Tag=antd.Tag||antd.default.Tag;
 const {Badge}=await import('/src/components/ui/badge.jsx');
 const {default:StatusBadge}=await import('/src/pages/clients/components/StatusBadge.jsx');
 document.querySelector('#filter-gap-test')?.remove();
 const host=document.createElement('div');host.id='filter-gap-test';host.style='position:fixed;inset:0;z-index:99;background:white;padding:24px;overflow:auto';document.body.append(host);
 const h=React.createElement;
 const columns=[
  {header:'Status',accessorKey:'status',Cell:()=>h('span',{style:{backgroundColor:'#dcfce7',color:'#15803d',padding:'2px 8px',borderRadius:4}},'Active')},
  {header:'Source',accessorKey:'source',Cell:()=>h(Tag,{color:'blue'},'Website')},
  {header:'Badge',accessorKey:'badge',Cell:()=>h(Badge,{style:{backgroundColor:'#fef3c7',color:'#92400e'}},'Pending')},
  {header:'Client Status',accessorKey:'client_status',Cell:()=>h(StatusBadge,{status:'Active',statusColors:{Active:'#15803d'}})},
 ];
 ReactDOM.createRoot(host).render(h(Table,{heading:'Pill verification',columns,data:[{id:1,status:'Active',source:'Website',badge:'Pending',client_status:'Active'}],totalCount:1,enableRowSelection:false}));
 await new Promise(resolve=>setTimeout(resolve,400));
 const pills=[...host.querySelectorAll('tbody :is(.table-value-pill,.ant-tag,[data-slot="badge"])')].map(el=>{const s=getComputedStyle(el);return {text:el.textContent,padding:s.padding,radius:s.borderRadius,color:s.color,background:s.backgroundColor}});
 const cells=[...host.querySelectorAll('tbody td')].map(el=>({height:el.getBoundingClientRect().height,padding:getComputedStyle(el).padding}));
 if(pills.length!==4||pills.some(p=>p.padding!=='6px 12px'||p.radius!=='8px'))throw Error('Pill dimensions do not match');
 if(pills[0].color!=='rgb(21, 128, 61)'||pills[0].background!=='rgb(220, 252, 231)'||pills[2].color!=='rgb(146, 64, 14)'||pills[2].background!=='rgb(254, 243, 199)')throw Error('Pill colors changed');
 if(cells.some(cell=>cell.height>72.5))throw Error('Rows were not reduced');
 return {pills,cells};
})()
