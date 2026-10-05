export const SALON_TIMEZONE = 'Europe/Moscow';

export function dateKey(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: SALON_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function upcomingDates(now = new Date(), count = 7) {
  const start = new Date(`${dateKey(now)}T12:00:00Z`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      day: date.getUTCDate(),
      weekday: index === 0 ? 'Сегодня' : new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: 'UTC' }).format(date),
      month: new Intl.DateTimeFormat('ru-RU', { month: 'short', timeZone: 'UTC' }).format(date).replace('.', ''),
    };
  });
}

// Example slots only: no server availability is implied. Salon hours: 10:00–21:00 MSK.
export function availableTimes(day, duration, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(duration) || duration <= 0) return [];
  const calendarDate = new Date(`${day}T12:00:00Z`);
  if (!Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== day) return [];
  const result = [];
  for (let minutes = 10 * 60; minutes + duration <= 21 * 60; minutes += 30) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const start = new Date(`${day}T${time}:00+03:00`).getTime();
    if (Number.isFinite(start) && start >= now.getTime() + 60 * 60 * 1000) result.push(time);
  }
  return result;
}

export function normalizePhone(value) {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 11 && /^[78]/.test(digits)) return `+7${digits.slice(1)}`;
  if (digits.length === 10 && /^[349]/.test(digits)) return `+7${digits}`;
  return null;
}

export function validateContact({ name, phone, consent }) {
  const errors = {};
  if (typeof name !== 'string' || name.trim().length < 2) errors.name = 'Введите имя — не менее двух символов.';
  else if (name.trim().length > 60) errors.name = 'Имя должно быть не длиннее 60 символов.';
  if (!normalizePhone(phone)) errors.phone = 'Введите российский номер из 11 цифр, начиная с +7 или 8.';
  if (!consent) errors.consent = 'Подтвердите, что вы ознакомились с условиями демо-записи.';
  return errors;
}

export const money = (amount) => new Intl.NumberFormat('ru-RU').format(amount);
export const priceLabel = (service) => service.price === 0 ? 'Бесплатно' : `от ${money(service.price)} ₽`;
export function durationLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours ? `${hours} ч` : '', rest ? `${rest} мин` : ''].filter(Boolean).join(' ');
}
export function fullDate(day) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', weekday: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
}
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
