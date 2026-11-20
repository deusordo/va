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
const meetingOptions = document.getElementById('meeting-options');
const timePicker = createTimePicker(document.getElementById('time-request'));

message.addEventListener('input', () => message.setCustomValidity(''));

function focusConfirmation() {
  heading.focus({ preventScroll: true });
  heading.scrollIntoView({ block: 'center', behavior: 'instant' });
}

function showConfirmation(requestedTime) {
  form.reset();
  timePicker.reset();
  meetingOptions.open = false;
  status.textContent = '';
  heading.textContent = 'Message Received';
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
      const firstName = form.elements.first_name;
      firstName.focus({ preventScroll: true });
      firstName.scrollIntoView({ block: 'nearest' });
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
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.isComposing || panel.hidden) return;
  event.preventDefault();
  toggleForm(false);
});
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const submit = form.querySelector('[type=submit]');
  if (form.hidden || submit.disabled) return;
  status.textContent = '';
  const messageText = message.value.trim();
  message.setCustomValidity(messageText ? '' : 'Tell me a little about what I can help you with.');
  if (!form.reportValidity() || !timePicker.validate()) return;
  const data = new FormData(form);
  const firstName = form.elements.first_name.value.trim();
  const lastName = form.elements.last_name.value.trim();
  data.set('first_name', firstName);
  data.set('last_name', lastName);
  data.set('name', `${firstName} ${lastName}`);
  const phone = form.elements.phone.value.trim();
  if (phone) data.set('phone', phone);
  else data.delete('phone');
  const requestedTime = timePicker.append(data);
  data.set('message', requestedTime
    ? `${messageText}\n\nPreferred date and time: ${requestedTime}`
    : messageText);
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
