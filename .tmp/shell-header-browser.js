(async () => {
  const { default: React } = await import('/node_modules/.vite/deps/react.js');
  const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
  const source = await (await fetch('/src/layouts/admin-shell.jsx')).text();
  const routerPath = source.match(/from "(\/node_modules\/\.vite\/deps\/react-router-dom\.js[^"]*)"/)[1];
  const queryPath = source.match(/from "(\/node_modules\/\.vite\/deps\/react-query\.js[^"]*)"/)[1];
  const { MemoryRouter } = await import(routerPath);
  const { QueryClient, QueryClientProvider } = await import(queryPath);
  const { default: Shell } = await import('/src/layouts/admin-shell.jsx');
  document.querySelector('#filter-gap-test')?.remove();
  const host=document.createElement('div');host.id='filter-gap-test';
  host.style='position:fixed;inset:0;background:white;z-index:999;overflow:auto';document.body.append(host);
  const h=React.createElement;
  ReactDOM.createRoot(host).render(h(MemoryRouter,{},h(QueryClientProvider,{client:new QueryClient()},
    h(Shell,{menuItems:[{key:'1',label:'Dashboard',group:'Overview'}],selectedKey:'1',onSelect:()=>{}},h('div',{style:{height:2000}},'Header scroll test')))));
  await new Promise(resolve=>setTimeout(resolve,300));
  return 'Rendered shared application shell';
})()
