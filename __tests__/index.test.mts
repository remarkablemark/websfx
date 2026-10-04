import { click, configure, success } from '../dist/index.mjs';

describe('dist', () => {
  it('exports the public API', () => {
    assert.strictEqual(typeof click, 'function');
    assert.strictEqual(typeof configure, 'function');
    assert.strictEqual(typeof success, 'function');
  });

  it('plays sounds as a no-op without Web Audio API', () => {
    assert.doesNotThrow(click);
  });
});
