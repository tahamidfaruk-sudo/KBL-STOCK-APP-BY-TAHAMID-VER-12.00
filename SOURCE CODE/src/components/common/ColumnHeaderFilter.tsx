import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Filter, X, Search, RotateCcw } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface ColumnHeaderFilterProps {
  columnTitle: string;
  type?: 'select' | 'date-range' | 'number-range';
  align?: 'left' | 'right';

  // For 'select' type (category, item name, status, etc.)
  options?: FilterOption[];
  selectedValues?: string[];
  onSelectValues?: (values: string[]) => void;
  // Single-value fallback
  value?: string;
  onChangeValue?: (value: string) => void;

  // For 'date-range' type
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (start: string, end: string) => void;

  // For 'number-range' type
  minVal?: number | '';
  maxVal?: number | '';
  onNumberRangeChange?: (min: number | '', max: number | '') => void;

  // Clear handlers
  isFiltered: boolean;
  onClearFilter: () => void;
  onClearAllFilters?: () => void;
}

export const ColumnHeaderFilter: React.FC<ColumnHeaderFilterProps> = ({
  columnTitle,
  type = 'select',
  align = 'left',
  options = [],
  selectedValues,
  onSelectValues,
  value,
  onChangeValue,
  startDate = '',
  endDate = '',
  onDateRangeChange,
  minVal = '',
  maxVal = '',
  onNumberRangeChange,
  isFiltered,
  onClearFilter,
  onClearAllFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Normalize selected values array
  const effectiveSelectedValues = useMemo(() => {
    if (selectedValues !== undefined) {
      return selectedValues;
    }
    if (value !== undefined && value !== '') {
      return [value];
    }
    return [];
  }, [selectedValues, value]);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 280;
      let left = align === 'right' ? rect.right - dropdownWidth : rect.left;
      if (left + dropdownWidth > window.innerWidth - 12) {
        left = window.innerWidth - dropdownWidth - 12;
      }
      if (left < 12) {
        left = 12;
      }
      setCoords({
        top: rect.bottom + 6,
        left,
      });
    }
  };

  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle window scroll & resize to reposition
  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => {
      updatePosition();
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, align]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter options by search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchTerm]);

  const handleToggleValue = (val: string) => {
    if (onSelectValues) {
      if (effectiveSelectedValues.includes(val)) {
        onSelectValues(effectiveSelectedValues.filter((v) => v !== val));
      } else {
        onSelectValues([...effectiveSelectedValues, val]);
      }
    } else if (onChangeValue) {
      if (value === val) {
        onChangeValue('');
      } else {
        onChangeValue(val);
      }
    }
  };

  const handleSelectAll = () => {
    if (onSelectValues) {
      onSelectValues(options.map((opt) => opt.value));
    }
  };

  const handleDeselectAll = () => {
    if (onSelectValues) {
      onSelectValues([]);
    } else if (onChangeValue) {
      onChangeValue('');
    }
  };

  const handleDatePreset = (preset: 'today' | 'last7' | 'thisMonth' | 'all') => {
    if (!onDateRangeChange) return;
    const now = new Date();
    const toYMD = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = toYMD(now);
      onDateRangeChange(todayStr, todayStr);
    } else if (preset === 'last7') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      onDateRangeChange(toYMD(past), toYMD(now));
    } else if (preset === 'thisMonth') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      onDateRangeChange(toYMD(startOfMonth), toYMD(now));
    } else {
      onDateRangeChange('', '');
    }
  };

  return (
    <div className="relative inline-flex items-center text-left" onClick={(e) => e.stopPropagation()}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggleOpen}
        className={`p-1 rounded transition-all cursor-pointer inline-flex items-center justify-center ${
          isFiltered
            ? 'text-sky-300 bg-sky-500/30 ring-1 ring-sky-400 shadow-xs'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
        }`}
        title={`Filter ${columnTitle}${isFiltered ? ' (Filter active)' : ''}`}
        aria-label={`Filter by ${columnTitle}`}
      >
        <Filter className="w-3 h-3 stroke-[2.2]" />
      </button>

      {/* Popover Dropdown (Fixed positioning prevents table clipping) */}
      {isOpen && (
        <div
          ref={popoverRef}
          style={{ top: coords.top, left: coords.left }}
          className="fixed z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3 text-slate-800 dark:text-slate-200 text-xs font-normal normal-case animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200">
              <Filter className="w-3 h-3 text-sky-500" />
              <span>FILTER {columnTitle}</span>
              {isFiltered && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body: Date Range Type */}
          {type === 'date-range' && (
            <div className="space-y-3">
              {/* Presets */}
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleDatePreset('today')}
                  className="py-1 px-2 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/60 dark:hover:text-sky-400 font-medium transition-colors text-center cursor-pointer shadow-2xs"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset('last7')}
                  className="py-1 px-2 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/60 dark:hover:text-sky-400 font-medium transition-colors text-center cursor-pointer shadow-2xs"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset('thisMonth')}
                  className="py-1 px-2 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/60 dark:hover:text-sky-400 font-medium transition-colors text-center cursor-pointer shadow-2xs"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset('all')}
                  className="py-1 px-2 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 font-medium transition-colors text-center cursor-pointer shadow-2xs"
                >
                  All Dates
                </button>
              </div>

              {/* Custom Date Inputs */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    START DATE
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onDateRangeChange?.(e.target.value, endDate)}
                    className="w-full py-1 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-200/90 dark:bg-slate-600 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    END DATE
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onDateRangeChange?.(startDate, e.target.value)}
                    className="w-full py-1 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-200/90 dark:bg-slate-600 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Body: Number Range Type */}
          {type === 'number-range' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    MIN VALUE
                  </label>
                  <input
                    type="number"
                    value={minVal}
                    onChange={(e) =>
                      onNumberRangeChange?.(
                        e.target.value === '' ? '' : Number(e.target.value),
                        maxVal
                      )
                    }
                    className="w-full py-1 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    MAX VALUE
                  </label>
                  <input
                    type="number"
                    value={maxVal}
                    onChange={(e) =>
                      onNumberRangeChange?.(
                        minVal,
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="w-full py-1 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Body: Select / Multi-Select Type */}
          {type === 'select' && (
            <div className="space-y-2">
              {/* Search Inside Dropdown if more than 5 options */}
              {options.length > 5 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              )}

              {/* Select All / Deselect All Bar */}
              <div className="flex items-center justify-between text-[11px] pt-1 px-0.5 text-slate-500">
                {onSelectValues && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:underline cursor-pointer ml-auto"
                >
                  Clear Selection
                </button>
              </div>

              {/* Options List */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-100 dark:border-slate-800 rounded-lg p-1.5 bg-slate-50/50 dark:bg-slate-950/40">
                {filteredOptions.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    No matching values.
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isChecked = effectiveSelectedValues.includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-center justify-between p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-800/80 cursor-pointer transition-colors text-xs ${
                          isChecked ? 'font-bold text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/40' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleValue(opt.value)}
                            className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          <span className="break-words">{opt.label}</span>
                        </div>
                        {opt.count !== undefined && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            {opt.count}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClearFilter();
                setSearchTerm('');
              }}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer uppercase"
            >
              Reset Column
            </button>

            {onClearAllFilters && (
              <button
                type="button"
                onClick={() => {
                  onClearAllFilters();
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer uppercase"
                title="Clear all filters across the entire table"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear All Filters</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-[11px] font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-2xs transition-colors cursor-pointer uppercase"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
