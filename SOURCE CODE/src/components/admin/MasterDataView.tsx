import React, { useState } from 'react';
import {
  Sliders,
  Search,
  RotateCcw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { matchesUniversalSearch } from '../../utils/searchUtils';
import { Variety, SeedClass, Grade, ProductionBlock, TableDensity } from '../../types';
import { sortData } from '../../utils/sortUtils';
import { SortIcon } from '../common/SortIcon';
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { PrintPreviewModal } from '../common/PrintPreviewModal';

export const MasterDataView: React.FC = () => {
  const {
    varieties,
    addVariety,
    updateVariety,
    deleteVariety,
    seedClasses,
    addSeedClass,
    updateSeedClass,
    deleteSeedClass,
    grades,
    addGrade,
    updateGrade,
    deleteGrade,
    productionBlocks,
    addProductionBlock,
    updateProductionBlock,
    deleteProductionBlock,
    masterDataSubTab,
    setMasterDataSubTab,
    companySettings,
    addToast,
  } = useApp();

  const activeSubTab = masterDataSubTab;
  const setActiveSubTab = setMasterDataSubTab;
  const [searchTerm, setSearchTerm] = useState('');
  const [density, setDensity] = useState<TableDensity>('compact');
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; type: string; data: any } | null>(null);
  const [viewingItem, setViewingItem] = useState<{ type: string; data: any } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: string; name: string } | null>(null);

  // Unified Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSizeSpec, setFormSizeSpec] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const resetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
    addToast('Master data search reset', 'info');
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

  const getFilteredItems = () => {
    switch (activeSubTab) {
      case 'varieties':
        return varieties.filter((v) =>
          matchesUniversalSearch(v, searchTerm, [v.name, v.code, v.description])
        );
      case 'classes':
        return seedClasses.filter((c) =>
          matchesUniversalSearch(c, searchTerm, [c.name, c.code, c.description])
        );
      case 'grades':
        return grades.filter((g) =>
          matchesUniversalSearch(g, searchTerm, [g.name, g.code, g.sizeSpec])
        );
      case 'blocks':
        return productionBlocks.filter((b) =>
          matchesUniversalSearch(b, searchTerm, [b.name, b.code, b.district, b.location])
        );
    }
  };

  const currentItems = getFilteredItems();

  const tableRows = currentItems.map((item: any) => ({
    ...item,
    codeLabel: item.code || '-',
    extraLabel:
      activeSubTab === 'grades'
        ? item.sizeSpec || '-'
        : activeSubTab === 'blocks'
        ? [item.district, item.location].filter(Boolean).join(' / ') || '-'
        : item.description || '-',
    statusLabel: (item.status || 'active').toUpperCase(),
  }));

  const sortedList = sortData(tableRows, sortKey, sortDir);
  const totalRecords = sortedList.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = pageSize === -1 ? 0 : (effectivePage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRecords : Math.min(startIndex + pageSize, totalRecords);
  const paginatedRows = pageSize === -1 ? sortedList : sortedList.slice(startIndex, endIndex);

  const extraColumnLabel =
    activeSubTab === 'grades' ? 'SIZE SPEC' : activeSubTab === 'blocks' ? 'DISTRICT / LOCATION' : 'DESCRIPTION';

  const getTabLabel = (tab: typeof activeSubTab) => {
    switch (tab) {
      case 'varieties':
        return 'VARIETY';
      case 'classes':
        return 'SEED CLASS';
      case 'grades':
        return 'GRADE';
      case 'blocks':
        return 'BLOCK';
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCode('');
    setFormDesc('');
    setFormSizeSpec('');
    setFormDistrict('');
    setFormLocation('');
    setFormStatus('active');
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem({ id: item.id, type: activeSubTab, data: item });
    setFormName(item.name || '');
    setFormCode(item.code || '');
    setFormDesc(item.description || '');
    setFormSizeSpec(item.sizeSpec || '');
    setFormDistrict(item.district || '');
    setFormLocation(item.location || '');
    setFormStatus(item.status || 'active');
    setIsAddEditModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('Name is required', 'warning');
      return;
    }

    if (activeSubTab === 'varieties') {
      const payload: Omit<Variety, 'id'> = {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        description: formDesc.trim() || undefined,
        status: formStatus,
      };
      if (editingItem) {
        updateVariety(editingItem.id, payload);
        addToast(`Variety "${formName}" updated successfully!`, 'success');
      } else {
        addVariety(payload);
        addToast(`Variety "${formName}" created!`, 'success');
      }
    } else if (activeSubTab === 'classes') {
      const payload: Omit<SeedClass, 'id'> = {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        description: formDesc.trim() || undefined,
        status: formStatus,
      };
      if (editingItem) {
        updateSeedClass(editingItem.id, payload);
        addToast(`Seed Class "${formName}" updated!`, 'success');
      } else {
        addSeedClass(payload);
        addToast(`Seed Class "${formName}" created!`, 'success');
      }
    } else if (activeSubTab === 'grades') {
      const payload: Omit<Grade, 'id'> = {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        sizeSpec: formSizeSpec.trim() || undefined,
        description: formDesc.trim() || undefined,
        status: formStatus,
      };
      if (editingItem) {
        updateGrade(editingItem.id, payload);
        addToast(`Grade "${formName}" updated!`, 'success');
      } else {
        addGrade(payload);
        addToast(`Grade "${formName}" created!`, 'success');
      }
    } else if (activeSubTab === 'blocks') {
      const payload: Omit<ProductionBlock, 'id'> = {
        name: formName.trim(),
        code: formCode.trim() || undefined,
        district: formDistrict.trim() || undefined,
        location: formLocation.trim() || undefined,
        description: formDesc.trim() || undefined,
        status: formStatus,
      };
      if (editingItem) {
        updateProductionBlock(editingItem.id, payload);
        addToast(`Production Block "${formName}" updated!`, 'success');
      } else {
        addProductionBlock(payload);
        addToast(`Production Block "${formName}" created!`, 'success');
      }
    }

    setIsAddEditModalOpen(false);
    setEditingItem(null);
  };

  const confirmDelete = () => {
    if (!deletingItem) return;
    const { id, type, name } = deletingItem;

    if (type === 'varieties') {
      deleteVariety(id);
      addToast(`Variety "${name}" deleted`, 'info');
    } else if (type === 'classes') {
      deleteSeedClass(id);
      addToast(`Seed Class "${name}" deleted`, 'info');
    } else if (type === 'grades') {
      deleteGrade(id);
      addToast(`Grade "${name}" deleted`, 'info');
    } else if (type === 'blocks') {
      deleteProductionBlock(id);
      addToast(`Block "${name}" deleted`, 'info');
    }

    setDeletingItem(null);
  };

  const getExportColumns = () => {
    switch (activeSubTab) {
      case 'varieties':
        return [
          { header: 'CODE', key: 'code', align: 'left' as const },
          { header: 'VARIETY NAME', key: 'name', align: 'left' as const },
          { header: 'DESCRIPTION', key: 'description', align: 'left' as const },
          { header: 'STATUS', key: 'status', align: 'left' as const },
        ];
      case 'classes':
        return [
          { header: 'CODE', key: 'code', align: 'left' as const },
          { header: 'CLASS NAME', key: 'name', align: 'left' as const },
          { header: 'DESCRIPTION', key: 'description', align: 'left' as const },
          { header: 'STATUS', key: 'status', align: 'left' as const },
        ];
      case 'grades':
        return [
          { header: 'CODE', key: 'code', align: 'left' as const },
          { header: 'GRADE NAME', key: 'name', align: 'left' as const },
          { header: 'SIZE / SPECIFICATION', key: 'sizeSpec', align: 'left' as const },
          { header: 'STATUS', key: 'status', align: 'left' as const },
        ];
      case 'blocks':
        return [
          { header: 'CODE', key: 'code', align: 'left' as const },
          { header: 'BLOCK NAME', key: 'name', align: 'left' as const },
          { header: 'DISTRICT / REGION', key: 'district', align: 'left' as const },
          { header: 'LOCATION DETAILS', key: 'location', align: 'left' as const },
          { header: 'STATUS', key: 'status', align: 'left' as const },
        ];
    }
  };

  const getExportData = () => {
    return sortedList.map((row: any) => ({
      code: row.codeLabel,
      name: row.name,
      description: row.extraLabel || '-',
      sizeSpec: row.extraLabel || '-',
      district: row.district || '-',
      location: row.location || '-',
      status: row.statusLabel,
    }));
  };

  const handleExportExcel = () => {
    const title = `MASTER_DATA_${activeSubTab.toUpperCase()}_${companySettings?.fiscalYear || '2024'}`;
    exportToExcel(
      getExportData(),
      getExportColumns(),
      title,
      `MASTER DATA - ${getTabLabel(activeSubTab).toUpperCase()}`,
      companySettings,
      `Generated on ${new Date().toLocaleDateString('en-GB')}`
    );
    addToast?.(`Master data (${getTabLabel(activeSubTab)}) exported to Excel!`, 'success');
  };

  const handleExportPdf = () => {
    const title = `MASTER_DATA_${activeSubTab.toUpperCase()}_${companySettings?.fiscalYear || '2024'}`;
    exportToPdf(
      getExportData(),
      getExportColumns(),
      title,
      `MASTER DATA - ${getTabLabel(activeSubTab).toUpperCase()}`,
      companySettings,
      'p',
      `Total: ${sortedList.length} items`
    );
    addToast?.(`Master data (${getTabLabel(activeSubTab)}) exported as PDF!`, 'success');
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Page Title Card strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            MASTER DATA
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-mono">
            {currentItems.length} ITEMS
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
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

      {/* 2. Unified Filter Toolbar: Integrated Subtabs, Add button, Search bar, and Reset button */}
      <div className="bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 rounded-xl p-2.5 sm:p-3 shadow-xs space-y-2.5 text-slate-800 dark:text-slate-100 no-print">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left grouping: Subtabs buttons + Add Button + Compact Search Box */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Subtabs Button Group */}
            <div className="inline-flex items-center p-0.5 bg-white/90 dark:bg-slate-800/90 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('varieties');
                  setCurrentPage(1);
                  setSortKey('name');
                  setSortDir('asc');
                }}
                className={`px-2.5 py-1 text-[10.5px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                  activeSubTab === 'varieties'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                VARIETIES ({varieties.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('classes');
                  setCurrentPage(1);
                  setSortKey('name');
                  setSortDir('asc');
                }}
                className={`px-2.5 py-1 text-[10.5px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                  activeSubTab === 'classes'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                CLASSES ({seedClasses.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('grades');
                  setCurrentPage(1);
                  setSortKey('name');
                  setSortDir('asc');
                }}
                className={`px-2.5 py-1 text-[10.5px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                  activeSubTab === 'grades'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                GRADES ({grades.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('blocks');
                  setCurrentPage(1);
                  setSortKey('name');
                  setSortDir('asc');
                }}
                className={`px-2.5 py-1 text-[10.5px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                  activeSubTab === 'blocks'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                BLOCKS ({productionBlocks.length})
              </button>
            </div>

            {/* Add Button styled neatly next to tabs */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer uppercase active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>ADD {getTabLabel(activeSubTab)}</span>
            </button>

            {/* Compact Search Box */}
            <div className="relative w-36 sm:w-44 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs transition-all font-medium"
                aria-label={`Search ${activeSubTab}`}
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
          </div>

          {/* Right grouping: Counter + Reset Button */}
          <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
            <span className="text-[10.5px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{currentItems.length}</strong> items
            </span>

            <button
              type="button"
              onClick={resetFilters}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
              title="Reset search"
              aria-label="Reset search"
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
                onClick={() => handleSort('codeLabel')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'codeLabel'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">CODE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="codeLabel" />
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
                  <span className="break-words">NAME</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="name" />
                </div>
              </th>
              <th
                onClick={() => handleSort('extraLabel')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'extraLabel'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">{extraColumnLabel}</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="extraLabel" />
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
                  colSpan={5}
                  className="py-10 text-center text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <p className="font-medium">No matching {getTabLabel(activeSubTab)} records found.</p>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    Add new {getTabLabel(activeSubTab).toLowerCase()}
                  </button>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row: any) => (
                <tr
                  key={row.id}
                  className={`${densityStyles.row} transition-colors duration-150 ease-out hover:bg-sky-500/10 dark:hover:bg-sky-400/10 cursor-default`}
                >
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold border border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide bg-transparent shadow-2xs">
                      {row.codeLabel}
                    </span>
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span className="font-bold text-slate-800 dark:text-slate-100 break-words tracking-tight uppercase">
                      {row.name}
                    </span>
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium`}>
                    {row.extraLabel}
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span
                      className={`inline-block px-1 py-0.5 rounded font-bold uppercase tracking-wide border ${densityStyles.badge} ${
                        (row.status || 'active') === 'active'
                          ? 'border-emerald-400 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-400 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className={`${cellPadding} px-2 text-center border border-slate-300 dark:border-slate-700`}>
                    <div className="inline-flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewingItem({ type: activeSubTab, data: row })}
                        className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(row)}
                        className="p-1 rounded-md text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 border border-amber-200 dark:border-amber-800 cursor-pointer"
                        title="Edit item"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem({ id: row.id, type: activeSubTab, name: row.name })}
                        className="p-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 border border-rose-200 dark:border-rose-900 cursor-pointer"
                        title="Delete item"
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
                  colSpan={5}
                  className="py-2 pl-3 text-left uppercase tracking-wider text-slate-900 dark:text-white bg-slate-200/90 dark:bg-slate-800 font-black border border-slate-300 dark:border-slate-700 shadow-2xs"
                >
                  <div className="flex items-center justify-start gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 text-xs font-black tracking-widest uppercase shadow-xs">
                      <Layers className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      <span>TOTAL {sortedList.length} {getTabLabel(activeSubTab)}{sortedList.length === 1 ? '' : 'S'}</span>
                    </span>
                  </div>
                </td>
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
              <button type="button" onClick={() => setCurrentPage(1)} disabled={effectivePage === 1} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="First Page">
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={effectivePage === 1} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="Previous Page">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {effectivePage} / {totalPages}
              </span>
              <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={effectivePage === totalPages} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="Next Page">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={effectivePage === totalPages} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="Last Page">
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- ADD / EDIT MODAL --- */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/50">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingItem ? `EDIT ${getTabLabel(activeSubTab)}` : `ADD NEW ${getTabLabel(activeSubTab)}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Code / ID
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="inactive">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Specific fields based on sub tab */}
              {activeSubTab === 'grades' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Size Specification
                  </label>
                  <input
                    type="text"
                    value={formSizeSpec}
                    onChange={(e) => setFormSizeSpec(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              )}

              {activeSubTab === 'blocks' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Location / Upazila
                    </label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

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
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase shadow-xs transition-all cursor-pointer"
                >
                  {editingItem ? 'UPDATE' : 'SAVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW DETAILS MODAL --- */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                  {viewingItem.data.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">CATEGORY:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{viewingItem.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">CODE:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{viewingItem.data.code || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">STATUS:</span>
                <span className="font-bold text-emerald-600 uppercase">{viewingItem.data.status || 'ACTIVE'}</span>
              </div>
              {viewingItem.data.sizeSpec && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase">SIZE SPEC:</span>
                  <span className="font-mono font-bold text-teal-600">{viewingItem.data.sizeSpec}</span>
                </div>
              )}
              {viewingItem.data.district && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-bold uppercase">DISTRICT:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{viewingItem.data.district}</span>
                </div>
              )}
              {viewingItem.data.description && (
                <div className="py-1">
                  <span className="text-slate-400 font-bold uppercase block mb-1">DESCRIPTION:</span>
                  <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                    {viewingItem.data.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-xs cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  DELETE RECORD
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">"{deletingItem.name}"</span>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
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
        title={`MASTER DATA - ${getTabLabel(activeSubTab)}`}
        documentTitle={`MASTER DATA - ${getTabLabel(activeSubTab)}`}
        period={`Total Items: ${sortedList.length}`}
        columns={getExportColumns()}
        data={getExportData()}
      />
    </div>
  );
};
