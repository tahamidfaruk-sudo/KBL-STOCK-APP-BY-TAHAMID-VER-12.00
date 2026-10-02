import React, { useState } from 'react';
import {
  Warehouse,
  Search,
  RotateCcw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Building,
  BarChart3,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ColdStorage, TableDensity } from '../../types';
import { matchesUniversalSearch } from '../../utils/searchUtils';
import { sortData } from '../../utils/sortUtils';
import { SortIcon } from '../common/SortIcon';
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { PrintPreviewModal } from '../common/PrintPreviewModal';

export const ColdStorageListView: React.FC = () => {
  const {
    coldStorages,
    stockTransactions,
    deliveryTransactions,
    addColdStorage,
    updateColdStorage,
    deleteColdStorage,
    companySettings,
    addToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [density, setDensity] = useState<TableDensity>('compact');
  const [sortKey, setSortKey] = useState<string>('code');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStorage, setEditingStorage] = useState<ColdStorage | null>(null);
  const [viewingStorage, setViewingStorage] = useState<ColdStorage | null>(null);
  const [deletingStorage, setDeletingStorage] = useState<ColdStorage | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<ColdStorage, 'id'>>({
    code: '',
    name: '',
    location: '',
    district: '',
    capacity: 50000,
    rentPerBag: 140,
    contactPerson: '',
    contactPhone: '',
    status: 'active',
    remarks: '',
  });

  const resetFilters = () => {
    setSearchTerm('');
    setDistrictFilter('');
    setStatusFilter('all');
    setCurrentPage(1);
    addToast('Cold storage filters reset', 'info');
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const densityStyles = {
    compact: {
      row: 'h-8 sm:h-8.5',
      cell: 'py-1 text-[9.5px]',
      th: 'py-1 text-[9px]',
      badge: 'px-1 py-0.2 text-[8px]',
    },
    normal: {
      row: 'h-9 sm:h-9.5',
      cell: 'py-1.2 text-[10px]',
      th: 'py-1.5 text-[9.5px]',
      badge: 'px-1.2 py-0.2 text-[8.5px]',
    },
    comfortable: {
      row: 'h-10 sm:h-11',
      cell: 'py-1.5 text-[10.5px]',
      th: 'py-2 text-[10px]',
      badge: 'px-1.5 py-0.5 text-[9px]',
    },
  }[density];

  const cellPadding = densityStyles.cell;
  const thPadding = densityStyles.th;

  // Districts for dropdown
  const uniqueDistricts = Array.from(
    new Set(coldStorages.map((c) => c.district || c.location).filter(Boolean))
  );

  // Filtered List
  const filtered = coldStorages.filter((c) => {
    const matchesSearch = matchesUniversalSearch(c, searchTerm, [
      c.name,
      c.code,
      c.location,
      c.district,
      c.contactPerson,
      c.contactPhone,
      c.capacity,
    ]);
    const matchesDistrict = districtFilter ? (c.district || c.location) === districtFilter : true;
    const matchesStatus =
      statusFilter === 'all' ? true : (c.status || 'active') === statusFilter;
    return matchesSearch && matchesDistrict && matchesStatus;
  });

  // Calculate Aggregates
  const totalCapacity = coldStorages.reduce((sum, c) => sum + (c.capacity || 0), 0);
  const totalCurrentStock = coldStorages.reduce((sum, cs) => {
    const inBags = stockTransactions
      .filter((s) => s.coldStorageId === cs.id)
      .reduce((acc, s) => acc + (s.sackQuantity || 0), 0);
    const outBags = deliveryTransactions
      .filter((d) => d.coldStorageId === cs.id)
      .reduce((acc, d) => acc + (d.sackQuantity || d.quantity || 0), 0);
    return sum + Math.max(0, inBags - outBags);
  }, 0);
  const overallOccupancy = totalCapacity > 0 ? Math.round((totalCurrentStock / totalCapacity) * 100) : 0;

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingStorage(null);
    const nextNum = coldStorages.length + 1;
    const autoCode = `CS-${nextNum.toString().padStart(3, '0')}`;
    setFormData({
      code: autoCode,
      name: '',
      location: '',
      district: '',
      capacity: 50000,
      rentPerBag: 140,
      contactPerson: '',
      contactPhone: '',
      status: 'active',
      remarks: '',
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (storage: ColdStorage) => {
    setEditingStorage(storage);
    setFormData({
      code: storage.code || '',
      name: storage.name || '',
      location: storage.location || '',
      district: storage.district || '',
      capacity: storage.capacity || 10000,
      rentPerBag: storage.rentPerBag || 140,
      contactPerson: storage.contactPerson || '',
      contactPhone: storage.contactPhone || storage.phone || '',
      status: storage.status || 'active',
      remarks: storage.remarks || '',
    });
    setIsAddEditModalOpen(true);
  };

  // Handle Form Submit (Add or Update)
  const handleSaveStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Cold storage name is required', 'warning');
      return;
    }
    if (!formData.code.trim()) {
      addToast('Facility code is required', 'warning');
      return;
    }
    if (formData.capacity <= 0) {
      addToast('Capacity must be greater than 0', 'warning');
      return;
    }

    if (editingStorage) {
      updateColdStorage(editingStorage.id, formData);
      addToast(`Updated facility "${formData.name}" successfully!`, 'success');
    } else {
      addColdStorage(formData);
      addToast(`Added new cold storage "${formData.name}"!`, 'success');
    }
    setIsAddEditModalOpen(false);
    setEditingStorage(null);
  };

  // Handle Delete Confirmation
  const confirmDelete = () => {
    if (!deletingStorage) return;
    deleteColdStorage(deletingStorage.id);
    addToast(`Facility "${deletingStorage.name}" moved to Recycle Bin`, 'info');
    setDeletingStorage(null);
  };

  function getStorageMetrics(cs: ColdStorage) {
    const inSacks = stockTransactions
      .filter((s) => s.coldStorageId === cs.id)
      .reduce((acc, s) => acc + (s.sackQuantity || 0), 0);
    const outSacks = deliveryTransactions
      .filter((d) => d.coldStorageId === cs.id)
      .reduce((acc, d) => acc + (d.sackQuantity || d.quantity || 0), 0);
    const inTransactionsCount = stockTransactions.filter((s) => s.coldStorageId === cs.id).length;
    const outTransactionsCount = deliveryTransactions.filter((d) => d.coldStorageId === cs.id).length;
    const currentBags = Math.max(0, inSacks - outSacks);
    const capacityBags = cs.capacity || 10000;
    const occupancyPct = Math.min(100, Math.round((currentBags / capacityBags) * 100));
    const availableBags = Math.max(0, capacityBags - currentBags);

    return {
      currentBags,
      capacityBags,
      occupancyPct,
      availableBags,
      inSacks,
      outSacks,
      inTransactionsCount,
      outTransactionsCount,
    };
  }

  const tableRows = filtered.map((cs) => {
    const m = getStorageMetrics(cs);
    return {
      ...cs,
      locationLabel: cs.location || cs.district || '-',
      districtLabel: cs.district || cs.location || '-',
      contactLabel: cs.contactPerson || '-',
      phoneLabel: cs.contactPhone || cs.phone || '-',
      currentBags: m.currentBags,
      occupancyPct: m.occupancyPct,
      availableBags: m.availableBags,
      statusLabel: (cs.status || 'active').toUpperCase(),
    };
  });

  const sortedList = sortData(tableRows, sortKey, sortDir);
  const totalRecords = sortedList.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = pageSize === -1 ? 0 : (effectivePage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRecords : Math.min(startIndex + pageSize, totalRecords);
  const paginatedRows = pageSize === -1 ? sortedList : sortedList.slice(startIndex, endIndex);

  // Excel Export
  const handleExportExcel = () => {
    const exportData = sortedList.map((row) => ({
      code: row.code || 'CS',
      name: row.name,
      location: row.locationLabel,
      district: row.districtLabel,
      capacity: row.capacity || 0,
      currentStock: row.currentBags,
      occupancy: `${row.occupancyPct}%`,
      contactPerson: row.contactLabel,
      phone: row.phoneLabel,
      status: row.statusLabel,
    }));

    if (sortedList.length > 0) {
      exportData.push({
        code: 'TOTAL',
        name: '',
        location: '',
        district: '',
        capacity: totalCapacity,
        currentStock: totalCurrentStock,
        occupancy: `${overallOccupancy}%`,
        contactPerson: '',
        phone: '',
        status: '',
      } as any);
    }

    const columns = [
      { header: 'CODE', key: 'code', align: 'left' as const },
      { header: 'FACILITY NAME', key: 'name', align: 'left' as const },
      { header: 'LOCATION', key: 'location', align: 'left' as const },
      { header: 'DISTRICT', key: 'district', align: 'left' as const },
      { header: 'CAPACITY (BAGS)', key: 'capacity', isNumeric: true, align: 'right' as const },
      { header: 'CURRENT STOCK (BAGS)', key: 'currentStock', isNumeric: true, align: 'right' as const },
      { header: 'OCCUPANCY', key: 'occupancy', isNumeric: true, align: 'right' as const },
      { header: 'CONTACT PERSON', key: 'contactPerson', align: 'left' as const },
      { header: 'PHONE', key: 'phone', align: 'left' as const },
      { header: 'STATUS', key: 'status', align: 'left' as const },
    ];

    exportToExcel(
      exportData,
      columns,
      `COLD_STORAGE_LIST_${companySettings?.fiscalYear || '2024'}`,
      'COLD STORAGE FACILITIES',
      companySettings,
      `Generated on ${new Date().toLocaleDateString('en-GB')}`
    );
    addToast?.('Cold Storage list exported to Excel successfully!', 'success');
  };

  // PDF Export
  const handleExportPdf = () => {
    const exportData = sortedList.map((row) => ({
      code: row.code || 'CS',
      name: row.name,
      location: row.locationLabel,
      district: row.districtLabel,
      capacity: (row.capacity || 0).toLocaleString(),
      currentStock: row.currentBags.toLocaleString(),
      occupancy: `${row.occupancyPct}%`,
      contactPerson: row.contactLabel,
      phone: row.phoneLabel,
      status: row.statusLabel,
    }));

    if (sortedList.length > 0) {
      exportData.push({
        code: 'TOTAL',
        name: '',
        location: '',
        district: '',
        capacity: totalCapacity.toLocaleString(),
        currentStock: totalCurrentStock.toLocaleString(),
        occupancy: `${overallOccupancy}%`,
        contactPerson: '',
        phone: '',
        status: '',
        isTotal: true,
      } as any);
    }

    const columns: any[] = [
      { header: 'CODE', key: 'code', align: 'left' },
      { header: 'FACILITY NAME', key: 'name', align: 'left' },
      { header: 'LOCATION', key: 'location', align: 'left' },
      { header: 'DISTRICT', key: 'district', align: 'left' },
      { header: 'CAPACITY', key: 'capacity', isNumeric: true, align: 'right' },
      { header: 'STOCK (BAGS)', key: 'currentStock', isNumeric: true, align: 'right' },
      { header: 'OCCUPANCY', key: 'occupancy', isNumeric: true, align: 'right' },
      { header: 'CONTACT', key: 'contactPerson', align: 'left' },
      { header: 'PHONE', key: 'phone', align: 'left' },
      { header: 'STATUS', key: 'status', align: 'left' },
    ];

    exportToPdf(
      exportData,
      columns,
      `COLD_STORAGE_LIST_${companySettings?.fiscalYear || '2024'}`,
      'COLD STORAGE FACILITIES',
      companySettings,
      'l',
      `Total Facilities: ${sortedList.length}`
    );
    addToast?.('Cold Storage list exported as PDF!', 'success');
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Page Title Card: strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            COLD STORAGES
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 uppercase font-mono">
            {filtered.length} FACILITIES
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer uppercase active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>ADD COLD STORAGE</span>
          </button>

          <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setDensity('compact');
                addToast?.('Table density set to COMPACT', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'compact'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMPACT
            </button>
            <button
              type="button"
              onClick={() => {
                setDensity('normal');
                addToast?.('Table density set to NORMAL', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'normal'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              NORMAL
            </button>
            <button
              type="button"
              onClick={() => {
                setDensity('comfortable');
                addToast?.('Table density set to COMFORTABLE', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'comfortable'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMFORTABLE
            </button>
          </div>

          <ReportButtonGroup
            iconOnly={true}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onPrint={() => setIsPreviewOpen(true)}
          />
        </div>
      </div>

      {/* Filter Toolbar: Strictly matching Stock In filter section */}
      <div className="bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 rounded-xl p-3 shadow-xs space-y-2.5 text-slate-800 dark:text-slate-100 no-print">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative w-40 sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs transition-all font-medium"
                aria-label="Search cold storage"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Location dropdown */}
            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold uppercase cursor-pointer shadow-2xs"
            >
              <option value="">ALL LOCATIONS</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="py-1 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold uppercase cursor-pointer shadow-2xs"
            >
              <option value="all">ALL STATUS</option>
              <option value="active">ACTIVE</option>
              <option value="inactive">INACTIVE</option>
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
            <span className="text-[10.5px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{filtered.length}</strong> facilities
            </span>

            {/* Reset Button */}
            <button
              type="button"
              onClick={resetFilters}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
              title="Reset search and filters"
              aria-label="Reset search and filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700">
          <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px]">
            <tr>
              <th
                onClick={() => handleSort('code')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'code'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">CODE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="code" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'name'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">FACILITY NAME</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="name" />
                </div>
              </th>
              <th
                onClick={() => handleSort('locationLabel')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'locationLabel'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">LOCATION</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="locationLabel" />
                </div>
              </th>
              <th
                onClick={() => handleSort('districtLabel')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'districtLabel'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">DISTRICT</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="districtLabel" />
                </div>
              </th>
              <th
                onClick={() => handleSort('capacity')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'capacity'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">CAPACITY</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="capacity" />
                </div>
              </th>
              <th
                onClick={() => handleSort('currentBags')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'currentBags'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">CURRENT STOCK</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="currentBags" />
                </div>
              </th>
              <th
                onClick={() => handleSort('occupancyPct')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'occupancyPct'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">OCCUPANCY</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="occupancyPct" />
                </div>
              </th>
              <th
                onClick={() => handleSort('contactLabel')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'contactLabel'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">CONTACT</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="contactLabel" />
                </div>
              </th>
              <th
                onClick={() => handleSort('statusLabel')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'statusLabel'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">STATUS</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="statusLabel" />
                </div>
              </th>
              <th className={`${thPadding} text-center border border-slate-300 dark:border-slate-700 select-none`}>
                <span className="break-words">ACTIONS</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="py-10 text-center text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <p className="font-medium">No matching cold storage facilities found.</p>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="mt-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                  >
                    Add cold storage
                  </button>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  className={`${densityStyles.row} transition-colors duration-150 ease-out hover:bg-sky-500/10 dark:hover:bg-sky-400/10 cursor-default`}
                >
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold border border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide bg-transparent shadow-2xs">
                      {row.code || 'CS'}
                    </span>
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span className="font-bold text-slate-800 dark:text-slate-100 break-words tracking-tight uppercase">
                      {row.name}
                    </span>
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium`}>
                    {row.locationLabel}
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium uppercase`}>
                    {row.districtLabel}
                  </td>
                  <td className={`${cellPadding} pr-3 text-right font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400 border border-slate-300 dark:border-slate-700`}>
                    {(row.capacity || 0).toLocaleString()}
                  </td>
                  <td className={`${cellPadding} pr-3 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-700`}>
                    {row.currentBags.toLocaleString()}
                  </td>
                  <td className={`${cellPadding} pr-3 text-right font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400 border border-slate-300 dark:border-slate-700`}>
                    {row.occupancyPct}%
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium`}>
                    <div className="break-words">
                      {row.contactLabel}
                      {row.phoneLabel !== '-' && (
                        <span className="block font-mono text-sky-600 dark:text-sky-400">{row.phoneLabel}</span>
                      )}
                    </div>
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span
                      className={`inline-block px-1 py-0.5 rounded font-bold uppercase tracking-wide border ${densityStyles.badge} ${
                        (row.status || 'active') === 'active'
                          ? 'border-emerald-400 text-emerald-700 dark:text-emerald-300'
                          : 'border-rose-400 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className={`${cellPadding} px-2 text-center border border-slate-300 dark:border-slate-700`}>
                    <div className="inline-flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingStorage(row)}
                        className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        title="View facility details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(row)}
                        className="p-1 rounded-md text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950 border border-sky-200 dark:border-sky-800 cursor-pointer"
                        title="Edit facility settings"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingStorage(row)}
                        className="p-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 border border-rose-200 dark:border-rose-900 cursor-pointer"
                        title="Delete facility"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {sortedList.length > 0 && (
            <tfoot className="bg-slate-100 dark:bg-slate-850 font-bold border-t-2 border-slate-400 dark:border-slate-600">
              <tr>
                <td
                  colSpan={4}
                  className="py-2 pl-3 text-left uppercase tracking-wider text-slate-900 dark:text-white bg-slate-200/90 dark:bg-slate-800 font-black border border-slate-300 dark:border-slate-700 shadow-2xs"
                >
                  <div className="flex items-center justify-start gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 text-xs font-black tracking-widest uppercase shadow-xs">
                      <Layers className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      <span>TOTAL</span>
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-3 text-right font-mono tabular-nums font-black text-blue-700 dark:text-blue-300 bg-transparent border border-slate-300 dark:border-slate-700 text-[10.5px]">
                  {totalCapacity.toLocaleString()}
                </td>
                <td className="py-2 pr-3 text-right font-mono tabular-nums font-black text-emerald-700 dark:text-emerald-300 bg-transparent border border-slate-300 dark:border-slate-700 text-[10.5px]">
                  {totalCurrentStock.toLocaleString()}
                </td>
                <td className="py-2 pr-3 text-right font-mono tabular-nums font-black text-amber-700 dark:text-amber-300 bg-transparent border border-slate-300 dark:border-slate-700 text-[10.5px]">
                  {overallOccupancy}%
                </td>
                <td colSpan={3} className="py-2 px-2 border border-slate-300 dark:border-slate-700" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {totalRecords > 0 && (
        <div className="pt-2 px-1 border-t border-slate-200 dark:border-slate-750 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 select-none">
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-1.5 py-0.5 text-xs font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 shadow-2xs cursor-pointer font-bold"
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
            </div>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
              Showing <strong className="text-slate-900 dark:text-white font-bold">{startIndex + 1}</strong>–<strong className="text-slate-900 dark:text-white font-bold">{endIndex}</strong> of <strong className="text-slate-900 dark:text-white font-bold">{totalRecords}</strong> records
            </span>
          </div>
          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={effectivePage === 1}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={effectivePage === 1}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {effectivePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={effectivePage === totalPages}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={effectivePage === totalPages}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL 1: ADD OR EDIT COLD STORAGE --- */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {editingStorage ? 'EDIT COLD STORAGE' : 'ADD NEW COLD STORAGE'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingStorage ? `Update parameters for ${editingStorage.name}` : 'Register a new storage facility'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveStorage} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Facility Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Operational Status
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="inactive">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Facility Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Facility Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              {/* Location and District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Location / Address
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={formData.district || ''}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Capacity & Rent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Total Capacity (Bags) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Rent Per Bag (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.rentPerBag || 0}
                    onChange={(e) => setFormData({ ...formData, rentPerBag: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Manager & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Contact Person / Manager
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone || ''}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold uppercase shadow-xs transition-all cursor-pointer"
                >
                  {editingStorage ? 'UPDATE FACILITY' : 'SAVE FACILITY'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: VIEW DETAILS MODAL --- */}
      {viewingStorage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {viewingStorage.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    CODE: {viewingStorage.code} • {viewingStorage.district || viewingStorage.location}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingStorage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            {(() => {
              const m = getStorageMetrics(viewingStorage);
              return (
                <div className="p-5 space-y-4 text-xs">
                  {/* Status & Capacity Overview */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                        Current Occupancy Level
                      </span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        {m.occupancyPct}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          m.occupancyPct > 90
                            ? 'bg-rose-500'
                            : m.occupancyPct > 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${m.occupancyPct}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Total Capacity</p>
                        <p className="font-mono font-black text-slate-800 dark:text-slate-200 mt-0.5">
                          {m.capacityBags.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Stored Bags</p>
                        <p className="font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {m.currentBags.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Free Space</p>
                        <p className="font-mono font-black text-sky-600 dark:text-sky-400 mt-0.5">
                          {m.availableBags.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Stats */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Inbound Lots</p>
                      <p className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
                        {m.inTransactionsCount} Entries
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {m.inSacks.toLocaleString()} total bags received
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Total Dispatches</p>
                      <p className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
                        {m.outTransactionsCount} Deliveries
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {m.outSacks.toLocaleString()} total bags delivered
                      </p>
                    </div>
                  </div>

                  {/* Contact & Location Details */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">Address:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                        {viewingStorage.location || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">District:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                        {viewingStorage.district || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">Supervisor / Manager:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {viewingStorage.contactPerson || 'Not Assigned'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">Contact Phone:</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {viewingStorage.contactPhone || viewingStorage.phone || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase">Rental Rate:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        ৳{viewingStorage.rentPerBag || 0} / Bag
                      </span>
                    </div>

                    {viewingStorage.remarks && (
                      <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-bold uppercase block text-[10px] text-slate-400 mb-0.5">Notes:</span>
                        {viewingStorage.remarks}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewingStorage(null)}
                      className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
                    >
                      CLOSE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = viewingStorage;
                        setViewingStorage(null);
                        handleOpenEdit(target);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold uppercase shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>EDIT FACILITY</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- MODAL 3: DELETE CONFIRMATION MODAL --- */}
      {deletingStorage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  DELETE COLD STORAGE
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">"{deletingStorage.name}"</span>?
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                  This facility will be moved to the Recycle Bin and can be restored anytime.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeletingStorage(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CONFIRM DELETE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="COLD STORAGE FACILITIES"
        documentTitle="COLD STORAGE FACILITIES"
        period={`Total Facilities: ${sortedList.length}`}
        columns={[
          { header: 'CODE', key: 'code', align: 'left' },
          { header: 'FACILITY NAME', key: 'name', align: 'left' },
          { header: 'LOCATION', key: 'location', align: 'left' },
          { header: 'DISTRICT', key: 'district', align: 'left' },
          { header: 'CAPACITY', key: 'capacity', isNumeric: true, align: 'right' },
          { header: 'STOCK (BAGS)', key: 'currentStock', isNumeric: true, align: 'right' },
          { header: 'OCCUPANCY', key: 'occupancy', isNumeric: true, align: 'right' },
          { header: 'CONTACT', key: 'contactPerson', align: 'left' },
          { header: 'PHONE', key: 'phone', align: 'left' },
          { header: 'STATUS', key: 'status', align: 'left' },
        ]}
        data={sortedList.map((row) => ({
          code: row.code || 'CS',
          name: row.name,
          location: row.locationLabel,
          district: row.districtLabel,
          capacity: (row.capacity || 0).toLocaleString(),
          currentStock: row.currentBags.toLocaleString(),
          occupancy: `${row.occupancyPct}%`,
          contactPerson: row.contactLabel,
          phone: row.phoneLabel,
          status: row.statusLabel,
        }))}
      />
    </div>
  );
};
