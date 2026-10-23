(async () => {
 const pause = () => new Promise(r => setTimeout(r, 180));
 const fill = (id, value) => {
  const el = document.getElementById(id); if (!el) throw Error('Missing '+id);
  Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(el,String(value));
  el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
 };
 const select = async (id, value) => {
  const el = document.getElementById(id);
  el.closest('.ant-select').querySelector('.ant-select-selector').dispatchEvent(new MouseEvent('mousedown',{bubbles:true})); await pause();
  fill(id,value); await pause();
  const opts=[...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')];
  const opt=opts.find(e=>e.title===String(value)||e.innerText.trim()===String(value));
  if(!opt)throw Error('Missing option '+value+': '+opts.map(o=>o.innerText).join(','));opt.click();await pause();
  document.body.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));
 };
 window.testJobTitle='UI TEST - Website Python Developer - 2026-10-23';
 for (const [key,value] of Object.entries({job_title:window.testJobTitle,min_experience:3,max_experience:6,min_salary:150000,max_salary:250000,
  working_hours:'09:00-18:00',address:'Gulberg, Lahore',job_description:'Authorized form test for Website Leads job creation. Retain this record as requested.',
  job_requirements:'Python, Django, REST APIs and PostgreSQL.',job_responsibilities:'Build and maintain backend APIs.',other_benefits:'Medical insurance and paid leave.',notes:'UI TEST — retained as requested by user on 2026-10-23.'})) {fill(key,value);await pause();}
 for(const [id,value] of [['rc_select_1','3'],['rc_select_3','No Preference'],['rc_select_9','Office-Based'],['rc_select_10','Lahore'],['rc_select_11','Pakistan'],['rc_select_14','Full-Time'],['rc_select_16','Pakistani Rupee (PKR)'],['rc_select_17','Per Month']]) await select(id,value);
 return {title:window.testJobTitle,text:document.body.innerText.slice(-1700)};
})()
