(async()=>{
await import('/src/assets/styles/validation-messages.css');await import('/src/assets/styles/user-management-form.css');
const host=document.createElement('div');host.className='user-management-form';host.style='position:fixed;inset:0;background:white;z-index:9999;padding:24px';document.body.append(host);
host.innerHTML='<div class="form-item"><label>Company</label><div class="relative inline-flex dropdown-select"><button style="height:40px;width:100%">Select Company</button></div><div class="error">Company is required</div></div><div class="form-item"><label>Name</label><input data-slot="input" style="display:block;height:40px"><div class="error">Name is required</div></div>';
const result=[...host.querySelectorAll('.form-item')].map(field=>({field:field.querySelector('label').textContent,gap:field.querySelector('.error').getBoundingClientRect().top-field.children[1].getBoundingClientRect().bottom}));host.remove();return result;
})()
