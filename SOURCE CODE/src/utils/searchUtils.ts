/**
 * Universal search utility that matches query tokens across record values and specified extra fields
 */
export function matchesUniversalSearch(
  record: any,
  query: string,
  extraFields?: (string | number | undefined | null)[]
): boolean {
  if (!query || !query.trim()) {
    return true;
  }

  const terms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    return true;
  }

  // Collect candidate strings
  const stringPool: string[] = [];

  if (extraFields && Array.isArray(extraFields)) {
    for (const val of extraFields) {
      if (val !== null && val !== undefined) {
        stringPool.push(String(val).toLowerCase());
      }
    }
  }

  if (record && typeof record === 'object') {
    for (const key of Object.keys(record)) {
      const val = record[key];
      if (typeof val === 'string' || typeof val === 'number') {
        stringPool.push(String(val).toLowerCase());
      }
    }
  }

  const combined = stringPool.join(' ');

  // All terms must appear somewhere in combined text
  return terms.every((term) => combined.includes(term));
}
