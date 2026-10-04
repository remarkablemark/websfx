import { reset } from '../src/context';
import { noise, sequence, tone } from '../src/engine';
import { installFakeAudio, uninstallFakeAudio } from './helpers';

afterEach(() => {
  uninstallFakeAudio();
  reset();
});

it('plays an oscillator through an envelope', () => {
  const fake = installFakeAudio();
  tone({ frequency: 440, duration: 0.2, type: 'square', volume: 0.5 });
  expect(fake.oscillators).toHaveLength(1);
  expect(fake.gains).toHaveLength(2);
  const [oscillator] = fake.oscillators;
  const [master, envelope] = fake.gains;
  expect(oscillator.type).toBe('square');
  expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0);
  expect(oscillator.connect).toHaveBeenCalledWith(envelope);
  expect(envelope.connect).toHaveBeenCalledWith(master);
  expect(envelope.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, 0);
  expect(envelope.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
    0.5,
    0.005,
  );
  expect(envelope.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
    0.0001,
    0.2,
  );
  expect(oscillator.start).toHaveBeenCalledWith(0);
  expect(oscillator.stop).toHaveBeenCalledWith(0.2);
});

it('scales frequency by pitch and sweeps to the end frequency', () => {
  const fake = installFakeAudio();
  tone({ frequency: 1000, endFrequency: 500, duration: 0.1, pitch: 2 });
  const [oscillator] = fake.oscillators;
  expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(2000, 0);
  expect(
    oscillator.frequency.exponentialRampToValueAtTime,
  ).toHaveBeenCalledWith(1000, 0.1);
});

it('schedules tones with a delay', () => {
  const fake = installFakeAudio();
  tone({ frequency: 440, duration: 0.1, delay: 0.5 });
  expect(fake.oscillators[0].start).toHaveBeenCalledWith(0.5);
});

it('clamps volume to 1', () => {
  const fake = installFakeAudio();
  tone({ frequency: 440, volume: 10 });
  expect(fake.gains[1].gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
    1,
    0.005,
  );
});

it('is silent when volume is 0', () => {
  const fake = installFakeAudio();
  tone({ frequency: 440, volume: 0 });
  expect(fake.createOscillator).not.toHaveBeenCalled();
});

it('is silent for a non-positive duration', () => {
  const fake = installFakeAudio();
  tone({ frequency: 440, duration: 0 });
  expect(fake.createOscillator).not.toHaveBeenCalled();
});

it('is silent for a non-positive frequency', () => {
  const fake = installFakeAudio();
  tone({ frequency: 0 });
  expect(fake.createOscillator).not.toHaveBeenCalled();
});

it('does nothing without an AudioContext', () => {
  expect(() => {
    tone({ frequency: 440 });
  }).not.toThrow();
});

it('plays filtered noise', () => {
  const fake = installFakeAudio();
  noise({
    duration: 0.05,
    type: 'bandpass',
    frequency: 2000,
    pitch: 2,
    q: 4,
    volume: 0.3,
  });
  expect(fake.sources).toHaveLength(1);
  expect(fake.filters).toHaveLength(1);
  const [source] = fake.sources;
  const [filter] = fake.filters;
  const [, envelope] = fake.gains;
  expect(filter.type).toBe('bandpass');
  expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(4000, 0);
  expect(filter.Q.value).toBe(4);
  expect(source.buffer).not.toBeNull();
  expect(source.connect).toHaveBeenCalledWith(filter);
  expect(filter.connect).toHaveBeenCalledWith(envelope);
  expect(envelope.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
    0.3,
    0.002,
  );
  expect(source.start).toHaveBeenCalledWith(0);
  expect(source.stop).toHaveBeenCalledWith(0.05);
});

it('reuses the noise buffer', () => {
  const fake = installFakeAudio();
  noise();
  noise();
  expect(fake.createBuffer).toHaveBeenCalledTimes(1);
  expect(fake.sources).toHaveLength(2);
});

it('applies the default filter cutoff without a Q', () => {
  const fake = installFakeAudio();
  noise();
  expect(fake.filters[0].frequency.setValueAtTime).toHaveBeenCalledWith(
    1500,
    0,
  );
});

it('is silent when noise volume is 0', () => {
  const fake = installFakeAudio();
  noise({ volume: 0 });
  expect(fake.createBufferSource).not.toHaveBeenCalled();
});

it('is silent for a non-positive noise duration', () => {
  const fake = installFakeAudio();
  noise({ duration: 0 });
  expect(fake.createBufferSource).not.toHaveBeenCalled();
});

it('does nothing without an AudioContext for noise', () => {
  expect(() => {
    noise();
  }).not.toThrow();
});

it('schedules notes with cumulative delays', () => {
  const fake = installFakeAudio();
  sequence(
    [
      { frequency: 440, duration: 0.1 },
      { frequency: 880, duration: 0.2 },
    ],
    { gap: 0.1, type: 'triangle', volume: 0.4 },
  );
  expect(fake.oscillators).toHaveLength(2);
  expect(fake.oscillators[0].type).toBe('triangle');
  expect(fake.oscillators[0].start).toHaveBeenCalledWith(0);
  expect(fake.oscillators[1].start).toHaveBeenCalledWith(0.2);
  expect(fake.gains[1].gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
    0.4,
    0.005,
  );
});

it('uses default note duration, gap, and waveform', () => {
  const fake = installFakeAudio();
  sequence([{ frequency: 440 }, { frequency: 880 }]);
  expect(fake.oscillators).toHaveLength(2);
  expect(fake.oscillators[1].start).toHaveBeenCalledWith(0.1);
  expect(fake.oscillators[0].type).toBe('sine');
});

it('applies pitch to every note', () => {
  const fake = installFakeAudio();
  sequence([{ frequency: 440 }], { pitch: 2 });
  expect(fake.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
    880,
    0,
  );
});
