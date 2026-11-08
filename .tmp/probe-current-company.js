(async () => {
  const { default: api } = await import('/src/pages/shared/services/api.js');
  const user = JSON.parse(localStorage.getItem('user'));
  const response = await api.get('/accounts/detail/' + user.id);
  const payload = response.data;
  const account = payload.data ?? payload;
  return { status: response.status, rootKeys: Object.keys(payload), accountKeys: Object.keys(account), company_id: account.company_id, company: account.company };
})()
