import React from 'react';
import { Calendar, RotateCcw } from 'lucide-react';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  label?: string;
  onChange: (start: string, end: string) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate = '',
  endDate = '',
  label,
  onChange,
  className = '',
}) => {
  const handlePreset = (type: 'today' | 'week' | 'month' | 'clear') => {
    const today = new Date();
    const format = (d: Date) => d.toISOString().split('T')[0];

    if (type === 'clear') {
      onChange('', '');
      return;
    }

    if (type === 'today') {
      const d = format(today);
      onChange(d, d);
      return;
    }

    if (type === 'week') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      onChange(format(past), format(today));
      return;
    }

    if (type === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      onChange(format(first), format(today));
      return;
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className}`}>
      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
        <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
        <span className="uppercase text-[11px] tracking-wide">DATE RANGE:</span>
      </div>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={startDate}
          onChange={(e) => onChange(e.target.value, endDate)}
          className="px-2 py-1 bg-slate-100/90 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
          title="Start Date"
        />
        <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">TO</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onChange(startDate, e.target.value)}
          className="px-2 py-1 bg-slate-100/90 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
          title="End Date"
        />
      </div>

      {/* Quick filter chips */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handlePreset('today')}
          className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs uppercase cursor-pointer"
        >
          TODAY
        </button>
        <button
          type="button"
          onClick={() => handlePreset('week')}
          className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs uppercase cursor-pointer"
        >
          7 DAYS
        </button>
        <button
          type="button"
          onClick={() => handlePreset('month')}
          className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs uppercase cursor-pointer"
        >
          THIS MONTH
        </button>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => handlePreset('clear')}
            className="p-1 text-[10px] font-bold rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer ml-1"
            title="Reset date filter"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
