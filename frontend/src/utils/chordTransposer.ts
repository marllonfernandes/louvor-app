/**
 * Utilitário para transposição musical de tons
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
  if (!key) return key;

  const isMinor = key.endsWith('m') && !key.endsWith('dim');
  const root = isMinor ? key.slice(0, -1) : key;

  let index = CHROMATIC_SCALE.indexOf(root);
  if (index === -1) {
    index = FLAT_SCALE.indexOf(root);
  }

  if (index === -1) return key; // Não encontrou o tom base

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) {
    newIndex += 12;
  }

  const newRoot = CHROMATIC_SCALE[newIndex];
  return isMinor ? `${newRoot}m` : newRoot;
}
