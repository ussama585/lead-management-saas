(async () => {
  const source = await (await fetch('/src/layouts/admin-shell.jsx')).text();
  const { default: React } = await import('/node_modules/.vite/deps/react.js');
  const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
  const { MemoryRouter } = await import(source.match(/from "(\/node_modules\/\.vite\/deps\/react-router-dom\.js[^"]*)"/)[1]);
  const { QueryClient, QueryClientProvider } = await import(source.match(/from "(\/node_modules\/\.vite\/deps\/react-query\.js[^"]*)"/)[1]);
  const { default: Shell } = await import('/src/layouts/admin-shell.jsx');
  await import('/src/assets/styles/legacy/create-user.css');
  await import('/src/assets/styles/legacy/client-listing-page.css');
  await import('/src/assets/styles/legacy/admin-dashboard-page.css');
  await import('/src/assets/styles/responsive-workspace.css');
  document.querySelector('#filter-gap-test')?.remove();
  const host=document.createElement('div');host.id='filter-gap-test';host.style='position:fixed;inset:0;background:white;z-index:999;overflow:auto';document.body.append(host);
  const h=React.createElement;
  ReactDOM.createRoot(host).render(h(MemoryRouter,{},h(QueryClientProvider,{client:new QueryClient()},h(Shell,{menuItems:[{key:'1',label:'Dashboard',group:'Overview'}],selectedKey:'1',onSelect:()=>{}},h('div',{},'Page spacing audit')))));
  await new Promise(resolve=>setTimeout(resolve,300));
  window.pageGapFixtures = {
    'Breadcrumb pages': '<div class="mb-6 flex items-center"><h1 data-gap-target>Section heading</h1></div><div class="listing-page-content">Table</div>',
    'Sales Data': '<div class="listing-page-content sales-data-page"><details data-gap-target open><summary>Filters</summary>Controls</details></div>',
    'Dashboard': '<div class="dashboard-container admin-dashboard-page"><h2 data-gap-target class="admin-dashboard-section-heading">Dashboard</h2></div>',
    'User management': '<div class="container"><div class="flex-container"><div data-gap-target>Users</div></div></div>',
    'Settings': '<div class="settings-layout" style="padding-top:24px"><div data-gap-target style="margin-top:20px">Settings</div></div>',
    'Lead pages with portal slot': '<div></div><div class="flex justify-end" style="margin-bottom:20px"><button data-gap-target>Manage Assignees</button></div><details open><summary>Filters</summary></details>',
    'Nested page wrappers': '<div class="leads"><div class="min-w-0" style="padding-top:20px"><section data-gap-target style="margin-top:10px">Leads</section></div></div>',
    'Table-only pages': '<div class="table-wrapper app-data-table" style="margin-top:20px"><div class="MuiPaper-root" data-gap-target style="margin-top:10px">Table</div></div>',
  };
  return Object.keys(window.pageGapFixtures);
})()
