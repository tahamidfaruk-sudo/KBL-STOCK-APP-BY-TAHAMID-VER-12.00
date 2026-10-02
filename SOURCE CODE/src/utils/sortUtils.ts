/**
 * Universal sort utility for tabular records
 */
export function sortData<T>(list: T[], sortKey: string, sortDir: 'asc' | 'desc' = 'asc'): T[] {
  if (!sortKey || !Array.isArray(list)) return list;

  return [...list].sort((a: any, b: any) => {
    let valA = a?.[sortKey];
    let valB = b?.[sortKey];

    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    // Numeric comparison
    const numA = Number(valA);
    const numB = Number(valB);
    if (!isNaN(numA) && !isNaN(numB) && typeof valA !== 'boolean' && typeof valB !== 'boolean' && String(valA).trim() !== '' && String(valB).trim() !== '') {
      return sortDir === 'asc' ? numA - numB : numB - numA;
    }

    // String / Date comparison
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();

    if (strA < strB) return sortDir === 'asc' ? -1 : 1;
    if (strA > strB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}
