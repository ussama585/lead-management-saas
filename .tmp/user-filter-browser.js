(async () => {
 const {default:React}=await import('/node_modules/.vite/deps/react.js');
 const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
 const {default:Filters}=await import('/src/pages/users/components/user-management-filters.jsx');
 await import('/src/assets/styles/legacy/user-management-page.css');
 await import('/src/assets/styles/job-listing-tabs.css');
 document.querySelector('#filter-gap-test')?.remove();
 const host=document.createElement('div');host.id='filter-gap-test';host.style='position:fixed;inset:0;background:white;z-index:99;padding:24px;overflow:auto';document.body.append(host);
 const h=React.createElement;
 function Demo(){const[role,setRole]=React.useState('all'),[status,setStatus]=React.useState('');return h(Filters,{role,onRoleChange:setRole,status,onStatusChange:setStatus,onCreate:()=>{window.userCreateClicked=true},companyRolesOnly:true,showAccountStatus:true,counts:{all:12,sales_executive:7}})}
 ReactDOM.createRoot(host).render(h(Demo));
 await new Promise(resolve=>setTimeout(resolve,300));
 return 'Rendered User Management filters';
})()
