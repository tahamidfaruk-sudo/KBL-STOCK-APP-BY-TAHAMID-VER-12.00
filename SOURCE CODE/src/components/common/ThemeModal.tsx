import React from 'react';
import { X, Check, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { THEME_OPTIONS } from '../layout/ThemeDropdown';
import { ThemeName } from '../../types';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose }) => {
  const { themeName, setThemeName, themeMode, setThemeMode, isDark, toggleMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/50 rounded-xl text-sky-600 dark:text-sky-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                THEME & APPEARANCE SETTINGS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize your workspace color scheme and visual appearance
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Light / Dark Mode Toggle */}
          <div>
            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              DISPLAY MODE
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs ring-1 ring-sky-500'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>LIGHT MODE</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-sky-950/40 border-sky-500 text-sky-300 shadow-xs ring-1 ring-sky-500'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="w-4 h-4 text-sky-400" />
                <span>DARK MODE</span>
              </button>
            </div>
          </div>

          {/* Color Palettes Grid */}
          <div>
            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              COLOR PALETTES
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = themeName === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeName(theme.id as ThemeName)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-500 ring-1 ring-sky-500'
                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full shrink-0 shadow-2xs border border-white/30"
                        style={{ backgroundColor: theme.color }}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {theme.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {theme.colorName}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
