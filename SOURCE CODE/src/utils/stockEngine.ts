import {
  ColdStorage,
  DeliveryTransaction,
  FilterState,
  Grade,
  SeedClass,
  StockTransaction,
  Variety,
} from '../types';

export function getPotatoClassOrderRank(name: string = '', code: string = ''): number {
  const n = (name || '').toLowerCase();
  const c = (code || '').toUpperCase();
  if (c === 'PF' || c === 'PFS' || n.includes('pre-foundation') || n.includes('pre foundation')) return 1;
  if (c === 'FS' || n.includes('foundation')) return 2;
  if (c === 'CS' || n.includes('certified') || n.includes('certif')) return 3;
  if (c === 'TLS' || n.includes('tls') || n.includes('truth')) return 4;
  if (c === 'BS' || c === 'BRD' || c === 'MT' || n.includes('breeder') || n.includes('mini tuber')) return 5;
  if (c === 'TP' || n.includes('table')) return 6;
  if (c === 'NT' || n.includes('non traceable') || n.includes('non-traceable')) return 7;
  return 8;
}

export function getGradeOrderRank(name: string = '', spec: string = ''): number {
  const n = (name || '').toLowerCase();
  const s = (spec || '').toLowerCase();
  if (n === 'a' || n.includes('grade a') || s.includes('28-40')) return 1;
  if (n === 'b' || n.includes('grade b') || s.includes('40-55')) return 2;
  if (n === 'us' || n.includes('under size') || n.includes('<28')) return 3;
  if (n === 'os' || n.includes('over size') || n.includes('>55')) return 4;
  if (n === 'tp' || n.includes('table potato')) return 5;
  return 6;
}

export interface StockBalanceMatrixItem {
  coldStorageId: string;
  coldStorageName: string;
  coldStorageCode?: string;
  varietyId: string;
  varietyName: string;
  classId: string;
  className: string;
  gradeId: string;
  gradeName: string;
  inboundBags: number;
  inboundMt: number;
  deliveredBags: number;
  deliveredMt: number;
  balanceBags: number;
  balanceMt: number;
  occupancyRate?: number;
}

export function calculateStockBalanceMatrix(
  stockTransactions: StockTransaction[],
  deliveryTransactions: DeliveryTransaction[],
  coldStorages: ColdStorage[],
  varieties: Variety[],
  seedClasses: SeedClass[],
  grades: Grade[]
): StockBalanceMatrixItem[] {
  const groupMap = new Map<string, {
    coldStorageId: string;
    varietyId: string;
    classId: string;
    gradeId: string;
    inboundBags: number;
    inboundMt: number;
    deliveredBags: number;
    deliveredMt: number;
  }>();

  for (const s of stockTransactions) {
    if (s.status !== 'approved') continue;
    const key = `${s.coldStorageId}|${s.varietyId}|${s.classId}|${s.gradeId}`;
    const entry = groupMap.get(key) || {
      coldStorageId: s.coldStorageId,
      varietyId: s.varietyId,
      classId: s.classId,
      gradeId: s.gradeId,
      inboundBags: 0,
      inboundMt: 0,
      deliveredBags: 0,
      deliveredMt: 0,
    };
    entry.inboundBags += s.sackQuantity || 0;
    entry.inboundMt += s.totalMt || Number(((s.sackQuantity * (s.kgPerBag || 50)) / 1000).toFixed(3));
    groupMap.set(key, entry);
  }

  for (const d of deliveryTransactions) {
    if (d.status !== 'approved' && d.status !== 'completed') continue;
    const key = `${d.coldStorageId}|${d.varietyId}|${d.classId}|${d.gradeId}`;
    const entry = groupMap.get(key) || {
      coldStorageId: d.coldStorageId,
      varietyId: d.varietyId,
      classId: d.classId,
      gradeId: d.gradeId,
      inboundBags: 0,
      inboundMt: 0,
      deliveredBags: 0,
      deliveredMt: 0,
    };
    entry.deliveredBags += d.sackQuantity || 0;
    entry.deliveredMt += d.totalMt || Number(((d.sackQuantity * (d.kgPerBag || 50)) / 1000).toFixed(3));
    groupMap.set(key, entry);
  }

  const results: StockBalanceMatrixItem[] = [];

  groupMap.forEach((entry) => {
    const cs = coldStorages.find((c) => c.id === entry.coldStorageId);
    const v = varieties.find((item) => item.id === entry.varietyId);
    const cls = seedClasses.find((c) => c.id === entry.classId);
    const grd = grades.find((g) => g.id === entry.gradeId);

    const balanceBags = entry.inboundBags - entry.deliveredBags;
    const balanceMt = Number((entry.inboundMt - entry.deliveredMt).toFixed(3));

    results.push({
      coldStorageId: entry.coldStorageId,
      coldStorageName: cs?.name || entry.coldStorageId,
      coldStorageCode: cs?.code || entry.coldStorageId,
      varietyId: entry.varietyId,
      varietyName: v?.name || 'Unknown',
      classId: entry.classId,
      className: cls?.name || 'Unknown',
      gradeId: entry.gradeId,
      gradeName: grd?.name || 'Unknown',
      inboundBags: entry.inboundBags,
      inboundMt: Number(entry.inboundMt.toFixed(3)),
      deliveredBags: entry.deliveredBags,
      deliveredMt: Number(entry.deliveredMt.toFixed(3)),
      balanceBags,
      balanceMt,
    });
  });

  return results;
}

