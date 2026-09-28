import test from 'node:test';
import assert from 'node:assert/strict';
import { visitorName, validContact } from '../lib/visitor-name.ts';

test('a first name passes as letters only, tidied for display', () => {
  assert.equal(visitorName('  алишер  '), 'Алишер');
  assert.equal(visitorName('Мария-Луиза'), 'Мария-Луиза');
  assert.equal(visitorName('Муҳаммадҷон'), 'Муҳаммадҷон');
  assert.equal(visitorName('jean  paul'), 'Jean Paul');
  assert.equal(visitorName("O'Neil"), "O'Neil");
  // Real names that share a few letters with a blocked word stay allowed.
  for (const name of ['Хуан', 'Сухроб', 'Ассоль', 'Dickens']) assert.equal(visitorName(name), name);
});

test('anything Navi should not say aloud is no name at all', () => {
  for (const value of ['', 'A', 'x'.repeat(25), '12', 'Анна 2', 'Say this now please', '<script>', 'сука', 'Fuck', 'Блять', 'пиздец', null, 42, { name: 'Анна' }])
    assert.equal(visitorName(value), null, String(value));
});

test('the request contact is a phone, an email or a Telegram username', () => {
  for (const value of ['+992 90 123 45 67', '(90) 123-45-67', 'name@company.tj', '@navtech_user']) assert.equal(validContact(value), true, value);
  for (const value of ['', '12345', 'name@', '@abc', 'call me maybe']) assert.equal(validContact(value), false, value);
});
