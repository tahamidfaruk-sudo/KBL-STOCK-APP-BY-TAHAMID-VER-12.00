import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { NavigationTab } from '../../types';
import {
  Bell,
  Palette,
  Search,
  PlusCircle,
  Truck,
  DollarSign,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  X,
  FileText,
  Package,
  BarChart3,
  ArrowRight,
  CornerDownLeft,
  Building2,
  Sparkles,
  Sprout,
  Trash2,
  Keyboard,
  Scale,
} from 'lucide-react';
import { ThemeModal } from '../common/ThemeModal';
import { ThemeDropdown } from './ThemeDropdown';
import { OfflineIndicator } from '../common/OfflineIndicator';

interface HeaderProps {
  onToggleSidebar: () => void;
}

interface ReportDefinition {
  id: string;
  tab: NavigationTab;
  title: string;
  description: string;
  keywords: string[];
}

const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'rep-stock',
    tab: 'report-cold-storage-in',
    title: 'STOCK IN',
    description: 'Inbound receipts, KBL challans, verification & cold storage allotments',
    keywords: ['stock in', 'stock', 'inbound', 'receipt', 'gate', 'challan', 'sr', 'bag', 'mt', 'seed', 'potato'],
  },
  {
    id: 'rep-delivery',
    tab: 'report-delivery',
    title: 'STOCK OUT',
    description: 'Outbound dispatches, consignees, client receivers, gate passes & transport orders',
    keywords: ['stock out', 'delivery report', 'delivery', 'dispatch', 'client', 'customer', 'receiver', 'gate pass', 'outbound', 'truck'],
  },
  {
    id: 'rep-closing',
    tab: 'report-closing-stock',
    title: 'STOCK REGISTER',
    description: 'Audited double-entry lot ledger, inward/outward reconciliation & closing stock balance',
    keywords: ['stock register', 'closing', 'closing stock', 'balance', 'remaining', 'inventory', 'ending', 'ledger'],
  },
];

type SearchCategory = 'all' | 'stock' | 'delivery' | 'reports';

