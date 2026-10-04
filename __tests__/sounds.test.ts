import { configure, reset } from '../src/context';
import * as sounds from '../src/sounds';
import { getFake, installFakeAudio, uninstallFakeAudio } from './helpers';

function nodeCount(): number {
  const fake = getFake();
  return fake.oscillators.length + fake.sources.length;
}

beforeEach(() => {
  installFakeAudio();
});

afterEach(() => {
  uninstallFakeAudio();
  reset();
});

it('exports the correct number of sounds', () => {
  expect(Object.keys(sounds)).toHaveLength(26);
});

it.each(Object.entries(sounds))('%s plays a sound', (_name, play) => {
  play();
  expect(nodeCount()).toBeGreaterThan(0);
});

it.each(Object.entries(sounds))(
  '%s accepts per-call options',
  (_name, play) => {
    play({ volume: 0.5, pitch: 1.5 });
    expect(nodeCount()).toBeGreaterThan(0);
  },
);

it('doubleClick plays two clicks', () => {
  sounds.doubleClick();
  const fake = getFake();
  expect(fake.oscillators).toHaveLength(2);
  expect(fake.oscillators[1].start).toHaveBeenCalledWith(0.09);
});

it('drop combines a thud and noise', () => {
  sounds.drop();
  const fake = getFake();
  expect(fake.oscillators).toHaveLength(1);
  expect(fake.sources).toHaveLength(1);
});

it('type plays a noise tap', () => {
  sounds.type();
  const fake = getFake();
  expect(fake.oscillators).toHaveLength(0);
  expect(fake.sources).toHaveLength(1);
});

it('success plays a four note arpeggio', () => {
  sounds.success();
  expect(getFake().oscillators).toHaveLength(4);
});

it('warning plays four alternating tones', () => {
  sounds.warning();
  expect(getFake().oscillators).toHaveLength(4);
});

it('beep defaults to 880 Hz', () => {
  sounds.beep();
  expect(
    getFake().oscillators[0].frequency.setValueAtTime,
  ).toHaveBeenCalledWith(880, 0);
});

it('beep accepts a frequency', () => {
  sounds.beep({ frequency: 440 });
  expect(
    getFake().oscillators[0].frequency.setValueAtTime,
  ).toHaveBeenCalledWith(440, 0);
});

it('applies per-call volume to the envelope', () => {
  sounds.click({ volume: 0.25 });
  expect(
    getFake().gains[1].gain.exponentialRampToValueAtTime,
  ).toHaveBeenCalledWith(0.25, 0.005);
});

it('is silent when the master volume is 0', () => {
  configure({ volume: 0 });
  sounds.click();
  sounds.type();
  expect(nodeCount()).toBe(0);
});
