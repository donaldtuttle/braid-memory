import { mulberry32, pick } from '../braid/rng.ts';
import { UPDATES, type Case, type Condition, type MemoryRecord, type Settings } from './types.ts';

export function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function validateSettings(s: Settings): void {
  const ranges: [keyof Settings, number, number, boolean][] = [
    ['seed', 0, 4294967295, true], ['histories', 10, 200, true],
    ['missing', 0, 1, false], ['distractors', 0, 64, true], ['jitter', 0, 30, true],
  ];
  for (const [name, min, max, integer] of ranges) {
    const n = s[name];
    if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
      throw new Error(`${name} must be ${integer ? 'an integer' : 'a number'} from ${min} to ${max}.`);
    }
  }
}
export function conditionsFor(s: Settings): Condition[] {
  const base = { missing: s.missing, distractors: s.distractors, jitter: s.jitter, delayShift: 0 };
  return [
    { ...base, id: 'primary', label: 'Selected settings', description: 'The primary comparison at your chosen difficulty.' },
    { ...base, missing: Math.min(1, s.missing + 0.30), id: 'clues', label: 'Fewer clues', description: 'Hide 30 percentage points more of each update’s clues.' },
    { ...base, delayShift: 18, id: 'delay', label: 'Longer delays', description: 'Updates arrive 18 time units later than expected.' },
    { ...base, jitter: Math.min(48, s.jitter + 18), id: 'jitter', label: 'Changing delays', description: 'Vary the delay more; updates can arrive out of order.' },
  ];
}
export function generateCase(seed: number, condition: Condition): Case {
  // Separate streams keep sources and clue masks paired across challenge conditions.
  const rng = mulberry32(seed);
  const masks = mulberry32(seed ^ 0x53ab1247);
  const delays = mulberry32(seed ^ 0x741cb196);
  const count = 16 + condition.distractors;
  const ids = shuffled(Array.from({ length: count }, (_, i) => `A-${i + 1}`), mulberry32(seed ^ 0x671ad1));
  let time = 0;
  const observations: MemoryRecord[] = Array.from({ length: count }, (_, i) => {
    time += 2 + Math.floor(rng() * 3);
    const clues = [pick(rng, ['north', 'south', 'east', 'west']), pick(rng, ['pump', 'fan', 'valve', 'sensor']), pick(rng, ['warm', 'noisy', 'idle', 'unstable'])];
    return { id: ids[i], time, clues, text: `Observed ${clues[0]} ${clues[1]}: ${clues[2]}.` };
  });
  const sources = shuffled(observations, rng).slice(0, UPDATES);
  const updateIds = shuffled(Array.from({ length: UPDATES }, (_, i) => `B-${i + 1}`), rng);
  const answers: Record<string, string> = {};
  const updates = sources.map((source, i) => {
    const id = updateIds[i];
    answers[id] = source.id;
    const clues = source.clues.filter(() => masks() >= condition.missing);
    const delay = Math.max(1, 12 + condition.delayShift + (delays() * 2 - 1) * condition.jitter);
    return { id, time: Math.round((source.time + delay) * 100) / 100, clues,
      text: clues.length ? `Follow-up message: ${clues.join(' · ')}. Which observation led to this update?` : 'Follow-up message: all content clues missing. Which observation led to this update?' };
  });
  return { seed, public: { observations, updates: updates.sort((a, b) => a.time - b.time || a.id.localeCompare(b.id)), nominalDelay: 12 }, answers };
}
