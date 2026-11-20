(async () => {
 const source=await(await fetch('/src/pages/auth/pages/otp-modal.jsx')).text();
 const {default:React}=await import('/node_modules/.vite/deps/react.js');
 const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
 const {MemoryRouter}=await import(source.match(/from "(\/node_modules\/\.vite\/deps\/react-router-dom\.js[^"]*)"/)[1]);
 const {QueryClient,QueryClientProvider}=await import(source.match(/from "(\/node_modules\/\.vite\/deps\/react-query\.js[^"]*)"/)[1]);
 const {default:Otp}=await import('/src/pages/auth/pages/otp-modal.jsx');
 document.querySelector('#otp-mobile-test')?.remove();const host=document.createElement('div');host.id='otp-mobile-test';document.body.append(host);
 const h=React.createElement;
 ReactDOM.createRoot(host).render(h(MemoryRouter,{},h(QueryClientProvider,{client:new QueryClient()},h(Otp,{openModal:true,setOpenModal:()=>{},email:'long.company.email.address@example-company.com',title:'Verify your sign in',description:'Enter the six digit verification code sent to long.company.email.address@example-company.com.',submitText:'Verify and sign in',onSubmit:()=>Promise.resolve({})}))));
 await new Promise(resolve=>setTimeout(resolve,300));
 return 'Rendered sign-in OTP modal';
})()
