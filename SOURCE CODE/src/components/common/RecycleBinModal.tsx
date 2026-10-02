import React from 'react';
import { X, Trash2, RotateCcw, AlertTriangle, Boxes, Truck, Warehouse } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({ isOpen, onClose }) => {
  const {
    recycledItems,
    restoreFromRecycleBin,
    permanentDeleteRecycled,
    emptyRecycleBin,
    openConfirmationDialog,
  } = useApp();

  if (!isOpen) return null;

  const handleEmpty = () => {
    openConfirmationDialog({
      title: 'EMPTY RECYCLE BIN',
      message: 'Are you sure you want to permanently delete all items in the Recycle Bin? This action cannot be undone.',
      confirmText: 'EMPTY ALL',
      cancelText: 'CANCEL',
      type: 'warning',
      onConfirm: () => emptyRecycleBin(),
    });
  };

  const handleRestore = (item: typeof recycledItems[0]) => {
    openConfirmationDialog({
      title: 'CONFIRM DATA RESTORE',
      message: `Are you sure you want to restore "${item.title}" back to active database records?`,
      confirmText: 'RESTORE RECORD',
      cancelText: 'CANCEL',
      type: 'info',
      onConfirm: () => restoreFromRecycleBin(item.id),
    });
  };

  const handlePermanentDelete = (item: typeof recycledItems[0]) => {
    openConfirmationDialog({
      title: 'PERMANENTLY DELETE RECORD',
      message: `Are you sure you want to permanently purge "${item.title}"? This action cannot be reversed.`,
      confirmText: 'DELETE PERMANENTLY',
      cancelText: 'CANCEL',
      type: 'error',
      onConfirm: () => permanentDeleteRecycled(item.id),
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'stock':
        return <Boxes className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'delivery':
        return <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'cold_storage':
        return <Warehouse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Trash2 className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                RECYCLE BIN ({recycledItems.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Restore accidentally deleted records or purge permanently
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
          {recycledItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Trash2 className="w-12 h-12 mx-auto stroke-[1.2] opacity-40 mb-2" />
              <p className="text-sm font-semibold">The Recycle Bin is empty</p>
              <p className="text-xs text-slate-400 mt-1">Deleted items will appear here for safe restoration</p>
            </div>
          ) : (
            recycledItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-2xs">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.subtitle}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Deleted: {new Date(item.deletedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleRestore(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer uppercase"
                    title="Restore to active records"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESTORE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePermanentDelete(item)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                    title="Permanently Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          {recycledItems.length > 0 ? (
            <button
              type="button"
              onClick={handleEmpty}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer uppercase"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>EMPTY RECYCLE BIN</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer uppercase"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
