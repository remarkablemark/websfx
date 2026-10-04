import * as api from '../src/index';

const expected = [
  'back',
  'beep',
  'cancel',
  'click',
  'close',
  'configure',
  'copy',
  'deselect',
  'doubleClick',
  'drag',
  'drop',
  'error',
  'focus',
  'forward',
  'hover',
  'longPress',
  'notification',
  'open',
  'paste',
  'press',
  'reaction',
  'release',
  'remove',
  'select',
  'success',
  'type',
  'warning',
];

it('exports the public API', () => {
  expect(Object.keys(api).sort()).toEqual(expected);
});

it('is safe to call sounds without Web Audio API', () => {
  expect(() => {
    api.click();
  }).not.toThrow();
});
