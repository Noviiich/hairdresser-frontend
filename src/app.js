import { services, bookingServices, specialists, looks } from './data.js';
import { upcomingDates, availableTimes, validateContact, priceLabel, durationLabel, fullDate, escapeHtml } from './booking.js';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const arrow = '<svg class="icon" aria-hidden="true"><use href="#icon-arrow-up" /></svg>';
const bookingDialog = $('#booking-dialog');
const bookingBody = $('#booking-body');
let triggerBeforeDialog = null;
let step = 0;
const freshBooking = () => ({ service: '', specialist: 'any', date: '', time: '', name: '', phone: '', consent: false });
let booking = freshBooking();

function setMenu(open) {
  $('.menu-toggle').setAttribute('aria-expanded', String(open));
  $('.menu-toggle').setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  $('#mobile-nav').hidden = !open;
}
$('.menu-toggle').addEventListener('click', () => setMenu($('#mobile-nav').hidden));
$$('#mobile-nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#mobile-nav').hidden) {
    setMenu(false);
    $('.menu-toggle').focus();
  }
});
matchMedia('(min-width: 951px)').addEventListener('change', (event) => { if (event.matches) setMenu(false); });
$('#year').textContent = new Date().getFullYear();

function renderServiceList(category = 'all') {
  const filtered = services.filter((service) => category === 'all' || service.category === category);
  $('#service-list').innerHTML = filtered.map((service) => `<article class="service-row"><div><h3>${service.name}</h3><small>${durationLabel(service.duration)} · ${service.description}</small></div><span class="price">${priceLabel(service)}</span><button data-book="${service.id}" aria-label="Записаться: ${service.name}">${arrow}</button></article>`).join('');
  $('.service-cards').classList.toggle('is-filtered', category !== 'all');
  $$('.service-card').forEach((card) => { card.hidden = category !== 'all' && card.dataset.category !== category; });
}
$$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  $$('[data-filter]').forEach((item) => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  renderServiceList(button.dataset.filter);
}));
renderServiceList();

function openDialog(dialog, trigger) {
  // Remember a visible page trigger even when transitioning from the look gallery.
  if (!document.querySelector('dialog[open]')) triggerBeforeDialog = trigger || document.activeElement;
  setMenu(false);
  $$('dialog[open]').forEach((open) => open.close());
  document.body.classList.add('modal-open');
  dialog.showModal();
  dialog.scrollTop = 0;
}
$$('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) {
      document.body.classList.remove('modal-open');
      if (triggerBeforeDialog?.isConnected) triggerBeforeDialog.focus({ preventScroll: true });
    }
    if (dialog === bookingDialog) {
      booking = freshBooking();
      bookingBody.replaceChildren();
    }
  });
});

function startBooking(service, trigger) {
  booking = freshBooking();
  if (bookingServices.some((item) => item.id === service)) booking.service = service;
  step = 0;
  renderBooking();
  openDialog(bookingDialog, trigger);
}

document.addEventListener('click', (event) => {
  const bookButton = event.target.closest('[data-book]');
  if (bookButton) { startBooking(bookButton.dataset.book, bookButton); return; }
  const closeButton = event.target.closest('[data-close]');
  if (closeButton) { closeButton.closest('dialog').close(); return; }
  const lookButton = event.target.closest('[data-look]');
  if (lookButton) {
    const look = looks[Number(lookButton.dataset.look)];
    if (!look) return;
    $('#look-content').innerHTML = `<div class="look-layout"><img src="${look.image}" alt="${look.alt}" width="640" height="800" /><div class="look-copy"><p class="eyebrow">${look.subtitle}</p><h2 id="look-title">${look.title}</h2><p>${look.description}</p><button class="button button-dark" data-book="${look.service}">Хочу похожий образ ${arrow}</button><small>Изображение для вдохновения. Результат зависит от исходного состояния волос и выбранной техники.</small></div></div>`;
    openDialog($('#look-dialog'), lookButton);
  }
});
$('#privacy-open').addEventListener('click', (event) => openDialog($('#privacy-dialog'), event.currentTarget));
$('.dialog-brand').addEventListener('click', (event) => { event.preventDefault(); bookingDialog.close(); });

const selectedService = () => bookingServices.find((service) => service.id === booking.service);
const eligibleSpecialists = () => specialists.filter((specialist) => specialist.categories.includes(selectedService()?.category));

