import React from 'react';
import { Warehouse, Plus } from 'lucide-react';

export const ColdStorageEmptyState: React.FC<{ onAdd?: () => void }> = ({ onAdd }) => {
  return (
    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <Warehouse className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Cold Storages Found</h3>
      <p className="text-xs text-slate-500 mt-1">Add your storage vaults and chambers to start tracking inventory.</p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-700"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Cold Storage</span>
        </button>
      )}
    </div>
  );
};
