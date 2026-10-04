import { configure, getAudio, reset } from '../src/context';
import { installFakeAudio, uninstallFakeAudio } from './helpers';

afterEach(() => {
  uninstallFakeAudio();
  reset();
});

it('returns undefined when Web Audio API is unavailable', () => {
  expect(getAudio()).toBeUndefined();
});

it('creates the context lazily and memoizes it', () => {
  const fake = installFakeAudio();
  const first = getAudio();
  expect(first).toBeDefined();
  expect(getAudio()).toBe(first);
  expect(fake.contextConstructor).toHaveBeenCalledTimes(1);
});

it('connects a master gain to the destination at full volume', () => {
  const fake = installFakeAudio();
  getAudio();
  expect(fake.gains).toHaveLength(1);
  expect(fake.gains[0].gain.value).toBe(1);
  expect(fake.gains[0].connect).toHaveBeenCalledWith(fake.context.destination);
});

it('resumes a suspended context', () => {
  const fake = installFakeAudio({ state: 'suspended' });
  getAudio();
  expect(fake.resume).toHaveBeenCalledTimes(1);
});

it('does not resume a running context', () => {
  const fake = installFakeAudio();
  getAudio();
  expect(fake.resume).not.toHaveBeenCalled();
});

it('swallows resume rejections', async () => {
  const fake = installFakeAudio({
    state: 'suspended',
    resume: () => Promise.reject(new Error('blocked by autoplay policy')),
  });
  expect(() => getAudio()).not.toThrow();
  expect(fake.resume).toHaveBeenCalledTimes(1);
  await Promise.resolve();
});

it('returns undefined when the constructor throws', () => {
  vi.stubGlobal(
    'AudioContext',
    vi.fn(function denied() {
      throw new Error('denied');
    }),
  );
  expect(getAudio()).toBeUndefined();
});

it('returns the default configuration', () => {
  expect(configure()).toEqual({ volume: 1 });
});

it('applies updates and returns the configuration', () => {
  expect(configure({ volume: 0.5 })).toEqual({ volume: 0.5 });
  expect(configure({ volume: 0.8 })).toEqual({ volume: 0.8 });
});

it('ignores updates without a volume', () => {
  expect(configure({})).toEqual({ volume: 1 });
});

it('clamps the volume to 0..1', () => {
  expect(configure({ volume: 5 }).volume).toBe(1);
  expect(configure({ volume: -1 }).volume).toBe(0);
});

it('applies volume to a live master gain', () => {
  const fake = installFakeAudio();
  getAudio();
  configure({ volume: 0.3 });
  expect(fake.gains[0].gain.value).toBe(0.3);
});

it('silences the master gain and stops producing audio at volume 0', () => {
  const fake = installFakeAudio();
  getAudio();
  expect(configure({ volume: 0 })).toEqual({ volume: 0 });
  expect(fake.gains[0].gain.value).toBe(0);
  expect(getAudio()).toBeUndefined();
});

it('resumes playback when the volume is restored', () => {
  const fake = installFakeAudio();
  configure({ volume: 0 });
  expect(getAudio()).toBeUndefined();
  expect(fake.contextConstructor).not.toHaveBeenCalled();
  configure({ volume: 1 });
  expect(getAudio()).toBeDefined();
});

it('resets the memoized context and configuration', () => {
  const fake = installFakeAudio();
  getAudio();
  configure({ volume: 0.2 });
  reset();
  expect(configure()).toEqual({ volume: 1 });
  getAudio();
  expect(fake.contextConstructor).toHaveBeenCalledTimes(2);
});
