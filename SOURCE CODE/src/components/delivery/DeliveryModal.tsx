import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Truck, Lock, Unlock, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DeliveryTransaction } from '../../types';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editRecord?: DeliveryTransaction | null;
}

const fieldClass =
  'w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100 dark:disabled:bg-slate-900/60 disabled:cursor-not-allowed disabled:text-slate-500';
const labelClass = 'text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1';

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  editRecord,
}) => {
  const {
    currentUser,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    kgPerBagOptions,
    stockTransactions,
    deliveryTransactions,
    addDeliveryTransaction,
    updateDeliveryTransaction,
    showSuccessDialog,
    showFeedbackDialog,
    addToast,
  } = useApp();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryNo, setDeliveryNo] = useState('');
  const [coldStorageId, setColdStorageId] = useState('');
  const [srNo, setSrNo] = useState('');
  const [varietyId, setVarietyId] = useState('');
  const [classId, setClassId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [sackQuantity, setSackQuantity] = useState<number | ''>('');
  const [kgPerBag, setKgPerBag] = useState<number | ''>('');
  const [isLocked, setIsLocked] = useState(true);
  const [autoFilled, setAutoFilled] = useState(false);

  // Distinct available SR numbers from Stock In transactions
  const availableSrList = useMemo(() => {
    const map = new Map<string, { srNo: string; varietyName: string; coldStoreName: string; availableBags: number }>();
    stockTransactions
      .filter((s) => s.status === 'approved' && s.srNo)
      .forEach((s) => {
        const sr = s.srNo.trim().toUpperCase();
        const totalIn = stockTransactions
          .filter((st) => st.status === 'approved' && st.srNo?.trim().toUpperCase() === sr)
          .reduce((sum, st) => sum + st.sackQuantity, 0);
        const totalOut = deliveryTransactions
          .filter(
            (dt) =>
              (dt.status === 'approved' || dt.status === 'completed') &&
              dt.srNo?.trim().toUpperCase() === sr &&
              (!editRecord || dt.id !== editRecord.id)
          )
          .reduce((sum, dt) => sum + dt.sackQuantity, 0);
        const bal = Math.max(0, totalIn - totalOut);
        const vName = varieties.find((v) => v.id === s.varietyId)?.name || 'POTATO';
        const csName = coldStorages.find((c) => c.id === s.coldStorageId)?.name || '';
        map.set(sr, { srNo: sr, varietyName: vName, coldStoreName: csName, availableBags: bal });
      });
    return Array.from(map.values());
  }, [stockTransactions, deliveryTransactions, varieties, coldStorages, editRecord]);

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setDeliveryNo('');
    setColdStorageId('');
    setSrNo('');
    setVarietyId('');
    setClassId('');
    setGradeId('');
    setSackQuantity('');
    setKgPerBag('');
    setIsLocked(true);
    setAutoFilled(false);
  };

  useEffect(() => {
    if (editRecord) {
      setDate(editRecord.date || new Date().toISOString().split('T')[0]);
      setDeliveryNo(editRecord.deliveryNo || '');
      setColdStorageId(editRecord.coldStorageId || '');
      setSrNo(editRecord.srNo || '');
      setVarietyId(editRecord.varietyId || '');
      setClassId(editRecord.classId || '');
      setGradeId(editRecord.gradeId || '');
      setSackQuantity(editRecord.sackQuantity || '');
      setKgPerBag(editRecord.kgPerBag || '');
      setIsLocked(true);
      setAutoFilled(true);
    } else {
      resetForm();
    }
  }, [editRecord, isOpen]);

  // Handle SR No input change & auto-fill from Stock In database
  const handleSrChange = (value: string) => {
    const upper = value.toUpperCase();
    setSrNo(upper);
    const cleanSr = upper.trim();

    if (!cleanSr) {
      setAutoFilled(false);
      return;
    }

    const matchedStock = stockTransactions.find(
      (s) => s.srNo?.trim().toUpperCase() === cleanSr && s.status === 'approved'
    );

    if (matchedStock) {
      setColdStorageId(matchedStock.coldStorageId || '');
      setVarietyId(matchedStock.varietyId || '');
      setClassId(matchedStock.classId || '');
      setGradeId(matchedStock.gradeId || '');
      setKgPerBag(matchedStock.kgPerBag || 50);
      setIsLocked(true);
      setAutoFilled(true);
    } else {
      setAutoFilled(false);
    }
  };

  const handleUnlockClick = () => {
    if (!isLocked) {
      setIsLocked(true);
      addToast('Input fields have been locked', 'info');
      return;
    }

    // Role check: super admin or admin allowed to unlock
    const isSuperAdmin =
      currentUser?.roleName === 'Super Admin' ||
      currentUser?.role === 'Super Admin' ||
      currentUser?.roleId === 'role-super-admin' ||
      currentUser?.roleId === 'role-admin';

    if (!isSuperAdmin) {
      addToast('pls contact with-System ADmin', 'error');
      showFeedbackDialog({
        title: 'ACCESS RESTRICTED',
        message: 'pls contact with-System ADmin',
        type: 'warning',
      });
      return;
    }

    setIsLocked(false);
    addToast('Fields unlocked by System Admin for manual override', 'success');
  };

  const handleClearForm = () => {
    resetForm();
    addToast('Form cleared successfully', 'info');
  };

  if (!isOpen) return null;

  const availableBags = (() => {
    if (srNo.trim()) {
      const clean = srNo.trim().toUpperCase();
      const inBags = stockTransactions
        .filter((s) => s.status === 'approved' && s.srNo?.trim().toUpperCase() === clean)
        .reduce((sum, s) => sum + s.sackQuantity, 0);
      const outBags = deliveryTransactions
        .filter(
          (d) =>
            (d.status === 'approved' || d.status === 'completed') &&
            d.srNo?.trim().toUpperCase() === clean &&
            (!editRecord || d.id !== editRecord.id)
        )
        .reduce((sum, d) => sum + d.sackQuantity, 0);
      return Math.max(0, inBags - outBags);
    }

    if (!coldStorageId || !varietyId || !classId || !gradeId) return 0;
    const totalIn = stockTransactions
      .filter(
        (s) =>
          s.status === 'approved' &&
          s.coldStorageId === coldStorageId &&
          s.varietyId === varietyId &&
          s.classId === classId &&
          s.gradeId === gradeId
      )
      .reduce((sum, s) => sum + s.sackQuantity, 0);

    const totalOut = deliveryTransactions
      .filter(
        (d) =>
          (d.status === 'approved' || d.status === 'completed') &&
          d.coldStorageId === coldStorageId &&
          d.varietyId === varietyId &&
          d.classId === classId &&
          d.gradeId === gradeId &&
          (!editRecord || d.id !== editRecord.id)
      )
      .reduce((sum, d) => sum + d.sackQuantity, 0);

    return Math.max(0, totalIn - totalOut);
  })();

  const totalKg = (Number(sackQuantity) || 0) * (Number(kgPerBag) || 0);
  const totalMt = Number((totalKg / 1000).toFixed(3));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!srNo.trim()) {
      addToast('Please enter or select an SR No', 'warning');
      return;
    }
    if (!coldStorageId) {
      addToast('Please select a Cold Storage facility', 'warning');
      return;
    }
    if (!varietyId) {
      addToast('Please select a Potato Variety', 'warning');
      return;
    }
    if (!classId) {
      addToast('Please select a Seed Class', 'warning');
      return;
    }
    if (!gradeId) {
      addToast('Please select a Grade', 'warning');
      return;
    }
    if (!sackQuantity || Number(sackQuantity) <= 0) {
      addToast('Please enter a valid dispatch sack quantity', 'warning');
      return;
    }
    if (!kgPerBag || Number(kgPerBag) <= 0) {
      addToast('Please select KG per bag', 'warning');
      return;
    }

    const payload = {
      date,
      deliveryNo: deliveryNo.trim().toUpperCase() || `DO-${Date.now().toString().slice(-6)}`,
      coldStorageId,
      srNo: srNo.trim().toUpperCase(),
      varietyId,
      classId,
      gradeId,
      productionBlockId: '',
      sackQuantity: Number(sackQuantity),
      kgPerBag: Number(kgPerBag),
      totalKg,
      totalMt,
      customerReceiver: '',
      deliveryReference: srNo.trim().toUpperCase() || deliveryNo.trim().toUpperCase() || 'DO-AUTO',
      status: 'approved' as const,
    };

    if (editRecord) {
      updateDeliveryTransaction(editRecord.id, payload);
      showSuccessDialog(
        'DELIVERY RECORD UPDATED',
        `Delivery dispatch record "${payload.deliveryNo || payload.srNo}" has been updated successfully.`
      );
      addToast('Delivery record updated successfully', 'success');
      resetForm();
    } else {
      const res = addDeliveryTransaction(payload);
      if (!res.success) {
        addToast(res.message, 'error');
        return;
      }
      showSuccessDialog(
        'DELIVERY DISPATCH RECORDED',
        `Delivery dispatch "${payload.deliveryNo || payload.srNo}" (${payload.sackQuantity.toLocaleString()} Bags • ${payload.totalMt} MT) was successfully recorded.`
      );
      addToast('Delivery dispatch recorded and form cleared', 'success');
      resetForm();
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide truncate">
                {editRecord ? 'EDIT STOCK OUT' : 'STOCK OUT / DELIVERY DISPATCH'}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">
                Auto-fill from Stock-In DB by SR No with Admin Lock Protection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5">
          {/* SR No and Auto-fill status banner */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {autoFilled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase">
                    {autoFilled
                      ? `SR ${srNo} MATCHED • STOCK BALANCE: ${availableBags.toLocaleString()} BAGS`
                      : 'ENTER SR NO TO AUTO-FILL VARIETY, CLASS, GRADE & STORE'}
                  </span>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Data is locked by default. Non-admin users cannot alter verified Stock-In data.
                  </p>
                </div>
              </div>

              {/* Unlock / Lock Toggle */}
              <button
                type="button"
                onClick={handleUnlockClick}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer shadow-xs shrink-0 ${
                  isLocked
                    ? 'border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100/50'
                    : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>UNLOCK FIELDS</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>FIELDS UNLOCKED</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Row 1: Date, Delivery No, SR No */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>DATE</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>DELIVERY / GATE PASS NO</label>
              <input
                type="text"
                value={deliveryNo}
                placeholder="e.g. DO-2024-001"
                onChange={(e) => setDeliveryNo(e.target.value)}
                className={`${fieldClass} uppercase`}
              />
            </div>
            <div>
              <label className={labelClass}>
                SR NO <span className="text-amber-600 font-black">* (PRIMARY LOOKUP)</span>
              </label>
              <input
                type="text"
                list="delivery-sr-datalist"
                value={srNo}
                onChange={(e) => handleSrChange(e.target.value)}
                placeholder="TYPE OR SELECT SR..."
                required
                className={`${fieldClass} uppercase font-bold text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800`}
              />
              <datalist id="delivery-sr-datalist">
                {availableSrList.map((item) => (
                  <option key={item.srNo} value={item.srNo}>
                    {item.varietyName} • {item.coldStoreName} ({item.availableBags} Bags)
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 2: Cold Storage & Variety (Locked unless Super Admin unlocks) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>COLD STORAGE</label>
                {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
              </div>
              <select
                value={coldStorageId}
                onChange={(e) => setColdStorageId(e.target.value)}
                disabled={isLocked}
                required
                className={fieldClass}
              >
                <option value="">Select Cold Storage</option>
                {coldStorages.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>POTATO VARIETY</label>
                {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
              </div>
              <select
                value={varietyId}
                onChange={(e) => setVarietyId(e.target.value)}
                disabled={isLocked}
                required
                className={fieldClass}
              >
                <option value="">Select Variety</option>
                {varieties.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Class & Grade (Locked unless Super Admin unlocks) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>SEED CLASS</label>
                {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
              </div>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={isLocked}
                required
                className={fieldClass}
              >
                <option value="">Select Class</option>
                {seedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>GRADE</label>
                {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
              </div>
              <select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                disabled={isLocked}
                required
                className={fieldClass}
              >
                <option value="">Select Grade</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Dispatch Quantities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>DISPATCH BAGS</label>
                {availableBags > 0 && (
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    MAX: {availableBags}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max={availableBags > 0 ? availableBags : undefined}
                value={sackQuantity}
                onChange={(e) => setSackQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Qty..."
                required
                className={`${fieldClass} font-mono font-bold tabular-nums`}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>KG PER BAG</label>
                {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
              </div>
              <select
                value={kgPerBag}
                onChange={(e) => setKgPerBag(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={isLocked}
                required
                className={`${fieldClass} font-mono font-bold tabular-nums`}
              >
                <option value="">Select KG</option>
                {kgPerBagOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} KG
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className={labelClass}>DISPATCH KG</span>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono font-black tabular-nums text-slate-700 dark:text-slate-200 text-right pr-3 border border-slate-200 dark:border-slate-700">
                {totalKg.toLocaleString()}
              </div>
            </div>
            <div>
              <span className={labelClass}>DISPATCH MT</span>
              <div className="px-3 py-2 bg-amber-100/80 dark:bg-amber-900/60 rounded-xl text-xs font-mono font-black tabular-nums text-amber-800 dark:text-amber-300 text-right pr-3 border border-amber-300/50 dark:border-amber-700/50">
                {totalMt.toFixed(3)}
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClearForm}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl transition-colors cursor-pointer uppercase"
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
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer uppercase tracking-wider"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editRecord ? 'UPDATE' : 'SAVE DISPATCH'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
