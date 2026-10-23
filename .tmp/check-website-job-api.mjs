const base = 'https://herbal-bell-communication-big.trycloudflare.com/api';
const credentials = new FormData();
credentials.append('email', process.env.TEST_LOGIN_EMAIL);
credentials.append('password', process.env.TEST_LOGIN_PASSWORD);
const login = await fetch(base + '/accounts/superuser/login', { method: 'POST', body: credentials });
const auth = await login.json();
if (!login.ok || !auth.data?.access) throw Error('Login failed: ' + login.status);
const headers = { Authorization: 'Bearer ' + auth.data.access, 'Content-Type': 'application/json' };
const request = async (id, method = 'GET', body) => {
 const response = await fetch(`${base}/lead-generation/job/${id}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
 const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = null; }
 return { status: response.status, data };
};
if (process.argv[2] !== 'write') {
 for (const id of [2, 3]) { const result = await request(id); const job = result.data?.data ?? result.data; console.log(JSON.stringify({ id, status: result.status, job: job ? { id: job.id, job_title: job.job_title, notes: job.notes } : null })); }
} else {
 const before = await request(2); const job = before.data?.data ?? before.data;
 if (before.status !== 200 || job?.id !== 2) throw Error('Job 2 could not be verified.');
 const marker = 'API edit test verified on 2026-10-23.';
 const notes = [job.notes, marker].filter(Boolean).join('\n');
 const patched = await request(2, 'PATCH', { notes });
 console.log(JSON.stringify({ action: 'PATCH', id: 2, status: patched.status }));
 if (patched.status < 200 || patched.status >= 300 || patched.data?.status === false || patched.data?.success === false) throw Error('Edit test failed; deletion was not attempted.');
 const verify = await request(2); console.log(JSON.stringify({ action: 'verify-edit', id: 2, status: verify.status, notesSaved: (verify.data?.data ?? verify.data)?.notes === notes }));
 const target = await request(3); if (target.status !== 200 || (target.data?.data ?? target.data)?.id !== 3) throw Error('Job 3 could not be verified.');
 const deleted = await request(3, 'DELETE');console.log(JSON.stringify({ action: 'DELETE', id: 3, status: deleted.status, response: deleted.data }));
 const after = await request(3);console.log(JSON.stringify({ action: 'verify-delete', id: 3, status: after.status }));
}
