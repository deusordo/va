const openButton = document.getElementById('open-form');
const closeButton = document.getElementById('close-form');
const panel = document.getElementById('contact-panel');
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
const alternative = document.getElementById('form-alternative');
const heading = document.getElementById('contact-heading');
const confirmation = document.getElementById('contact-confirmation');
const confirmationRequest = document.getElementById('confirmation-request');
const confirmationTime = document.getElementById('confirmation-time');
const message = form.elements.message;
const nameInput = document.getElementById('contact-name');
const meetingOptions = document.getElementById('meeting-options');
let timePicker;

message.addEventListener('input', () => message.setCustomValidity(''));

function withTimePicker(action) {
  if (!timePicker) return;
  try {
    return action(timePicker);
  } catch {
    timePicker = undefined;
    meetingOptions.hidden = true;
  }
}

function focusConfirmation() {
  heading.focus({ preventScroll: true });
  heading.scrollIntoView({ block: 'center', behavior: 'instant' });
}

function showConfirmation(requestedTime) {
  form.reset();
  withTimePicker(picker => picker.reset());
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
      withTimePicker(picker => picker.refresh());
      nameInput.focus({ preventScroll: true });
      nameInput.scrollIntoView({ block: 'nearest' });
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
openButton.addEventListener('click', () => toggleForm(panel.hidden));
closeButton.addEventListener('click', () => toggleForm(false));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.isComposing || panel.hidden) return;
  event.preventDefault();
  toggleForm(false);
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = form.querySelector('[type=submit]');
  if (form.hidden || submit.disabled) return;
  status.textContent = '';
  alternative.hidden = true;
  const messageText = message.value.trim();
  message.setCustomValidity(messageText ? '' : 'Tell me a little about what I can help you with.');
  if (!form.reportValidity() || withTimePicker(picker => picker.validate()) === false) return;
  const data = new FormData(form);
  data.set('name', nameInput.value.trim());
  const phone = form.elements.phone.value.trim();
  if (phone) data.set('phone', phone);
  else data.delete('phone');
  const requestedTime = withTimePicker(picker => picker.append(data));
  data.set('message', requestedTime
    ? `${messageText}\n\nPreferred date and time: ${requestedTime}`
    : messageText);
  submit.disabled = true;
  status.textContent = 'Sending…';
  const request = new AbortController();
  const timeout = setTimeout(() => request.abort(), 15000);
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' },
      signal: request.signal
    });
    if (!response.ok) throw Error('send failed');
    showConfirmation(requestedTime);
  } catch {
    status.textContent = request.signal.aborted
      ? 'The request took too long to confirm. Your details are still here. You can try again.'
      : 'Your message couldn’t be sent. Your details are still here. Please try again.';
    alternative.hidden = false;
  } finally {
    clearTimeout(timeout);
    submit.disabled = false;
  }
});

if (typeof createTimePicker === 'function') {
  try {
    timePicker = createTimePicker(document.getElementById('time-request'));
    meetingOptions.hidden = false;
  } catch {
    meetingOptions.hidden = true;
  }
}

if (location.hash === '#open-form') toggleForm(true);
