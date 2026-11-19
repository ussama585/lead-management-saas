(async () => {
  const { default: React } = await import('/node_modules/.vite/deps/react.js');
  const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
  const { Button } = await import('/src/components/ui/button.jsx');
  const { Plus } = await import('/node_modules/.vite/deps/lucide-react.js');
  document.querySelector('#filter-gap-test')?.remove();
  const host = document.createElement('div');
  host.id = 'filter-gap-test';
  host.style = 'position:fixed;inset:0;background:white;z-index:9999;padding:24px;display:flex;gap:20px;align-items:flex-start';
  document.body.append(host);
  const h = React.createElement;
  ReactDOM.createRoot(host).render(h(React.Fragment,{},
    h(Button,{id:'hover-save'},'Save'),
    h(Button,{id:'hover-add'},h(Plus),'Add New Lead'),
    h(Button,{id:'hover-manage',className:'website-manage-assignees-button'},'Manage Assignees'),
    h(Button,{id:'hover-disabled',disabled:true},'Disabled')));
  await new Promise(resolve=>setTimeout(resolve,200));
  return 'Rendered shared buttons';
})()
