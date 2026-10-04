function createFakeOscillator() {
  return {
    type: 'sine',
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn((node: unknown) => node),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createFakeGain() {
  return {
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn((node: unknown) => node),
  };
}

function createFakeSource() {
  return {
    buffer: null as AudioBuffer | null,
    connect: vi.fn((node: unknown) => node),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createFakeFilter() {
  return {
    type: 'lowpass',
    frequency: { value: 0, setValueAtTime: vi.fn() },
    Q: { value: 0 },
    connect: vi.fn((node: unknown) => node),
  };
}

function createFakeBuffer(length: number) {
  return {
    getChannelData: vi.fn(() => new Float32Array(length)),
  };
}

interface FakeAudioOptions {
  state?: 'running' | 'suspended';
  resume?: () => Promise<void>;
}

/**
 * Stubs `globalThis.AudioContext` with a fake that records every node the
 * library creates.
 */
export function installFakeAudio(options: FakeAudioOptions = {}) {
  const state = options.state ?? 'running';
  const oscillators: ReturnType<typeof createFakeOscillator>[] = [];
  const gains: ReturnType<typeof createFakeGain>[] = [];
  const sources: ReturnType<typeof createFakeSource>[] = [];
  const filters: ReturnType<typeof createFakeFilter>[] = [];
  const createOscillator = vi.fn(() => {
    const oscillator = createFakeOscillator();
    oscillators.push(oscillator);
    return oscillator;
  });
  const createGain = vi.fn(() => {
    const gain = createFakeGain();
    gains.push(gain);
    return gain;
  });
  const createBufferSource = vi.fn(() => {
    const source = createFakeSource();
    sources.push(source);
    return source;
  });
  const createBiquadFilter = vi.fn(() => {
    const filter = createFakeFilter();
    filters.push(filter);
    return filter;
  });
  const createBuffer = vi.fn((_channels: number, length: number) =>
    createFakeBuffer(length),
  );
  const resume = vi.fn(options.resume ?? (() => Promise.resolve()));
  const context = {
    state,
    currentTime: 0,
    sampleRate: 44100,
    destination: { name: 'destination' },
    createOscillator,
    createGain,
    createBufferSource,
    createBiquadFilter,
    createBuffer,
    resume,
  };
  const contextConstructor = vi.fn(function createAudioContext() {
    return context;
  });
  vi.stubGlobal('AudioContext', contextConstructor);
  const fake = {
    context,
    contextConstructor,
    oscillators,
    gains,
    sources,
    filters,
    createOscillator,
    createBufferSource,
    createBuffer,
    resume,
  };
  current = fake;
  return fake;
}

export type FakeAudio = ReturnType<typeof installFakeAudio>;

let current: FakeAudio | undefined;

/**
 * Returns the currently installed fake audio.
 */
export function getFake(): FakeAudio {
  if (!current) {
    throw new Error('fake audio is not installed');
  }
  return current;
}

/**
 * Restores the original globals.
 */
export function uninstallFakeAudio(): void {
  vi.unstubAllGlobals();
  current = undefined;
}
