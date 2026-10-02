import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface SortIconProps {
  field?: string;
  currentField?: string;
  direction?: 'asc' | 'desc';
  columnKey?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
}

export const SortIcon: React.FC<SortIconProps> = ({
  field,
  currentField,
  direction,
  columnKey,
  sortKey,
  sortDir,
}) => {
  const activeCol = field || columnKey;
  const current = currentField || sortKey;
  const dir = direction || sortDir || 'asc';

  if (!activeCol || activeCol !== current) {
    return <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 inline ml-0.5 opacity-50 shrink-0" />;
  }

  return dir === 'asc' ? (
    <ArrowUp className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400 inline ml-0.5 shrink-0 font-bold" />
  ) : (
    <ArrowDown className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400 inline ml-0.5 shrink-0 font-bold" />
  );
};
