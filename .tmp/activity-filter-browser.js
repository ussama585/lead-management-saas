(async () => {
 const {default:React}=await import('/node_modules/.vite/deps/react.js');
 const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
 const {Select}=await import('/src/components/ui/app-select.jsx');
 const {default:DateField}=await import('/src/components/lead-date-range-field.jsx');
 const {default:Accordion}=await import('/src/components/lead-top-filters-accordion.jsx');
 await import('/src/assets/styles/data-leads-page.css');await import('/src/assets/styles/activity-filters.css');
 document.querySelector('#filter-gap-test')?.remove();
 const host=document.createElement('div');host.id='filter-gap-test';host.style='position:fixed;inset:0;background:white;z-index:99;padding:24px;overflow:auto';document.body.append(host);
 const h=React.createElement;
 const select=(id,label)=>h(Select,{id,style:{width:'100%'},placeholder:label,options:[{value:'test',label:'Example'}],allowClear:true});
 function Demo(){const[date,setDate]=React.useState(true);return h(Accordion,{},h('div',{className:'data-leads-topbar data-leads-ui activity-filter-toolbar'},
  h('div',{className:'activity-company-slot'},h('div',{className:'lead-company-filter company-filter-full-width'},h('div',{className:'lead-company-filter__control'},select('company','Filter by company')))),
  h('div',{className:'lead-listing-filter-dropdowns'},h('div',{className:'lead-listing-filter-dropdown'},select('category','Filter by Category')),h('div',{className:'lead-listing-filter-dropdown'},select('changed-by','Filter by changed by user'))),
  h(DateField,{hasValue:date,onClear:()=>setDate(false)},h('div',{className:'date-range-trigger'},h('span',{className:'date-range-trigger__text'},'Filter by date range')))));}
 ReactDOM.createRoot(host).render(h(Demo));
 await new Promise(resolve=>setTimeout(resolve,250));
 return 'Rendered User Activity filter layout';
})()
