(async () => {
  const { default: React } = await import('/node_modules/.vite/deps/react.js');
  const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
  const { default: Filters } = await import('/src/components/lead-listing-dropdown-filters.jsx');
  const { default: Project } = await import('/src/components/lead-project-size-filter.jsx');
  const { default: DateField } = await import('/src/components/lead-date-range-field.jsx');
  const { Select } = await import('/src/components/ui/app-select.jsx');
  await import('/src/assets/styles/lead-listing-filters.css');
  await import('/src/assets/styles/data-leads-page.css'); await import('/src/assets/styles/sales-data-filters.css');
  document.querySelector('#filter-gap-test')?.remove();
  const host = document.createElement('div');
  host.id = 'filter-gap-test';
  host.style = 'position:fixed;inset:0;background:white;z-index:50;padding:24px;overflow:auto';
  document.body.append(host);
  const h = React.createElement;
  function Demo() {
    const [assignee, setAssignee] = React.useState('1');
    const [status, setStatus] = React.useState('Pending');
    const [project, setProject] = React.useState('Small');
    const [date, setDate] = React.useState(true);
    return h('details', {open:true,className:'data-leads-ui leads-top-filters-accordion'},
      h('summary',{},'Filters'),
      h('div',{className:'lead-company-date-toolbar lead-company-date-toolbar--compact data-leads-ui data-leads-topbar sales-data-filter-toolbar','data-filter-columns':3},
        h('div',{className:'lead-company-date-toolbar__left'},
          h('div',{className:'lead-company-filter'},h('div',{className:'lead-company-filter__control'},
            h(Select,{id:'parity-company',style:{width:'100%'},value:'company',allowClear:true,options:[{value:'company',label:'Example Company'}]}))),
          h('div',{className:'lead-company-project-slot'},
            h(Filters,{executives:[{id:1,name:'Example Executive',user_type:'sales_executive'}],selectedExecutive:assignee,onExecutiveChange:setAssignee,status,onStatusChange:setStatus,statuses:[{value:'Pending',label:'Pending'}]}),
            null)),
        h('div',{className:'lead-filter-toolbar lead-company-date-toolbar__date'},h(DateField,{hasValue:date,onClear:()=>setDate(false)},
          h('div',{className:'date-range-trigger'},h('span',{className:'date-range-trigger__text'},date ? '19th Nov, 2026 - 30th Nov, 2026' : 'Filter by date range'),h('i',{className:'fa fa-chevron-down ms-2'}))))));
  }
  ReactDOM.createRoot(host).render(h(Demo));
  await new Promise(resolve => setTimeout(resolve,300));
  return 'Rendered shared Meta/Data filter components';
})()
