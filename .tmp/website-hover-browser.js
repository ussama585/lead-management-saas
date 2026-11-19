(async () => {
  const { default: React } = await import('/node_modules/.vite/deps/react.js');
  const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
  const { Button } = await import('/src/components/ui/button.jsx');
  const { default: Icon } = await import('/src/components/animated-follow-up-icon.jsx');
  await import('/src/assets/styles/data-leads-page.css');
  const h = React.createElement;
  document.querySelector('#filter-gap-test')?.remove();
  const host = document.createElement('div');
  host.id = 'filter-gap-test';
  host.style = 'position:fixed;inset:0;background:white;z-index:9999;padding:24px';
  document.body.append(host);
  ReactDOM.createRoot(host).render(h('div', {},
    h(Button, {animateHover:false,className:'website-manage-assignees-button',id:'manage-hover-test'}, 'Manage Assignees'),
    h('details',{open:true,className:'leads-top-filters-accordion'},h('summary',{},'Filters'),h('div',{className:'website-lead-filter-dropdowns'})),
    h('div',{className:'app-data-table'},h(Icon,{onClick:()=>{},'aria-label':'Follow Ups'}),h(Icon,{variant:'history',onClick:()=>{},'aria-label':'History'}))));
  await new Promise(resolve => setTimeout(resolve,300));
  return {animatedButton:host.querySelector('#manage-hover-test').classList.contains('button-flight'),accordionGap:getComputedStyle(host.querySelector('details')).marginBottom};
})()
