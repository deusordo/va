const openButton=document.getElementById('open-form');
const closeButton=document.getElementById('close-form');
const panel=document.getElementById('contact-panel');
const form=document.getElementById('contact-form');
const status=document.getElementById('form-status');
function toggleForm(open){panel.hidden=!open;openButton.setAttribute('aria-expanded',String(open));if(open){document.getElementById('name').focus()}else{openButton.focus()}}
openButton.addEventListener('click',()=>toggleForm(panel.hidden));
closeButton.addEventListener('click',()=>toggleForm(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)toggleForm(false)});
form.addEventListener('submit',async e=>{
  e.preventDefault();status.textContent='';
  if(!form.reportValidity())return;
  const endpoint=form.action;
  const submit=form.querySelector('[type=submit]');submit.disabled=true;status.textContent='Sending…';
  try{const response=await fetch(endpoint,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});if(!response.ok)throw Error('send failed');form.reset();status.textContent='Message sent. Thank you for reaching out.'}catch{status.textContent='Message could not be sent. Please try again later.'}finally{submit.disabled=false}
});
