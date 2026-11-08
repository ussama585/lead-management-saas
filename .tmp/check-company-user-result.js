({
  path: location.pathname,
  text: document.querySelector('main')?.innerText.slice(0, 6000),
  companyId: JSON.parse(localStorage.getItem('user') || 'null')?.company_id,
  requests: performance.getEntriesByType('resource').filter(e => e.name.includes('/company/users/') || e.name.includes('/accounts/detail/')).map(e => ({url: e.name, status: e.responseStatus})),
})