export function calculateOverallMetrics(
  stockTransactions: StockTransaction[],
  deliveryTransactions: DeliveryTransaction[],
  coldStorages: ColdStorage[],
  filters?: FilterState
) {
  let filteredStock = stockTransactions.filter((s) => s.status === 'approved');
  let filteredDel = deliveryTransactions.filter((d) => d.status === 'approved' || d.status === 'completed');

  if (filters?.coldStorageId) {
    filteredStock = filteredStock.filter((s) => s.coldStorageId === filters.coldStorageId);
    filteredDel = filteredDel.filter((d) => d.coldStorageId === filters.coldStorageId);
  }

  const totalStockInBags = filteredStock.reduce((acc, s) => acc + (s.sackQuantity || 0), 0);
  const totalStockInMt = filteredStock.reduce(
    (acc, s) => acc + (s.totalMt || (s.sackQuantity * (s.kgPerBag || 50)) / 1000),
    0
  );

  const totalDeliveryBags = filteredDel.reduce((acc, d) => acc + (d.sackQuantity || 0), 0);
  const totalDeliveryMt = filteredDel.reduce(
    (acc, d) => acc + (d.totalMt || (d.sackQuantity * (d.kgPerBag || 50)) / 1000),
    0
  );

  const balanceBags = totalStockInBags - totalDeliveryBags;
  const balanceMt = Number((totalStockInMt - totalDeliveryMt).toFixed(3));

  const totalCapacity = coldStorages.reduce((acc, c) => acc + (c.capacity || 0), 0);
  const occupancyRate = totalCapacity > 0 ? Number(((balanceBags / totalCapacity) * 100).toFixed(1)) : 0;

  return {
    totalStockInBags,
    totalStockInMt: Number(totalStockInMt.toFixed(3)),
    totalDeliveryBags,
    totalDeliveryMt: Number(totalDeliveryMt.toFixed(3)),
    balanceBags,
    balanceMt,
    // Aliases used across dashboard views
    totalReceivedBags: totalStockInBags,
    totalDeliveredBags: totalDeliveryBags,
    remainingBags: balanceBags,
    remainingMt: balanceMt,
    occupancyRate,
    totalCapacity,
    totalFacilities: coldStorages.length,
    activeBatchesCount: filteredStock.length,
  };
}

export interface LiveStockMatrixRow {
  id: string;
  type: 'header' | 'item' | 'subtotal' | 'gap' | 'grandtotal' | 'single';
  label: string;
  parentId?: string;
  values: Record<string, number>;
  total: number;
  classId?: string;
  gradeId?: string;
}

