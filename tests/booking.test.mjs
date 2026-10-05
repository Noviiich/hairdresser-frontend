import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, upcomingDates, availableTimes, normalizePhone, validateContact, escapeHtml, durationLabel } from '../src/booking.js';
import { services, bookingServices, specialists } from '../src/data.js';

test('calendar follows the salon timezone across UTC midnight and month/year boundaries', () => {
  const now = new Date('2026-12-31T21:30:00Z');
  assert.equal(dateKey(now), '2027-01-01');
  const dates = upcomingDates(new Date('2026-12-30T12:00:00Z'));
  assert.equal(dates.length, 7);
  assert.equal(dates[0].key, '2026-12-30');
  assert.equal(dates[2].key, '2027-01-01');
  assert.equal(dates[6].key, '2027-01-05');
  assert.equal(dates[0].weekday, 'Сегодня');
});

test('calendar includes leap day', () => {
  assert.deepEqual(upcomingDates(new Date('2028-02-28T09:00:00Z'), 3).map((date) => date.key), ['2028-02-28', '2028-02-29', '2028-03-01']);
});

test('past slots and the one-hour preparation window are excluded', () => {
  const now = new Date('2026-10-05T10:10:00+03:00');
  const times = availableTimes('2026-10-05', 60, now);
  assert.equal(times[0], '11:30');
  assert.equal(times.at(-1), '20:00');
  assert.deepEqual(availableTimes('2026-10-04', 60, now), []);
  assert.deepEqual(availableTimes('2026-10-05', 60, new Date('2026-10-05T20:01:00+03:00')), []);
});

test('long services must finish before closing; future days begin at 10:00', () => {
  const times = availableTimes('2026-10-06', 240, new Date('2026-10-05T12:00:00Z'));
  assert.equal(times[0], '10:00');
  assert.equal(times.at(-1), '17:00');
  assert.equal(availableTimes('2026-10-06', 45, new Date('2026-10-05T12:00:00Z')).at(-1), '20:00');
  assert.deepEqual(availableTimes('not-a-date', 60), []);
  assert.deepEqual(availableTimes('2026-02-31', 60), []);
  assert.deepEqual(availableTimes('2026-99-99', 60), []);
  assert.deepEqual(availableTimes('2026-10-06', -1), []);
});

test('Russian phone numbers accept formatting, +7, 8 and domestic numbers', () => {
  for (const input of ['+7 (999) 123-45-67', '8 999 123 45 67', '9991234567']) assert.equal(normalizePhone(input), '+79991234567');
  for (const input of ['', '123', '+1 999 123 4567', '+799912345678', 'abcdefghijk']) assert.equal(normalizePhone(input), null);
});

test('contact submission requires valid name, phone and acknowledgement', () => {
  assert.deepEqual(validateContact({ name: '  Анна  ', phone: '+79991234567', consent: true }), {});
  assert.deepEqual(Object.keys(validateContact({ name: ' ', phone: '123', consent: false })), ['name', 'phone', 'consent']);
  assert.ok(validateContact({ name: 'а'.repeat(61), phone: '+79991234567', consent: true }).name);
});

test('user content is escaped before rendering and durations are human-readable', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(escapeHtml("O'Brien & Co"), 'O&#39;Brien &amp; Co');
  assert.equal(durationLabel(45), '45 мин');
  assert.equal(durationLabel(90), '1 ч 30 мин');
});

test('every service has a unique identifier and an eligible specialist', () => {
  assert.equal(new Set(bookingServices.map((service) => service.id)).size, bookingServices.length);
  assert.equal(services.length, 6);
  for (const service of bookingServices) {
    assert.ok(specialists.some((specialist) => specialist.id !== 'any' && specialist.categories.includes(service.category)));
    assert.ok(service.duration > 0);
  }
});
