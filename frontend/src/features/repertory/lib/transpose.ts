const sharpNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const flatNotes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const noteIndex: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

const chordPattern =
  /^([A-G](?:#|b)?)(m|maj|min|dim|aug|sus|add|[0-9(].*)?([^\s]*)?(?:\/([A-G](?:#|b)?))?$/;
const sectionPattern = /^\[[^\]]+\]$/;

export function transposeCifra(lines: string[], offset: number) {
  if (offset === 0) {
    return lines;
  }

  return lines.map((line) => (isChordLine(line) ? transposeLine(line, offset) : line));
}

export function transposeKey(key: string | null, offset: number) {
  if (!key) {
    return null;
  }

  const match = key.match(/^([A-G](?:#|b)?)(m?)$/);

  if (!match) {
    return key;
  }

  return `${transposeNote(match[1], offset)}${match[2]}`;
}

export function formatKeyOffset(offset: number) {
  if (offset === 0) {
    return 'Tom original';
  }

  return `${offset > 0 ? '+' : ''}${offset} semitom${Math.abs(offset) === 1 ? '' : 's'}`;
}

export function formatSongKey(originalKey: string | null, offset: number) {
  return transposeKey(originalKey, offset) ?? formatKeyOffset(offset);
}

function transposeLine(line: string, offset: number) {
  return line
    .split(/(\s+)/)
    .map((part) => (part.trim() ? transposeChord(part, offset) : part))
    .join('');
}

export function transposeChordText(value: string, offset: number) {
  if (offset === 0) {
    return value;
  }

  return value
    .split(/(\s+)/)
    .map((part) => (part.trim() ? transposeChord(part, offset) : part))
    .join('');
}

function transposeChord(chord: string, offset: number) {
  const match = chord.match(chordPattern);

  if (!match) {
    return chord;
  }

  const [, root, quality = '', suffix = '', bass] = match;
  const nextRoot = transposeNote(root, offset);
  const nextBass = bass ? `/${transposeNote(bass, offset)}` : '';

  return `${nextRoot}${quality}${suffix}${nextBass}`;
}

function transposeNote(note: string, offset: number) {
  const index = noteIndex[note];

  if (index === undefined) {
    return note;
  }

  const scale = note.includes('b') ? flatNotes : sharpNotes;
  const nextIndex = (((index + offset) % 12) + 12) % 12;

  return scale[nextIndex];
}

function isChordLine(line: string) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return false;
  }

  return tokens.every(
    (token) => sectionPattern.test(token) || chordPattern.test(token),
  );
}

export function isChordToken(token: string) {
  return chordPattern.test(token);
}

export function isSectionToken(token: string) {
  return sectionPattern.test(token);
}