export function calculateLiveStockMatrix(
  stockTransactions: StockTransaction[],
  deliveryTransactions: DeliveryTransaction[],
  varieties: Variety[],
  seedClasses: SeedClass[],
  grades: Grade[],
  filters?: FilterState
) {
  // Columns definition: standard varieties
  const defaultColumns = [
    { key: 'ASTERIX', label: 'ASTERIX' },
    { key: 'DIAMANT', label: 'DIAMANT' },
    { key: 'GRANOLA', label: 'GRANOLA' },
    { key: 'SUN-SHINE', label: 'SUN-SHINE' },
  ];

  const getVarietyKey = (varietyId: string): string => {
    const v = varieties.find((item) => item.id === varietyId);
    const name = (v?.name || '').toUpperCase();
    const code = (v?.code || '').toUpperCase();
    if (code === 'AST' || name.includes('ASTERIX')) return 'ASTERIX';
    if (code === 'DIA' || name.includes('DIAMANT')) return 'DIAMANT';
    if (code === 'GRA' || name.includes('GRANOLA')) return 'GRANOLA';
    if (code === 'SUN' || name.includes('SUN-SHINE') || name.includes('SUNSHINE')) return 'SUN-SHINE';
    return 'OTHER';
  };

  // Filter approved transactions
  let stock = stockTransactions.filter((s) => s.status === 'approved');
  let del = deliveryTransactions.filter((d) => d.status === 'approved' || d.status === 'completed');

  if (filters?.coldStorageId) {
    stock = stock.filter((s) => s.coldStorageId === filters.coldStorageId);
    del = del.filter((d) => d.coldStorageId === filters.coldStorageId);
  }

  // Pre-calculate remaining bags per (varietyKey, rowCriterion)
  // Helper to match row criteria
  const matchesRowCriteria = (rowId: string, classId: string, gradeId: string) => {
    const cls = seedClasses.find((c) => c.id === classId);
    const grd = grades.find((g) => g.id === gradeId);

    const className = (cls?.name || '').toLowerCase();
    const classCode = (cls?.code || '').toUpperCase();
    const gradeName = (grd?.name || '').toLowerCase();
    const gradeCode = (grd?.code || '').toUpperCase();

    switch (rowId) {
      case 'certify-a':
        return (classCode === 'CS' || className.includes('certif')) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'certify-b':
        return (classCode === 'CS' || className.includes('certif')) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'certify-us':
        return (classCode === 'CS' || className.includes('certif')) && (gradeCode === 'US' || gradeName.includes('under size') || gradeName.includes('us'));
      case 'total-certify':
        return classCode === 'CS' || className.includes('certif');

      case 'foundation-a':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'foundation-b':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'foundation-us':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'US' || gradeName.includes('under size') || gradeName.includes('us'));
      case 'foundation-os':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'OS' || gradeName.includes('over size') || gradeName.includes('os'));
      case 'total-foundation':
        return classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'));

      case 'mini-tuber':
      case 'total-mini-tuber':
        return classCode === 'MT' || classCode === 'BRD' || className.includes('mini tuber') || className.includes('breeder');

      case 'table-potato':
      case 'total-table-potato':
        return gradeCode === 'TP' || gradeName.includes('tp');

      case 'pre-foundation-a':
        return (classCode === 'PF' || classCode === 'PFS' || className.includes('pre')) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'pre-foundation-b':
        return (classCode === 'PF' || classCode === 'PFS' || className.includes('pre')) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'pre-foundation-us':
        return (classCode === 'PF' || classCode === 'PFS' || className.includes('pre')) && (gradeCode === 'US' || gradeName.includes('under size') || gradeName.includes('us'));
      case 'total-pre-foundation':
        return classCode === 'PF' || classCode === 'PFS' || className.includes('pre');

      case 'tls-a':
        return (classCode === 'TLS' || className.includes('tls')) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'tls-b':
        return (classCode === 'TLS' || className.includes('tls')) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'total-tls':
        return classCode === 'TLS' || className.includes('tls');

      case 'non-traceable':
      case 'total-non-traceable':
        return classCode === 'NT' || className.includes('non traceable') || className.includes('non-traceable');
      case 'grand-total':
      default:
        return true;
    }
  };

  const computeRowValues = (rowId: string) => {
    const values: Record<string, number> = {};
    defaultColumns.forEach((col) => {
      const inBags = stock
        .filter((s) => getVarietyKey(s.varietyId) === col.key && matchesRowCriteria(rowId, s.classId, s.gradeId))
        .reduce((sum, s) => sum + s.sackQuantity, 0);

      const outBags = del
        .filter((d) => getVarietyKey(d.varietyId) === col.key && matchesRowCriteria(rowId, d.classId, d.gradeId))
        .reduce((sum, d) => sum + d.sackQuantity, 0);

      values[col.key] = Math.max(0, inBags - outBags);
    });
    const total = Object.values(values).reduce((a, b) => a + b, 0);
    return { values, total };
  };

  // Row structure definition
  const rawRows: { id: string; type: LiveStockMatrixRow['type']; label: string; parentId?: string }[] = [
    // Pre-foundation
    { id: 'total-pre-foundation', type: 'subtotal', label: 'PRE-FOUNDATION SEED' },
    { id: 'pre-foundation-a', type: 'item', label: 'PRE-FOUNDATION GRADE A (28-40 MM)', parentId: 'total-pre-foundation' },
    { id: 'pre-foundation-b', type: 'item', label: 'PRE-FOUNDATION GRADE B (40-55 MM)', parentId: 'total-pre-foundation' },
    { id: 'pre-foundation-us', type: 'item', label: 'PRE-FOUNDATION UNDER SIZE (<28 MM)', parentId: 'total-pre-foundation' },
    { id: 'gap-1', type: 'gap', label: '', parentId: 'total-pre-foundation' },

    // Foundation
    { id: 'total-foundation', type: 'subtotal', label: 'FOUNDATION SEED' },
    { id: 'foundation-a', type: 'item', label: 'FOUNDATION GRADE A (28-40 MM)', parentId: 'total-foundation' },
    { id: 'foundation-b', type: 'item', label: 'FOUNDATION GRADE B (40-55 MM)', parentId: 'total-foundation' },
    { id: 'foundation-us', type: 'item', label: 'FOUNDATION UNDER SIZE (<28 MM)', parentId: 'total-foundation' },
    { id: 'foundation-os', type: 'item', label: 'FOUNDATION OVER SIZE (>55 MM)', parentId: 'total-foundation' },
    { id: 'gap-2', type: 'gap', label: '', parentId: 'total-foundation' },

    // Certified
    { id: 'total-certify', type: 'subtotal', label: 'CERTIFIED SEED' },
    { id: 'certify-a', type: 'item', label: 'CERTIFIED GRADE A (28-40 MM)', parentId: 'total-certify' },
    { id: 'certify-b', type: 'item', label: 'CERTIFIED GRADE B (40-55 MM)', parentId: 'total-certify' },
    { id: 'certify-us', type: 'item', label: 'CERTIFIED UNDER SIZE (<28 MM)', parentId: 'total-certify' },
    { id: 'gap-3', type: 'gap', label: '', parentId: 'total-certify' },

    // TLS
    { id: 'total-tls', type: 'subtotal', label: 'TLS (TRUTH FULL LABELED)' },
    { id: 'tls-a', type: 'item', label: 'TLS GRADE A (28-40 MM)', parentId: 'total-tls' },
    { id: 'tls-b', type: 'item', label: 'TLS GRADE B (40-55 MM)', parentId: 'total-tls' },
    { id: 'gap-4', type: 'gap', label: '', parentId: 'total-tls' },

    // Mini Tuber & Table & Non-traceable
    { id: 'mini-tuber', type: 'single', label: 'MINI TUBER / BREEDER SEED' },
    { id: 'table-potato', type: 'single', label: 'TABLE POTATO' },
    { id: 'non-traceable', type: 'single', label: 'NON-TRACEABLE SEED' },
    { id: 'gap-5', type: 'gap', label: '' },

    // Grand total
    { id: 'grand-total', type: 'grandtotal', label: 'GRAND TOTAL (BAGS)' },
  ];

  const rows: LiveStockMatrixRow[] = rawRows.map((r) => {
    if (r.type === 'gap') {
      return {
        ...r,
        values: {},
        total: 0,
      };
    }
    const computed = computeRowValues(r.id);
    return {
      ...r,
      values: computed.values,
      total: computed.total,
    };
  });

  const grandTotalRow = rows.find((r) => r.id === 'grand-total');
  const grandTotal = grandTotalRow ? grandTotalRow.total : 0;
  const columnTotals = grandTotalRow ? grandTotalRow.values : {};

  return {
    columns: defaultColumns,
    rows,
    grandTotal,
    columnTotals,
  };
}
