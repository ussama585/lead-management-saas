(async () => {
  const { default: React } = await import('/node_modules/.vite/deps/react.js');
  const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
  const { default: Table } = await import('/src/components/tables/new-table.jsx');
  const adapterSource = await (await fetch('/src/components/tables/inline-select-columns.jsx')).text();
  const selectPath = adapterSource.match(/from "(\/src\/components\/ui\/app-select\.jsx[^"]*)"/)[1];
  const { Select } = await import(selectPath);
  const { default: Icon } = await import('/src/components/animated-follow-up-icon.jsx');
  document.querySelector('#filter-gap-test')?.remove();
  const host = document.createElement('div'); host.id='filter-gap-test';
  host.style='position:fixed;inset:0;background:white;z-index:50;padding:24px;overflow:auto'; document.body.append(host);
  const h=React.createElement;
  function Demo() {
    const [department,setDepartment]=React.useState('sales');
    const columns=[{header:'Name',accessorKey:'full_name'}, {header:'Company',accessorKey:'company_name'},
      {header:'Department',accessorKey:'department',Cell:()=>h(Select,{value:department,onChange:setDepartment,options:[{value:'sales',label:'Sales'},{value:'support',label:'Support'}]})},
      {header:'Jobs',accessorKey:'job_count'}, {header:'Notes',accessorKey:'notes'},
      {header:'History',accessorKey:'history',Cell:()=>h(Icon,{'aria-label':'View history',onClick:()=>{}})}];
    return h(Table,{heading:'Shared Table',columns,data:[{id:1,full_name:'Example Name',company_name:'Example Company',department,job_count:0,notes:null}],totalCount:1,enableRowSelection:false,enableGlobalFilter:true});
  }
  ReactDOM.createRoot(host).render(h(Demo));
  await new Promise(resolve=>setTimeout(resolve,500));
  return 'Rendered a shared table without lead-page markers';
})()
