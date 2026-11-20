(async () => {
  const { default: React } = await import('/node_modules/.vite/deps/react.js');
  const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
  const { default: DateRange } = await import('/src/components/bootstrap-date-range-modal.component.jsx');
  const modalSource = await (await fetch('/src/components/bootstrap-date-range-modal.component.jsx')).text();
  const fieldPath = modalSource.match(/from "(\/src\/components\/lead-date-range-field\.jsx[^"]*)"/)[1];
  const { default: DateField } = await import(fieldPath);
  const { Select } = await import('/src/components/ui/app-select.jsx');
  const { default: dayjs } = await import('/node_modules/.vite/deps/dayjs.js');
  await import('/src/assets/styles/data-leads-page.css');
  await import('/src/assets/styles/listing-filter-controls.css');
  document.querySelector('#filter-gap-test')?.remove();
  const host = document.createElement('div'); host.id='filter-gap-test';host.style='position:fixed;inset:0;background:white;z-index:99;padding:24px;overflow:auto';document.body.append(host);
  const h=React.createElement;
  function Demo() {
    const [dates,setDates]=React.useState([dayjs('2026-11-01'),dayjs('2026-11-20')]);
    const [show,setShow]=React.useState(false);
    const company=kind=>h('div',{key:kind,'data-company-kind':kind,className:'lead-company-filter company-filter-standalone'},h('label',{},'Company'),
      h('div',{className:'lead-company-filter__control'},h(Select,{value:'company',style:{width:'100%'},options:[{value:'company',label:'Example Company'}],allowClear:true})));
    const date=key=>h(DateRange,{key,value:dates,showModal:show,setShowModal:setShow,onDone:setDates});
    return h('div',{style:{display:'flex',flexWrap:'wrap',gap:24}},
      h('section',{},h('h2',{},'Shared company filter'),company('standalone')),
      h('section',{className:'user-activity-filter-panel'},h('h2',{},'Activity company filter'),company('activity')),
      h('section',{},h('h2',{},'Standalone date filter'),h('div',{'data-date-kind':'standalone'},date('standalone'))),
      h('section',{},h('h2',{},'Wrapped date filter'),h('div',{'data-date-kind':'wrapped'},h(DateField,{hasValue:Boolean(dates),onClear:()=>setDates(null)},date('wrapped')))),
      h('section',{className:'data-leads-ui data-leads-local-toolbar',style:{width:300,maxWidth:'100%'}},h('div',{className:'lead-listing-filter-dropdowns'}),company('lead')));
  }
  ReactDOM.createRoot(host).render(h(Demo));
  await new Promise(resolve=>setTimeout(resolve,300));
  return 'Rendered company and date filters in standalone and lead contexts';
})()
