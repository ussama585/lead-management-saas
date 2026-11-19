(async () => {
  const { default: React } = await import('/node_modules/.vite/deps/react.js');
  const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
  const { createRoot } = ReactDOM;
  const { Select } = await import('/src/components/ui/app-select.jsx');
  await import('/src/assets/styles/lead-listing-filters.css');
  await import('/src/assets/styles/data-leads-page.css');
  const h = React.createElement;
  document.querySelector('#filter-gap-test')?.remove();
  const host = document.createElement('div');
  host.id = 'filter-gap-test';
  host.style = 'position:fixed;inset:0;background:white;z-index:9999;padding:24px';
  document.body.append(host);
  createRoot(host).render(h('div', {className:'data-leads-ui data-leads-local-toolbar'},
    h('div', {className:'website-lead-filter-dropdowns'}),
    ...['Company', 'Project size'].map(label => h('div', {className:'lead-company-filter',key:label},
      h('div', {className:'lead-company-filter__control'}, h(Select, {value:'selected',allowClear:true,style:{width:'100%'},options:[{value:'selected',label}]}))))));
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...host.querySelectorAll('[aria-label="Clear selection"]')].map(clear => {
    const trigger = clear.parentElement.querySelector('[aria-haspopup]');
    const arrow = trigger.querySelector('svg');
    const cr = clear.getBoundingClientRect(), ar = arrow.getBoundingClientRect();
    return {css:[...document.querySelectorAll('style')].filter(x=>x.textContent.includes('right: 44px')).length, position:getComputedStyle(arrow).position, paddingRight:getComputedStyle(trigger).paddingRight,
      clearLeft:cr.left, arrowRight:ar.right, gap:cr.left-ar.right};
  });
})()