function summary() {
  const service = selectedService();
  const specialist = specialists.find((item) => item.id === booking.specialist);
  return `<div class="booking-summary"><h3>${service.name} <strong>· ${priceLabel(service)}</strong></h3><p>${escapeHtml(fullDate(booking.date))}, ${booking.time} (МСК) · ${durationLabel(service.duration)}<br />${specialist.name}</p></div>`;
}
function nextActions(label = 'Продолжить', disabled = false) {
  return `<div class="booking-actions">${step > 0 ? '<button class="booking-back" type="button" data-back>Назад</button>' : ''}<button class="button button-dark" ${step === 2 ? 'type="submit"' : 'type="button" data-next'} ${disabled ? 'disabled' : ''}>${label} ${arrow}</button></div>`;
}

function renderBooking(focusHeading = false) {
  $$('.booking-progress li').forEach((item, index) => {
    item.classList.toggle('current', index === step);
    item.classList.toggle('done', index < step);
    if (index === step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
  });
  $('.booking-progress').hidden = step === 3;
  if (step === 0) {
    bookingBody.innerHTML = `<h3 class="form-heading" tabindex="-1">Что хочется изменить?</h3><div class="booking-services" role="group" aria-label="Выберите услугу">${bookingServices.map((service) => `<button class="booking-option ${booking.service === service.id ? 'selected' : ''}" data-service="${service.id}" aria-pressed="${booking.service === service.id}"><span class="option-radio" aria-hidden="true"></span><span>${service.name}<small>${durationLabel(service.duration)} · ${service.description}</small></span><span class="option-price">${priceLabel(service)}</span></button>`).join('')}</div>${nextActions('Выбрать время', !booking.service)}`;
  } else if (step === 1) {
    const service = selectedService();
    const dates = upcomingDates();
    if (!dates.some((date) => date.key === booking.date)) booking.date = dates.find((date) => availableTimes(date.key, service.duration).length)?.key || dates[0].key;
    if (!eligibleSpecialists().some((specialist) => specialist.id === booking.specialist)) booking.specialist = 'any';
    if (!availableTimes(booking.date, service.duration).includes(booking.time)) booking.time = '';
    bookingBody.innerHTML = `<h3 class="form-heading" tabindex="-1">Найдём время для себя</h3><label class="field-label" for="specialist">Мастер</label><select class="form-control" id="specialist">${eligibleSpecialists().map((specialist) => `<option value="${specialist.id}" ${booking.specialist === specialist.id ? 'selected' : ''}>${specialist.name}</option>`).join('')}</select><p class="field-label">Удобный день</p><div class="date-options" role="group" aria-label="Дата визита">${dates.map((date) => `<button class="date-option ${date.key === booking.date ? 'selected' : ''}" data-date="${date.key}" aria-pressed="${date.key === booking.date}" aria-label="${escapeHtml(fullDate(date.key))}"><span>${date.weekday}</span>${date.day}<small>${date.month}</small></button>`).join('')}</div><p class="field-label">Время · Москва (МСК)</p><div class="times" role="group" aria-label="Время визита">${renderTimes()}</div>${nextActions('Далее', !booking.time)}`;
  } else if (step === 2) {
    bookingBody.innerHTML = `<h3 class="form-heading" tabindex="-1">Как к вам обращаться?</h3>${summary()}<form id="contact-form" novalidate><label class="field-label" for="client-name">Ваше имя</label><input class="form-control" id="client-name" name="name" type="text" placeholder="Например, Александра" autocomplete="given-name" maxlength="60" value="${escapeHtml(booking.name)}" aria-describedby="name-error" required /><p class="form-error" id="name-error" hidden></p><label class="field-label" for="client-phone">Номер телефона</label><input class="form-control" id="client-phone" name="phone" type="tel" inputmode="tel" placeholder="+7 (999) 123-45-67" autocomplete="tel" maxlength="24" value="${escapeHtml(booking.phone)}" aria-describedby="phone-error" required /><p class="form-error" id="phone-error" hidden></p><label class="checkbox-label"><input id="client-consent" type="checkbox" name="consent" ${booking.consent ? 'checked' : ''} aria-describedby="consent-error" required /><span>Я понимаю, что это демонстрация: визит не бронируется, имя и телефон не отправляются в салон и не сохраняются.</span></label><p class="form-error" id="consent-error" hidden></p>${nextActions('Посмотреть результат')}</form>`;
    $('#contact-form').addEventListener('submit', submitContact);
  } else {
    bookingBody.innerHTML = `<div class="success-state"><span class="success-icon"><svg class="icon"><use href="#icon-check" /></svg></span><h3 class="form-heading" tabindex="-1">${escapeHtml(booking.name.trim())},<br />всё выглядит прекрасно!</h3><p>Вы прошли все шаги записи. Это демонстрация — настоящий визит в салон пока не забронирован.</p>${summary()}<button class="button button-dark" data-close>Готово ${arrow}</button></div>`;
  }
  if (focusHeading) {
    $('.form-heading', bookingBody)?.focus({ preventScroll: true });
    bookingDialog.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function renderTimes() {
  const times = availableTimes(booking.date, selectedService().duration);
  return times.length ? times.map((time) => `<button class="time-option ${booking.time === time ? 'selected' : ''}" data-time="${time}" aria-pressed="${booking.time === time}">${time}</button>`).join('') : '<p class="empty-times" role="status">На этот день времени уже не осталось. Выберите другую дату.</p>';
}

bookingBody.addEventListener('click', (event) => {
  const serviceButton = event.target.closest('[data-service]');
  if (serviceButton) {
    if (booking.service !== serviceButton.dataset.service) {
      booking.service = serviceButton.dataset.service;
      booking.time = '';
      booking.specialist = 'any';
    }
    $$('[data-service]', bookingBody).forEach((button) => {
      const selected = button.dataset.service === booking.service;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('[data-next]', bookingBody).disabled = false;
    return;
  }
  const dateButton = event.target.closest('[data-date]');
  if (dateButton) {
    booking.date = dateButton.dataset.date;
    booking.time = '';
    $$('[data-date]', bookingBody).forEach((button) => {
      const selected = button.dataset.date === booking.date;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('.times', bookingBody).innerHTML = renderTimes();
    $('[data-next]', bookingBody).disabled = true;
    return;
  }
  const timeButton = event.target.closest('[data-time]');
  if (timeButton) {
    booking.time = timeButton.dataset.time;
    $$('[data-time]', bookingBody).forEach((button) => {
      const selected = button.dataset.time === booking.time;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('[data-next]', bookingBody).disabled = false;
    return;
  }
  if (event.target.closest('[data-next]')) {
    if (step === 0 && !selectedService()) return;
    if (step === 1 && !availableTimes(booking.date, selectedService().duration).includes(booking.time)) {
      booking.time = '';
      renderBooking(true);
      return;
    }
    step += 1;
    renderBooking(true);
  }
  if (event.target.closest('[data-back]')) { step -= 1; renderBooking(true); }
});

bookingBody.addEventListener('input', (event) => {
  const { id, value, checked } = event.target;
  if (id === 'client-name') booking.name = value;
  if (id === 'client-phone') booking.phone = value;
  if (id === 'client-consent') booking.consent = checked;
  const field = ({ 'client-name': 'name', 'client-phone': 'phone', 'client-consent': 'consent' })[id];
  if (field) {
    event.target.removeAttribute('aria-invalid');
    $(`#${field}-error`).hidden = true;
  }
});
bookingBody.addEventListener('change', (event) => {
  if (event.target.id === 'specialist') {
    booking.specialist = event.target.value;
    booking.time = '';
    $('.times', bookingBody).innerHTML = renderTimes();
    $('[data-next]', bookingBody).disabled = true;
  }
});

function submitContact(event) {
  event.preventDefault();
  // Read live controls as well as input events so browser autofill is respected.
  booking.name = $('#client-name').value;
  booking.phone = $('#client-phone').value;
  booking.consent = $('#client-consent').checked;
  const errors = validateContact(booking);
  for (const field of ['name', 'phone', 'consent']) {
    const error = $(`#${field}-error`);
    error.textContent = errors[field] || '';
    error.hidden = !errors[field];
    $(`#client-${field}`).setAttribute('aria-invalid', String(Boolean(errors[field])));
  }
  if (Object.keys(errors).length) {
    $(`#client-${Object.keys(errors)[0]}`).focus();
    return;
  }
  if (!availableTimes(booking.date, selectedService().duration).includes(booking.time)) {
    booking.time = '';
    step = 1;
    renderBooking(true);
    const notice = document.createElement('p');
    notice.className = 'form-error';
    notice.setAttribute('role', 'alert');
    notice.textContent = 'Выбранное время уже прошло. Пожалуйста, выберите другое.';
    bookingBody.prepend(notice);
    return;
  }
  step = 3;
  renderBooking(true);
}
