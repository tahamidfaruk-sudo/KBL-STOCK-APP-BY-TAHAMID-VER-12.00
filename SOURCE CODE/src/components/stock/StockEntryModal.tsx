import React, { useState, useEffect } from 'react';
import { X, Save, Boxes, Plus, Trash2, RotateCcw, FileText, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StockTransaction } from '../../types';

interface StockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editRecord?: StockTransaction | null;
}

interface SrItemLine {
  id: string;
  srNo: string;
  varietyId: string;
  classId: string;
  gradeId: string;
  sackQuantity: number | '';
  kgPerBag: number | '';
}

const fieldClass =
  'w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium';
const labelClass = 'text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-1';

export const StockEntryModal: React.FC<StockEntryModalProps> = ({
  isOpen,
  onClose,
  editRecord,
}) => {
  const {
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    kgPerBagOptions,
    addStockTransaction,
    updateStockTransaction,
    showSuccessDialog,
    addToast,
  } = useApp();

  // Challan Header State (Shared by all SR items)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [kblChallanNo, setKblChallanNo] = useState('');
  const [coldStorageId, setColdStorageId] = useState('');
  const [defaultBlockId, setDefaultBlockId] = useState('');
  const [truckNo, setTruckNo] = useState('');
  const [driverName, setDriverName] = useState('');

  // Multi-SR Items State
  const createEmptySrItem = (): SrItemLine => ({
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    srNo: '',
    varietyId: varieties[0]?.id || '',
    classId: seedClasses[0]?.id || '',
    gradeId: grades[0]?.id || '',
    sackQuantity: '',
    kgPerBag: 50,
  });

  const [srItems, setSrItems] = useState<SrItemLine[]>([createEmptySrItem()]);

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setKblChallanNo('');
    setColdStorageId('');
    setDefaultBlockId('');
    setTruckNo('');
    setDriverName('');
    setSrItems([
      {
        id: `item-${Date.now()}`,
        srNo: '',
        varietyId: varieties[0]?.id || '',
        classId: seedClasses[0]?.id || '',
        gradeId: grades[0]?.id || '',
        sackQuantity: '',
        kgPerBag: 50,
      },
    ]);
  };

  const handleClearForm = () => {
    resetForm();
    addToast('Stock In entry form has been cleared.', 'info');
  };

  useEffect(() => {
    if (editRecord) {
      setDate(editRecord.date || new Date().toISOString().split('T')[0]);
      setKblChallanNo(editRecord.kblChallanNo || '');
      setColdStorageId(editRecord.coldStorageId || '');
      setDefaultBlockId(editRecord.productionBlockId || '');
      setTruckNo(editRecord.truckNo || '');
      setDriverName(editRecord.driverName || '');
      setSrItems([
        {
          id: editRecord.id,
          srNo: editRecord.srNo || '',
          varietyId: editRecord.varietyId || '',
          classId: editRecord.classId || '',
          gradeId: editRecord.gradeId || '',
          sackQuantity: editRecord.sackQuantity || '',
          kgPerBag: editRecord.kgPerBag || 50,
        },
      ]);
    } else {
      resetForm();
    }
  }, [editRecord, isOpen]);

  if (!isOpen) return null;

  // Add a new SR item row to the current challan
  const handleAddSrLine = () => {
    setSrItems((prev) => [...prev, createEmptySrItem()]);
    addToast('Added new SR item line to Challan', 'info');
  };

  // Remove an SR line
  const handleRemoveSrLine = (id: string) => {
    if (srItems.length <= 1) {
      addToast('A Challan must contain at least one SR item.', 'warning');
      return;
    }
    setSrItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update a specific field of an SR item
  const updateSrItem = (id: string, field: keyof SrItemLine, value: any) => {
    setSrItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Grand totals across all SR lines
  const grandTotalBags = srItems.reduce((acc, row) => acc + (Number(row.sackQuantity) || 0), 0);
  const grandTotalKg = srItems.reduce(
    (acc, row) => acc + (Number(row.sackQuantity) || 0) * (Number(row.kgPerBag) || 0),
    0
  );
  const grandTotalMt = Number((grandTotalKg / 1000).toFixed(3));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!kblChallanNo.trim()) {
      addToast('KBL Challan No is required.', 'warning');
      return;
    }
    if (!coldStorageId) {
      addToast('Please select a Cold Storage facility.', 'warning');
      return;
    }

    // Validate each SR line
    for (let i = 0; i < srItems.length; i++) {
      const line = srItems[i];
      const lineNo = i + 1;
      if (!line.srNo.trim()) {
        addToast(`Item #${lineNo}: SR No issued by Cold Store is required.`, 'warning');
        return;
      }
      if (!line.varietyId) {
        addToast(`Item #${lineNo}: Potato Variety is required.`, 'warning');
        return;
      }
      if (!line.classId) {
        addToast(`Item #${lineNo}: Seed Class is required.`, 'warning');
        return;
      }
      if (!line.gradeId) {
        addToast(`Item #${lineNo}: Grade is required.`, 'warning');
        return;
      }
      if (!line.sackQuantity || Number(line.sackQuantity) <= 0) {
        addToast(`Item #${lineNo}: Please enter a valid number of bags.`, 'warning');
        return;
      }
      if (!line.kgPerBag || Number(line.kgPerBag) <= 0) {
        addToast(`Item #${lineNo}: Please select KG per bag.`, 'warning');
        return;
      }
    }

    if (editRecord) {
      const line = srItems[0];
      const totalKg = (Number(line.sackQuantity) || 0) * (Number(line.kgPerBag) || 0);
      const totalMt = Number((totalKg / 1000).toFixed(3));
      updateStockTransaction(editRecord.id, {
        date,
        kblChallanNo: kblChallanNo.trim().toUpperCase(),
        srNo: line.srNo.trim().toUpperCase(),
        coldStorageId,
        varietyId: line.varietyId,
        classId: line.classId,
        gradeId: line.gradeId,
        productionBlockId: defaultBlockId,
        truckNo: truckNo.trim().toUpperCase(),
        driverName: driverName.trim().toUpperCase(),
        sackQuantity: Number(line.sackQuantity),
        kgPerBag: Number(line.kgPerBag),
        totalKg,
        totalMt,
        status: 'approved',
      });
      showSuccessDialog(
        'STOCK RECORD UPDATED',
        `Stock In entry for Challan "${kblChallanNo.toUpperCase()}" (SR: ${line.srNo.toUpperCase()}) was successfully updated.`
      );
      resetForm();
      onClose();
      return;
    }

    // New Multi-SR Creation: save each SR as a separate stock transaction under this challan
    let createdCount = 0;
    for (const line of srItems) {
      const totalKg = (Number(line.sackQuantity) || 0) * (Number(line.kgPerBag) || 0);
      const totalMt = Number((totalKg / 1000).toFixed(3));
      const res = addStockTransaction({
        date,
        kblChallanNo: kblChallanNo.trim().toUpperCase(),
        srNo: line.srNo.trim().toUpperCase(),
        coldStorageId,
        varietyId: line.varietyId,
        classId: line.classId,
        gradeId: line.gradeId,
        productionBlockId: defaultBlockId,
        truckNo: truckNo.trim().toUpperCase(),
        driverName: driverName.trim().toUpperCase(),
        sackQuantity: Number(line.sackQuantity),
        kgPerBag: Number(line.kgPerBag),
        totalKg,
        totalMt,
        status: 'approved',
      });
      if (res.success) createdCount++;
    }

    showSuccessDialog(
      'STOCK IN ENTRY SUCCESSFUL',
      `Successfully recorded ${createdCount} SR item(s) under KBL Challan "${kblChallanNo.toUpperCase()}". Total: ${grandTotalBags.toLocaleString()} Bags (${grandTotalMt.toFixed(3)} MT).`
    );
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-sky-100 text-sky-600 dark:bg-sky-950/80 dark:text-sky-400 rounded-xl shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                {editRecord ? 'EDIT STOCK IN TRANSACTION' : 'STOCK IN ENTRY (MULTI-SR CHALLAN)'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Issue separate Cold Store SR numbers per variety, class & grade under one KBL Challan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Card 1: Challan Common Details */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-800">
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                CHALLAN DETAILS & COLD STORAGE DESTINATION
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>CHALLAN DATE *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className={fieldClass}
                />
              </div>

              <div>
                <label className={labelClass}>KBL DELIVERY CHALLAN NO *</label>
                <input
                  type="text"
                  value={kblChallanNo}
                  onChange={(e) => setKblChallanNo(e.target.value.toUpperCase())}
                  required
                  className={`${fieldClass} uppercase font-bold`}
                />
              </div>

              <div>
                <label className={labelClass}>COLD STORAGE FACILITY *</label>
                <select
                  value={coldStorageId}
                  onChange={(e) => setColdStorageId(e.target.value)}
                  required
                  className={fieldClass}
                >
                  <option value="">SELECT COLD STORAGE</option>
                  {coldStorages.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.name.toUpperCase()} ({cs.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>PRODUCTION BLOCK (OPTIONAL)</label>
                <select
                  value={defaultBlockId}
                  onChange={(e) => setDefaultBlockId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">SELECT PRODUCTION BLOCK</option>
                  {productionBlocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>TRUCK NO (OPTIONAL)</label>
                <input
                  type="text"
                  value={truckNo}
                  onChange={(e) => setTruckNo(e.target.value.toUpperCase())}
                  className={`${fieldClass} uppercase`}
                />
              </div>

              <div>
                <label className={labelClass}>DRIVER NAME (OPTIONAL)</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value.toUpperCase())}
                  className={`${fieldClass} uppercase`}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Multi-SR Items Table / List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                  COLD STORAGE SR ITEMS BREAKDOWN ({srItems.length})
                </h4>
              </div>

              {!editRecord && (
                <button
                  type="button"
                  onClick={handleAddSrLine}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer uppercase active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>ADD SR NO / ITEM</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {srItems.map((line, idx) => {
                const lineKg = (Number(line.sackQuantity) || 0) * (Number(line.kgPerBag) || 0);
                const lineMt = Number((lineKg / 1000).toFixed(3));

                return (
                  <div
                    key={line.id}
                    className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs relative transition-all"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-mono text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase">
                          SR ITEM ENTRY #{idx + 1}
                        </span>
                      </div>

                      {srItems.length > 1 && !editRecord && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSrLine(line.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove this SR item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                      {/* Cold Store SR No */}
                      <div>
                        <label className={labelClass}>SR NO *</label>
                        <input
                          type="text"
                          required
                          value={line.srNo}
                          onChange={(e) => updateSrItem(line.id, 'srNo', e.target.value.toUpperCase())}
                          className={`${fieldClass} uppercase font-bold text-sky-700 dark:text-sky-300`}
                        />
                      </div>

                      {/* Variety */}
                      <div>
                        <label className={labelClass}>VARIETY *</label>
                        <select
                          required
                          value={line.varietyId}
                          onChange={(e) => updateSrItem(line.id, 'varietyId', e.target.value)}
                          className={fieldClass}
                        >
                          <option value="">SELECT VARIETY</option>
                          {varieties.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Seed Class */}
                      <div>
                        <label className={labelClass}>CLASS *</label>
                        <select
                          required
                          value={line.classId}
                          onChange={(e) => updateSrItem(line.id, 'classId', e.target.value)}
                          className={fieldClass}
                        >
                          <option value="">SELECT CLASS</option>
                          {seedClasses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Grade */}
                      <div>
                        <label className={labelClass}>GRADE *</label>
                        <select
                          required
                          value={line.gradeId}
                          onChange={(e) => updateSrItem(line.id, 'gradeId', e.target.value)}
                          className={fieldClass}
                        >
                          <option value="">SELECT GRADE</option>
                          {grades.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sacks / Bags In */}
                      <div>
                        <label className={labelClass}>BAGS IN *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={line.sackQuantity}
                          onChange={(e) =>
                            updateSrItem(
                              line.id,
                              'sackQuantity',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className={`${fieldClass} font-mono font-bold`}
                        />
                      </div>

                      {/* KG per Bag */}
                      <div>
                        <label className={labelClass}>KG / BAG *</label>
                        <select
                          required
                          value={line.kgPerBag}
                          onChange={(e) =>
                            updateSrItem(
                              line.id,
                              'kgPerBag',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className={`${fieldClass} font-mono font-bold`}
                        >
                          {kgPerBagOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt} KG
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row Summary Badge */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-500 font-medium">Item Subtotal:</span>
                      <div className="flex items-center gap-3 font-mono font-bold">
                        <span className="text-slate-700 dark:text-slate-300">
                          {Number(line.sackQuantity || 0).toLocaleString()} Bags
                        </span>
                        <span className="text-slate-900 dark:text-white">
                          {lineKg.toLocaleString()} KG
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {lineMt.toFixed(3)} MT
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grand Summary Banner */}
          <div className="p-3.5 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10.5px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider block">
                TOTAL CHALLAN SUMMARY
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {srItems.length} Variety / SR Items under Challan{' '}
                <strong className="text-slate-900 dark:text-white">{kblChallanNo || '-'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono font-black">
              <div className="text-right">
                <span className="text-[9.5px] font-bold text-slate-500 block uppercase">TOTAL BAGS</span>
                <span className="text-sm text-slate-900 dark:text-white">
                  {grandTotalBags.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9.5px] font-bold text-slate-500 block uppercase">TOTAL KG</span>
                <span className="text-sm text-slate-900 dark:text-white">
                  {grandTotalKg.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                  TOTAL MT
                </span>
                <span className="text-sm text-emerald-600 dark:text-emerald-400">
                  {grandTotalMt.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Action Controls: Clear Form, Cancel, Save */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClearForm}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer uppercase"
              title="Reset all inputs and clear form"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>CLEAR FORM</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer uppercase"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer uppercase tracking-wider"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {editRecord
                    ? 'UPDATE RECORD'
                    : `SAVE ALL STOCK IN (${srItems.length} SR)`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
