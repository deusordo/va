function createTimePicker(picker) {
  const calendar = picker.querySelector('.calendar-view');
  const monthLabel = picker.querySelector('#preferred-month');
  const previous = picker.querySelector('#previous-month');
  const next = picker.querySelector('#next-month');
  const days = picker.querySelector('.calendar-days');
  const timeView = picker.querySelector('.time-view');
  const dateLabel = picker.querySelector('#chosen-date');
  const slots = picker.querySelector('.time-slots');
  const feedback = picker.querySelector('.time-feedback');
  const clear = picker.querySelector('#clear-time');
  const timeZone = 'America/Chicago';

  const centralClock = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const monthFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });
  const fullDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', dateStyle: 'full' });
  const shortDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
  const timeFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' });
  const firstMinute = 16 * 60;
  const lastMinute = 21 * 60;
  const halfHours = Array.from(
    { length: (lastMinute - firstMinute) / 30 + 1 },
    (_, index) => firstMinute + index * 30
  );

  let displayedMonth = centralNow().month;
  let selectedDate = '';
  let selectedTime = null;

  function centralNow() {
    const parts = Object.fromEntries(centralClock.formatToParts().map(({ type, value }) => [type, value]));
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      month: new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, 1)),
      minutes: Number(parts.hour) * 60 + Number(parts.minute)
    };
  }

  function availableChoices(date, now) {
    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (date < now.date || dayOfWeek === 0 || dayOfWeek === 6) return [];
    return halfHours.filter(minutes => date !== now.date || minutes >= now.minutes);
  }

  function makeButton(label, value) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.value = value;
    return button;
  }

  function renderCalendar() {
    const now = centralNow();
    if (displayedMonth < now.month) displayedMonth = now.month;
    const year = displayedMonth.getUTCFullYear();
    const month = displayedMonth.getUTCMonth();
    const monthLength = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    monthLabel.textContent = monthFormat.format(displayedMonth);
    previous.disabled = displayedMonth.getTime() === now.month.getTime();

    const cells = [];
    for (let offset = 0; offset < displayedMonth.getUTCDay(); offset++) {
      const gap = document.createElement('span');
      gap.setAttribute('aria-hidden', 'true');
      cells.push(gap);
    }

    let firstAvailable;
    let selectedButton;
    for (let day = 1; day <= monthLength; day++) {
      const date = new Date(Date.UTC(year, month, day));
      const iso = date.toISOString().slice(0, 10);
      const button = makeButton(day, iso);
      button.tabIndex = -1;
      button.disabled = availableChoices(iso, now).length === 0;
      button.setAttribute('aria-label', fullDate.format(date));
      button.setAttribute('aria-pressed', String(iso === selectedDate));
      if (iso === now.date) button.setAttribute('aria-current', 'date');
      if (!button.disabled) {
        firstAvailable ??= button;
        if (iso === selectedDate) selectedButton = button;
      }
      cells.push(button);
    }

    const entry = selectedButton ?? firstAvailable;
    if (entry) entry.tabIndex = 0;
    days.replaceChildren(...cells);
    timeView.hidden = true;
    calendar.hidden = false;
  }

  function formatTime(minutes) {
    return timeFormat.format(new Date(Date.UTC(2000, 0, 1, 0, minutes)));
  }

  function renderTimes() {
    const date = new Date(`${selectedDate}T00:00:00Z`);
    dateLabel.textContent = shortDate.format(date);
    const choices = availableChoices(selectedDate, centralNow()).map(minutes => {
      const button = makeButton(formatTime(minutes), minutes);
      button.setAttribute('aria-pressed', String(minutes === selectedTime));
      return button;
    });
    slots.replaceChildren(...choices);
    calendar.hidden = true;
    timeView.hidden = false;
  }

  function moveMonth(step) {
    displayedMonth = new Date(Date.UTC(displayedMonth.getUTCFullYear(), displayedMonth.getUTCMonth() + step, 1));
    renderCalendar();
  }

  function reset() {
    selectedDate = '';
    selectedTime = null;
    displayedMonth = centralNow().month;
    feedback.textContent = '';
    clear.hidden = true;
    renderCalendar();
  }

  previous.addEventListener('click', () => {
    moveMonth(-1);
    if (previous.disabled) next.focus();
  });
  next.addEventListener('click', () => moveMonth(1));
  days.addEventListener('keydown', event => {
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const offset = offsets[event.key];
    if (offset === undefined || !event.target.matches('button')) return;
    const buttons = Array.from(days.querySelectorAll('button'));
    const current = buttons.indexOf(event.target);
    event.preventDefault();
    for (let index = current + offset; index >= 0 && index < buttons.length; index += offset) {
      const target = buttons[index];
      if (target.disabled) continue;
      event.target.tabIndex = -1;
      target.tabIndex = 0;
      target.focus();
      break;
    }
  });

  days.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.value !== selectedDate) {
      selectedDate = button.value;
      selectedTime = null;
      feedback.textContent = '';
    }
    clear.hidden = false;
    renderTimes();
    dateLabel.focus();
  });

  picker.querySelector('#back-to-dates').addEventListener('click', () => {
    renderCalendar();
    (days.querySelector('[tabindex="0"]') ?? next).focus();
  });
  clear.addEventListener('click', () => {
    reset();
    (days.querySelector('[tabindex="0"]') ?? next).focus();
  });

  slots.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    selectedTime = Number(button.value);
    for (const choice of slots.querySelectorAll('button')) {
      choice.setAttribute('aria-pressed', String(choice === button));
    }
    feedback.textContent = `${dateLabel.textContent} at ${button.textContent} CT selected.`;
  });

  return {
    refresh() {
      if (timeView.hidden) renderCalendar();
      else renderTimes();
    },
    validate() {
      if (!selectedDate) return true;
      const choices = availableChoices(selectedDate, centralNow());
      if (choices.includes(selectedTime)) return true;
      if (choices.length) {
        renderTimes();
        feedback.textContent = 'Choose a time or clear your suggestion.';
        slots.querySelector('button').focus();
      } else {
        reset();
        feedback.textContent = 'Please choose a later date.';
        (days.querySelector('[tabindex="0"]') ?? next).focus();
      }
      return false;
    },
    append(data) {
      if (selectedTime === null) return null;
      const hours = String(Math.floor(selectedTime / 60)).padStart(2, '0');
      const minutes = String(selectedTime % 60).padStart(2, '0');
      data.set('preferred_date', selectedDate);
      data.set('preferred_time', `${hours}:${minutes}`);
      data.set('preferred_time_zone', timeZone);
      const date = fullDate.format(new Date(`${selectedDate}T00:00:00Z`));
      return `${date} at ${formatTime(selectedTime)} Central Time`;
    },
    reset
  };
}
