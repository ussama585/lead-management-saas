(async () => {
  const tab = [...document.querySelectorAll('button')].find(button => button.textContent.trim().startsWith('Sales Executives ('));
  tab.click();
  await new Promise(resolve => setTimeout(resolve, 4000));
  const { default: api } = await import('/src/pages/shared/services/api.js');
  const companyId = JSON.parse(localStorage.getItem('user')).company_id;
  const response = await api.get('/company/users/' + companyId, { params: { company_id: companyId, page: 1, size: 10, user_type: 'sales_executive' } });
  return { api: '/company/users/' + companyId + '?company_id=' + companyId + '&page=1&size=10&user_type=sales_executive', status: response.status, count: response.data.count, visibleRoles: [...document.querySelectorAll('main tbody tr')].map(row=>row.innerText.includes('Sales Executive')), hasMissingCompanyError: document.querySelector('main').innerText.includes('missing a company ID') };
})()
