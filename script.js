const openButton=document.getElementById('open-form');
const closeButton=document.getElementById('close-form');
const panel=document.getElementById('contact-panel');
const form=document.getElementById('contact-form');
const status=document.getElementById('form-status');
const heading = document.getElementById('contact-heading');
const confirmation = document.getElementById('contact-confirmation');
const confirmationRequest = document.getElementById('confirmation-request');
const confirmationTime = document.getElementById('confirmation-time');
const message = form.elements.message;
const timePicker = createTimePicker(document.getElementById('time-request'));

message.addEventListener('input', () => message.setCustomValidity(''));

function focusConfirmation() {
  heading.focus({ preventScroll: true });
  heading.scrollIntoView({ block: 'center', behavior: 'instant' });
}

function showConfirmation(requestedTime) {
  form.reset();
  timePicker.reset();
  status.textContent = '';
  heading.textContent = 'Thank you.';
  heading.setAttribute('aria-describedby', requestedTime
    ? 'confirmation-message confirmation-request'
    : 'confirmation-message');
  confirmationTime.textContent = requestedTime ?? '';
  confirmationRequest.hidden = !requestedTime;
  form.hidden = true;
  confirmation.hidden = false;
  if (!panel.hidden) focusConfirmation();
}

function toggleForm(open) {
  panel.hidden = !open;
  openButton.setAttribute('aria-expanded', String(open));
  if (open) {
    if (form.hidden) {
      focusConfirmation();
    } else {
      timePicker.refresh();
      form.elements.first_name.focus();
    }
  } else {
    if (!confirmation.hidden) {
      confirmation.hidden = true;
      form.hidden = false;
      heading.textContent = 'Let’s Connect';
      heading.removeAttribute('aria-describedby');
    }
    openButton.focus();
  }
}
openButton.addEventListener('click',()=>toggleForm(panel.hidden));
closeButton.addEventListener('click',()=>toggleForm(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)toggleForm(false)});
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const submit = form.querySelector('[type=submit]');
  if (form.hidden || submit.disabled) return;
  status.textContent = '';
  message.setCustomValidity(message.value.trim() ? '' : 'Tell me what you need help with.');
  if (!form.reportValidity() || !timePicker.validate()) return;
  const data = new FormData(form);
  const firstName = form.elements.first_name.value.trim();
  const lastName = form.elements.last_name.value.trim();
  data.set('first_name', firstName);
  data.set('last_name', lastName);
  data.set('name', `${firstName} ${lastName}`);
  const requestedTime = timePicker.append(data);
  data.set('message', `${message.value}

Preferred date and time: ${requestedTime ?? 'No time selected.'}`);
  submit.disabled = true;
  status.textContent = 'Sending…';
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw Error('send failed');
    showConfirmation(requestedTime);
  } catch {
    status.textContent = 'Message could not be sent. Please try again later.';
  } finally {
    submit.disabled = false;
  }
});
