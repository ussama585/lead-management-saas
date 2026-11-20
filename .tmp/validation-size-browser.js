(async()=>{
await import('/src/assets/styles/validation-messages.css');
const host=document.createElement('div');host.id='validation-size-test';
const classes=['sop-field-error','form-error','error-message','invalid-feedback','error text-sm','text-red','text-destructive text-sm','ant-form-item-explain-error','MuiFormHelperText-root Mui-error','validation-message','contract-summary-form__error-text','contract-summary-form__error-text--tight','activate-project-content__error','gf-qcard-options-error','question-options__error-text','jobs-selection-table__error-text'];
for(const name of classes){const node=document.createElement(name.includes('text-destructive')?'p':'div');node.className=name;node.textContent='Required';host.append(node)}
document.body.append(host);
const results=[...host.children].map(node=>({class:node.className,size:getComputedStyle(node).fontSize}));host.remove();if(results.some(x=>x.size!=='12px'))throw Error(JSON.stringify(results));return results;
})()