interface UnifiedSearchResult {
  id: string;
  type: 'stock' | 'delivery' | 'report';
  primaryTitle: string;
  secondaryTitle: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  date?: string;
  onSelect: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    currentUser,
    companySettings,
    users,
    switchUser,
    hasPermission,
    notifications,
    markNotificationRead,
    clearNotifications,
    setIsStockModalOpen,
    setIsDeliveryModalOpen,
    setIsRentModalOpen,
    setIsImportModalOpen,
    setIsProfileModalOpen,
    resetAllData,
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    varieties,
    setActiveTab,
    setFilters,
    addToast,
    recycledItems,
    setIsRecycleModalOpen,
    setIsShortcutsModalOpen,
    isThemeModalOpen,
    setIsThemeModalOpen,
  } = useApp();

  const { isDark } = useTheme();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuContainerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Click outside to close search dropdown and user menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuContainerRef.current && !userMenuContainerRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When notifications dropdown is open, clicking ANYWHERE in the entire application dismisses it immediately
  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handleAnywhereClick = (e: MouseEvent) => {
      // If clicking inside the bell button itself, let the button's onClick handle toggle
      if (notificationButtonRef.current && notificationButtonRef.current.contains(e.target as Node)) {
        return;
      }
      // Any other click anywhere in the app closes notifications
      setIsNotificationsOpen(false);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };

    // Timeout ensures the click that opened the notification doesn't immediately close it
    const timer = setTimeout(() => {
      window.addEventListener('click', handleAnywhereClick, true);
      window.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleAnywhereClick, true);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isNotificationsOpen]);

  // Global Keyboard Shortcut: '/' or 'Cmd+K' / 'Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute Search Results across Stock Entries, Delivery Records, and Reports
  const searchResults = useMemo<UnifiedSearchResult[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: UnifiedSearchResult[] = [];

    // 1. Match Stock Entries
    stockTransactions.forEach((s) => {
      const variety = varieties.find((v) => v.id === s.varietyId)?.name || '';
      const storage = coldStorages.find((c) => c.id === s.coldStorageId)?.name || '';
      const challanMatch = s.kblChallanNo?.toLowerCase().includes(q);
      const srMatch = s.srNo?.toLowerCase().includes(q);
      const trxMatch = s.transactionNo?.toLowerCase().includes(q);
      const entryMatch = s.entryNo?.toLowerCase().includes(q);
      const remarksMatch = s.remarks?.toLowerCase().includes(q);
      const varietyMatch = variety.toLowerCase().includes(q);
      const storageMatch = storage.toLowerCase().includes(q);

      if (
        challanMatch ||
        srMatch ||
        trxMatch ||
        entryMatch ||
        remarksMatch ||
        varietyMatch ||
        storageMatch
      ) {
        results.push({
          id: `stock-${s.id}`,
          type: 'stock',
          primaryTitle: s.kblChallanNo,
          secondaryTitle: `SR: ${s.srNo}`,
          subtitle: `${s.sackQuantity.toLocaleString()} Bags (${s.totalMt} MT) • ${variety || 'Potato Seed'} • ${storage || 'Chamber'}`,
          badge: 'Stock Entry',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          date: s.date,
          onSelect: () => {
            setFilters((prev) => ({ ...prev, searchQuery: s.kblChallanNo }));
            setActiveTab('stock-register');
            setIsSearchOpen(false);
            setSearchQuery('');
            if (addToast) {
              addToast(`Loaded Stock Entry: ${s.kblChallanNo} (SR: ${s.srNo})`, 'info');
            }
          },
        });
      }
    });

    // 2. Match Delivery Records (Search by ID or Client Name)
    deliveryTransactions.forEach((d) => {
      const variety = varieties.find((v) => v.id === d.varietyId)?.name || '';
      const storage = coldStorages.find((c) => c.id === d.coldStorageId)?.name || '';
      const deliveryNoMatch = d.deliveryNo?.toLowerCase().includes(q);
      const clientMatch = d.customerReceiver?.toLowerCase().includes(q);
      const refMatch = d.deliveryReference?.toLowerCase().includes(q);
      const vehicleMatch = d.vehicleNo?.toLowerCase().includes(q);
      const driverMatch = d.driverName?.toLowerCase().includes(q);
      const remarksMatch = d.remarks?.toLowerCase().includes(q);
      const varietyMatch = variety.toLowerCase().includes(q);
      const storageMatch = storage.toLowerCase().includes(q);

      if (
        deliveryNoMatch ||
        clientMatch ||
        refMatch ||
        vehicleMatch ||
        driverMatch ||
        remarksMatch ||
        varietyMatch ||
        storageMatch
      ) {
        results.push({
          id: `delivery-${d.id}`,
          type: 'delivery',
          primaryTitle: d.deliveryNo,
          secondaryTitle: `Client: ${d.customerReceiver}`,
          subtitle: `${d.sackQuantity.toLocaleString()} Bags (${d.totalMt} MT) • ${variety || 'Seed'} • ${storage || 'Storage'}`,
          badge: 'Delivery Record',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          date: d.date,
          onSelect: () => {
            setFilters((prev) => ({ ...prev, searchQuery: d.deliveryNo }));
            setActiveTab('delivery-register');
            setIsSearchOpen(false);
            setSearchQuery('');
            if (addToast) {
              addToast(`Loaded Delivery Record: ${d.deliveryNo} (${d.customerReceiver})`, 'info');
            }
          },
        });
      }
    });

    // 3. Match Reports by ID, Title, Description, or Keywords
    REPORT_DEFINITIONS.forEach((rep) => {
      const titleMatch = rep.title.toLowerCase().includes(q);
      const descMatch = rep.description.toLowerCase().includes(q);
      const tabMatch = rep.tab.toLowerCase().includes(q);
      const keywordMatch = rep.keywords.some((k) => k.includes(q));

      if (titleMatch || descMatch || tabMatch || keywordMatch) {
        results.push({
          id: `rep-${rep.id}`,
          type: 'report',
          primaryTitle: rep.title,
          secondaryTitle: 'Report',
          subtitle: rep.description,
          badge: 'Report',
          badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
          onSelect: () => {
            setActiveTab(rep.tab);
            setIsSearchOpen(false);
            setSearchQuery('');
            if (addToast) {
              addToast(`Navigated to ${rep.title}`, 'info');
            }
          },
        });
      }
    });

    return results;
  }, [searchQuery, stockTransactions, deliveryTransactions, coldStorages, varieties, setActiveTab, setFilters, addToast]);

  // Filtered by Category
  const filteredResults = useMemo(() => {
    if (activeCategory === 'all') return searchResults;
    if (activeCategory === 'stock') return searchResults.filter((r) => r.type === 'stock');
    if (activeCategory === 'delivery') return searchResults.filter((r) => r.type === 'delivery');
    if (activeCategory === 'reports') return searchResults.filter((r) => r.type === 'report');
    return searchResults;
  }, [searchResults, activeCategory]);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredResults.length, activeCategory]);

  // Handle keyboard navigation within search results
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[highlightedIndex]) {
        filteredResults[highlightedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const countStock = searchResults.filter((r) => r.type === 'stock').length;
  const countDelivery = searchResults.filter((r) => r.type === 'delivery').length;
  const countReports = searchResults.filter((r) => r.type === 'report').length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between min-h-14 h-14 sm:h-15 px-2 sm:px-4 md:px-6 bg-slate-900 text-slate-100 dark:bg-slate-950 border-b border-slate-800/90 shadow-sm no-print pt-[env(safe-area-inset-top)]">
      {/* Left side: Hamburger + Brand logo/name link to Dashboard + Global Search */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-4 flex-1 min-w-0 max-w-2xl">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-sky-500 shrink-0 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {companySettings?.logoUrl ? (
          <div className="flex items-center gap-2 shrink-0 max-h-9">
            <img
              src={companySettings.logoUrl}
              alt={companySettings.companyName || 'Logo'}
              className="h-7 sm:h-8 max-w-[120px] sm:max-w-[160px] object-contain rounded drop-shadow-xs"
            />
          </div>
        ) : null}

        {/* Global Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 min-w-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-300 absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full min-w-0 pl-8 sm:pl-9 pr-10 sm:pr-14 py-1.5 sm:py-2 text-xs rounded-xl border border-slate-600 bg-slate-700/70 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-slate-700 transition-all shadow-xs"
              aria-label="Global search"
            />

            {/* Clear button or Keyboard Shortcut badge */}
            <div className="absolute right-2.5 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-600"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 bg-slate-600/90 rounded border border-slate-500">
                  <span className="text-[11px]">⌘</span>K
                </kbd>
              )}
            </div>
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[min(28rem,70vh)] overflow-y-auto">
              {searchQuery.trim() ? (
                <>
                  {/* Category Filter Pills Bar */}
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50/90 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 text-[11px] overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setActiveCategory('all')}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        activeCategory === 'all'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-750'
                      }`}
                    >
                      All ({searchResults.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategory('stock')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        activeCategory === 'stock'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-750'
                      }`}
                    >
                      <Package className="w-3 h-3" />
                      Stock ({countStock})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategory('delivery')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        activeCategory === 'delivery'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-750'
                      }`}
                    >
                      <Truck className="w-3 h-3" />
                      Delivery ({countDelivery})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategory('reports')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        activeCategory === 'reports'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-750'
                      }`}
                    >
                      <BarChart3 className="w-3 h-3" />
                      Reports ({countReports})
                    </button>
                  </div>

                  {/* Results List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredResults.length > 0 ? (
                      filteredResults.map((item, idx) => {
                        const isHighlighted = idx === highlightedIndex;
                        return (
                          <div
                            key={item.id}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onClick={item.onSelect}
                            className={`p-3 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                              isHighlighted
                                ? 'bg-sky-50/80 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {item.type === 'stock' && <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                {item.type === 'delivery' && <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                                {item.type === 'report' && <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {item.primaryTitle}
                                  </span>
                                  {item.secondaryTitle && (
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                      • {item.secondaryTitle}
                                    </span>
                                  )}
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${item.badgeClass}`}>
                                    {item.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.date && (
                                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
                                  {item.date}
                                </span>
                              )}
                              <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isHighlighted ? 'translate-x-0.5 text-sky-500' : 'text-slate-300 dark:text-slate-600'}`} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No matching records or reports found for <span className="font-semibold text-slate-700 dark:text-slate-200">"{searchQuery}"</span>
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          Try searching by Challan (e.g. KBL-2024), Client Name (e.g. Apex, Agro), or Report (e.g. Stock, Delivery, SR)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Keyboard instructions footer */}
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Use ↑↓ to navigate • ↵ to select • ESC to close</span>
                    <span>{filteredResults.length} result{filteredResults.length === 1 ? '' : 's'}</span>
                  </div>
                </>
              ) : (
                /* Quick Suggestions when input is focused but empty */
                <div className="p-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Navigation & Reports</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('stock-entry-records');
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">STOCK IN ALL RECORD</div>
                        <div className="text-[10px] text-slate-400">All inbound records & lot details</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('delivery-entry-records');
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">DELIVERY ALL RECORD</div>
                        <div className="text-[10px] text-slate-400">All outbound deliveries & dispatches</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('report-cold-storage-in');
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">STOCK IN</div>
                        <div className="text-[10px] text-slate-400">Verified inbound stock report</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('report-closing-stock');
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">STOCK REGISTER</div>
                        <div className="text-[10px] text-slate-400">Comprehensive closing balance register</div>
                      </div>
                    </button>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between px-2">
                    <span>💡 Tip: Type any Challan ID, SR No, Delivery No, or Client Name</span>
                    <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-slate-100 dark:bg-slate-800 rounded">ESC to dismiss</kbd>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Quick Action Buttons, Theme, Notifications, User Profile */}
      <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3 shrink-0">
        {/* Quick Action: Stock In */}
        {hasPermission('add_stock') && (
          <button
            onClick={() => setIsStockModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="uppercase">STOCK IN</span>
          </button>
        )}

        {/* Quick Action: Stock Out */}
        {hasPermission('add_delivery') && (
          <button
            onClick={() => setIsDeliveryModalOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-slate-700/80 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase">STOCK OUT</span>
          </button>
        )}

        {/* Recycle Bin Trigger */}
        <button
          onClick={() => setIsRecycleModalOpen(true)}
          title={`Recycle Bin (${recycledItems.length} items)`}
          className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
          aria-label="Recycle Bin"
        >
          <Trash2 className="w-4 h-4" />
          {recycledItems.length > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
              {recycledItems.length > 99 ? '99+' : recycledItems.length}
            </span>
          )}
        </button>

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Keyboard Shortcuts Trigger */}
        <button
          onClick={() => setIsShortcutsModalOpen(true)}
          title="Keyboard Shortcuts for Power Users (Shift + ?)"
          className="hidden sm:inline-flex p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Theme Selector Dropdown */}
        <ThemeDropdown onOpenThemeModal={() => setIsThemeModalOpen(true)} />

        {/* Notifications */}
        <div className="relative">
          <button
            ref={notificationButtonRef}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer"
            aria-label="Open notifications"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div
              ref={notificationsDropdownRef}
              className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.25rem))] sm:w-88 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-black bg-rose-500 text-white">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      clearNotifications();
                      setIsNotificationsOpen(false);
                    }}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setIsNotificationsOpen(false);
                      }}
                      className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        !n.read ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2">
                        <span>{n.title}</span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                        )}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px] leading-relaxed">
                        {n.message}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Switcher / Profile */}
        <div className="relative" ref={userMenuContainerRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-700/80 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden border border-slate-600">
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
              )}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-100 dark:text-slate-100 line-clamp-1">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] text-slate-300 dark:text-slate-400 font-medium">
                {currentUser.roleName}
              </div>
            </div>
          </button>

          {/* User Menu Dropdown with instant Switcher */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-[min(16rem,calc(100vw-1.25rem))] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {currentUser.fullName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentUser.email}
                </div>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-full">
                  {currentUser.roleName}
                </span>
              </div>

              {/* Instant Multi-User Role Switcher */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Role
                </div>
                <div className="space-y-1 mt-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div>{u.fullName}</div>
                        <div className="text-[10px] text-slate-400">{u.roleName}</div>
                      </div>
                      {u.id === currentUser.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="p-1">
                <button
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    resetAllData();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore 2024 Seed Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Theme Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </header>
  );
};
