const base = 'https://nomination-price-idle-predicted.trycloudflare.com/api';
const body = new FormData(); body.append('email', process.env.TEST_LOGIN_EMAIL); body.append('password', process.env.TEST_LOGIN_PASSWORD);
const login = await fetch(base + '/accounts/superuser/login', { method: 'POST', body });
const auth = await login.json();
if (!auth.data?.access) throw Error('Login failed: ' + login.status);
const headers = { Authorization: 'Bearer ' + auth.data.access };
for (const path of ['/company/users/10?user_type=sales_manager', '/accounts/detail/28']) {
 const response = await fetch(base + path, { headers }); const data = await response.json();
 console.log(JSON.stringify({ path, status: response.status, data: Array.isArray(data) ? data : { results: data.results?.map(u => ({ id: u.id, name: u.name, user_type: u.user_type })), manager_id: data.data?.manager_id, manager_name: data.data?.manager_name } }));
}
