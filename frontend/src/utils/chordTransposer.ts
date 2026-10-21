/**
 * Utilitário para transposição musical de tons e cifras
 */

export const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_SCALE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ALL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm'
];

/**
 * Transpõe um tom por um número de semitons (+1, -1, +2, etc.)
 */
export function transposeKey(key: string, semitones: number): string {
  if (!key || semitones === 0) return key;

  const isMinor = key.endsWith('m') && !key.endsWith('dim');
  const root = isMinor ? key.slice(0, -1) : key;

  let index = CHROMATIC_SCALE.indexOf(root);
  if (index === -1) {
    index = FLAT_SCALE.indexOf(root);
  }

  if (index === -1) return key;

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) {
    newIndex += 12;
  }

  const newRoot = CHROMATIC_SCALE[newIndex];
  return isMinor ? `${newRoot}m` : newRoot;
}

/**
 * Transpõe um acorde completo (ex: "D/F#", "Em7", "B7(9)", "F#m", "Bb")
 */
export function transposeChord(chord: string, semitones: number): string {
  if (!chord || semitones === 0) return chord;

  if (chord.includes('/')) {
    const parts = chord.split('/');
    return `${transposeChord(parts[0], semitones)}/${transposeChord(parts[1], semitones)}`;
  }

  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const suffix = match[2];

  let index = CHROMATIC_SCALE.indexOf(root);
  if (index === -1) {
    index = FLAT_SCALE.indexOf(root);
  }

  if (index === -1) return chord;

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) {
    newIndex += 12;
  }

  const newRoot = CHROMATIC_SCALE[newIndex];
  return `${newRoot}${suffix}`;
}

/**
 * Transpõe um texto de cifra identificando tokens de acordes
 */
export function transposeLyrics(text: string, semitones: number): string {
  if (!text || semitones === 0) return text;

  const chordRegex = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|[0-9]+)*(?:\/[A-G][#b]?)?)\b/g;

  return text.split('\n').map(line => {
    if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
      return line;
    }
    return line.replace(chordRegex, match => transposeChord(match, semitones));
  }).join('\n');
}
