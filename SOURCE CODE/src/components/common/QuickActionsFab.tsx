import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  X,
  PackagePlus,
  Truck,
  FileSpreadsheet,
  Trash2,
  LayoutDashboard,
  Palette,
  Wifi,
  Sparkles,
  Layers,
  ArrowUp,
} from 'lucide-react';

interface QuickActionsFabProps {
  onOpenOfflineCache?: () => void;
}

export const QuickActionsFab: React.FC<QuickActionsFabProps> = ({ onOpenOfflineCache }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    setIsStockModalOpen,
    setIsDeliveryModalOpen,
    setIsImportModalOpen,
    setIsRecycleModalOpen,
    setIsThemeModalOpen,
    setActiveTab,
    recycledItems,
    hasPermission,
  } = useApp();

  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      // Alt + Q hotkey toggle
      if (e.altKey && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAction = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };

  const actionItems = [
    {
      id: 'stock-in',
      label: 'New Stock In',
      subtitle: 'Record inbound potato harvest',
      icon: PackagePlus,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      visible: hasPermission('add_stock'),
      onClick: () => handleAction(() => setIsStockModalOpen(true)),
    },
    {
      id: 'stock-out',
      label: 'New Stock Out',
      subtitle: 'Dispatch & customer release',
      icon: Truck,
      color: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30',
      badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
      visible: hasPermission('add_delivery'),
      onClick: () => handleAction(() => setIsDeliveryModalOpen(true)),
    },
    {
      id: 'import-excel',
      label: 'Import 2024 Excel',
      subtitle: 'Batch upload seed lots',
      icon: FileSpreadsheet,
      color: 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30',
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
      visible: true,
      onClick: () => handleAction(() => setIsImportModalOpen(true)),
    },
    {
      id: 'recycle-bin',
      label: 'Recycle Bin',
      subtitle: `${recycledItems.length} deleted items`,
      icon: Trash2,
      color: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      badge: recycledItems.length > 0 ? `${recycledItems.length}` : undefined,
      visible: true,
      onClick: () => handleAction(() => setIsRecycleModalOpen(true)),
    },
    {
      id: 'theme-appearance',
      label: 'Color Theme',
      subtitle: 'Dark mode & custom palettes',
      icon: Palette,
      color: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      visible: true,
      onClick: () => handleAction(() => setIsThemeModalOpen(true)),
    },
    {
      id: 'dashboard',
      label: 'Main Dashboard',
      subtitle: 'Summary & stock matrix',
      icon: LayoutDashboard,
      color: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      visible: true,
      onClick: () => handleAction(() => setActiveTab('dashboard')),
    },
  ];

  return (
    <>
      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-2xs transition-opacity duration-200 no-print"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating container - positioned at bottom-left to completely eliminate congestion with Back to Top in footer */}
      <div
        ref={menuRef}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] sm:bottom-6 left-4 sm:left-6 lg:left-76 z-40 flex flex-col items-start gap-2.5 no-print select-none"
      >
        {/* Speed Dial Menu Items */}
        {isOpen && (
          <div className="flex flex-col items-stretch w-64 sm:w-72 gap-2.5 mb-1 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 dark:bg-slate-800/90 text-white text-[11px] font-black uppercase tracking-widest shadow-lg border border-slate-700/60 mb-0.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>QUICK ACCESS MENU</span>
              <span className="text-[9px] text-slate-400 font-mono font-normal">(Alt+Q)</span>
            </div>

            {actionItems
              .filter((item) => item.visible)
              .map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="group w-full h-14 flex items-center gap-3 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:border-sky-500/50 hover:scale-[1.02] active:scale-95 transition-all duration-150 cursor-pointer text-left"
                    onClick={item.onClick}
                    title={item.label}
                    style={{
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    <span
                      className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-lg border border-white/20 ${item.color}`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col items-start justify-center">
                      <span className="flex w-full items-center gap-2">
                        <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                            {item.badge}
                          </span>
                        )}
                      </span>
                      <span className="w-full truncate text-[10px] text-slate-500 dark:text-slate-400">
                        {item.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        )}

        {/* Primary FAB Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative group w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl shadow-sky-600/30 transition-all duration-300 transform active:scale-95 cursor-pointer border-2 border-white/30 focus:outline-none ${
            isOpen
              ? 'bg-rose-600 hover:bg-rose-700 text-white rotate-90 scale-105'
              : 'bg-gradient-to-tr from-sky-600 via-sky-500 to-emerald-500 hover:from-sky-700 hover:to-emerald-600 text-white hover:scale-105'
          }`}
          title={isOpen ? 'Close Quick Menu (Esc)' : 'Quick Access Menu (Alt+Q)'}
          aria-expanded={isOpen}
        >
          {/* Subtle pulse ring when closed */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full bg-sky-500 opacity-25 group-hover:opacity-40 animate-ping pointer-events-none" />
          )}

          {isOpen ? (
            <X className="w-6 h-6 transition-transform" />
          ) : (
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
          )}

          {/* Unread or recycle count badge */}
          {!isOpen && recycledItems.length > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">
              {recycledItems.length > 9 ? '9+' : recycledItems.length}
            </span>
          )}
        </button>
      </div>
    </>
  );
};
