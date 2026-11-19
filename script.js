const openButton=document.getElementById('open-form');
const closeButton=document.getElementById('close-form');
const panel=document.getElementById('contact-panel');
const form=document.getElementById('contact-form');
const status=document.getElementById('form-status');
const message = form.elements.message;
const timeRequest = document.getElementById('time-request');
const preferredDate = form.elements.preferred_date;
const preferredTime = form.elements.preferred_time;
const timeZone = 'America/Chicago';
const centralDate = new Intl.DateTimeFormat('en', {
  timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

function updateTimeRequest() {
  preferredDate.required = Boolean(preferredTime.value);
  preferredTime.required = Boolean(preferredDate.value);
  const { year, month, day } = Object.fromEntries(
    centralDate.formatToParts().map(({ type, value }) => [type, value])
  );
  preferredDate.min = `${year}-${month}-${day}`;
}

message.addEventListener('input', () => message.setCustomValidity(''));
timeRequest.addEventListener('input', updateTimeRequest);
timeRequest.addEventListener('invalid', () => { timeRequest.open = true; }, true);
updateTimeRequest();

function toggleForm(open) {
  panel.hidden = !open;
  if (open) updateTimeRequest();
  openButton.setAttribute('aria-expanded', String(open));
  (open ? form.elements.first_name : openButton).focus();
}
openButton.addEventListener('click',()=>toggleForm(panel.hidden));
closeButton.addEventListener('click',()=>toggleForm(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)toggleForm(false)});
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const submit = form.querySelector('[type=submit]');
  if (submit.disabled) return;
  status.textContent = '';
  message.setCustomValidity(message.value.trim() ? '' : 'Tell me what you need help with.');
  updateTimeRequest();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const firstName = form.elements.first_name.value.trim();
  const lastName = form.elements.last_name.value.trim();
  data.set('first_name', firstName);
  data.set('last_name', lastName);
  data.set('name', `${firstName} ${lastName}`);
  const requestedTime = Boolean(preferredDate.value && preferredTime.value);
  if (requestedTime) {
    data.set('preferred_time_zone', timeZone);
  } else {
    data.delete('preferred_date');
    data.delete('preferred_time');
  }
  submit.disabled = true;
  status.textContent = 'Sending…';
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw Error('send failed');
    form.reset();
    timeRequest.open = false;
    updateTimeRequest();
    status.textContent = requestedTime
      ? 'Message sent. I’ll follow up to confirm a time.'
      : 'Message sent. Thank you for reaching out.';
  } catch {
    status.textContent = 'Message could not be sent. Please try again later.';
  } finally {
    submit.disabled = false;
  }
});
