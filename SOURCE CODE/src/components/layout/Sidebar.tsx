import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  PackagePlus,
  Truck,
  Warehouse,
  TrendingDown,
  Scale,
  CalendarDays,
  Sliders,
  Users,
  History,
  ShieldCheck,
  FileSpreadsheet,
  Sprout,
  X,
  Trash2,
  ChevronRight,
  Code2,
  Phone,
  ExternalLink,
  BarChart3,
  Award,
  MapPin,
  UserCheck,
  Key,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

interface NavGroup {
  id: 'overview-reports' | 'admin-operations';
  title: string;
  groupIcon: React.ComponentType<{ className?: string }>;
  theme: {
    header: string;
    iconBadge: string;
    headerIcon: string;
    container: string;
    itemIdle: string;
    itemActive: string;
    iconIdle: string;
    iconActive: string;
    badge: string;
    activeBadge: string;
    chevron: string;
  };
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    hasPermission,
    companySettings,
    setIsImportModalOpen,
    recycledItems,
    setIsRecycleModalOpen,
    masterDataSubTab,
    setMasterDataSubTab,
    usersRolesSubTab,
    setUsersRolesSubTab,
  } = useApp();

  const overviewItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      icon: LayoutDashboard,
    },
    {
      id: 'report-cold-storage-in',
      label: 'STOCK IN',
      icon: Warehouse,
      permission: 'view_reports',
    },
    {
      id: 'report-delivery',
      label: 'STOCK OUT',
      icon: TrendingDown,
      permission: 'view_reports',
    },
    {
      id: 'report-closing-stock',
      label: 'STOCK REGISTER',
      icon: Scale,
      permission: 'view_reports',
    },
    {
      id: 'report-daywise-stock',
      label: 'DAY-WISE STOCK IN REPORT',
      icon: CalendarDays,
      permission: 'view_reports',
    },
    {
      id: 'report-daywise-delivery',
      label: 'DAY-WISE DELIVERY REPORT',
      icon: TrendingDown,
      permission: 'view_reports',
    },
    {
      id: 'report-daily-in-out-stock',
      label: 'DAILY IN, OUT & STOCK REPORT',
      icon: BarChart3,
      permission: 'view_reports',
    },
  ];

  const adminItems: NavItem[] = [
    {
      id: 'stock-entry-records',
      label: 'STOCK IN ALL RECORD',
      icon: PackagePlus,
      permission: 'view_stock',
    },
    {
      id: 'delivery-entry-records',
      label: 'DELIVERY ALL RECORD',
      icon: Truck,
      permission: 'view_delivery',
    },
    {
      id: 'cold-storage',
      label: 'COLD STORAGES',
      icon: Warehouse,
      permission: 'view_cold_storage',
    },
    {
      id: 'master-data',
      label: 'MASTER DATA',
      icon: Sliders,
      permission: 'view_settings',
    },
    {
      id: 'users-roles',
      label: 'USERS & ROLES',
      icon: Users,
      permission: 'view_users',
    },
    {
      id: 'audit-logs',
      label: 'AUDIT LOGS',
      icon: History,
      permission: 'view_audit_logs',
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      icon: ShieldCheck,
      permission: 'manage_settings',
    },
  ];

  const isAdminTab = [
    'stock-entry-records',
    'stock-register',
    'stock-entry',
    'delivery-entry-records',
    'delivery-register',
    'cold-storage',
    'master-data',
    'users-roles',
    'audit-logs',
    'settings',
  ].includes(activeTab);

  // Accordion state: by default ALL menus are collapsed (openGroup = null).
  // Clicking OVERVIEW opens OVERVIEW and collapses ADMIN. Clicking ADMIN opens ADMIN and collapses OVERVIEW. Clicking an open menu collapses it.
  const [openGroup, setOpenGroup] = React.useState<'overview-reports' | 'admin-operations' | null>(null);

  const handleToggleGroup = (groupId: 'overview-reports' | 'admin-operations') => {
    setOpenGroup((prev) => (prev === groupId ? null : groupId));
  };

  // Clicking a sub-menu button keeps ITS parent group open and collapses the other
  const handleSelectSubItem = (tab: NavigationTab, parentGroup: 'overview-reports' | 'admin-operations') => {
    setActiveTab(tab);
    setOpenGroup(parentGroup);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // Sub-menu container & prominent button themes with fixed eye-catching colors and dynamic hover color change
  const overviewTheme = {
    header: 'bg-gradient-to-r from-[#17253a] via-[#1d2d44] to-[#162234] hover:from-[#1d2f4a] hover:to-[#1b2b40] border-sky-500/50 hover:border-sky-400 text-sky-100 hover:text-white shadow-xs',
    iconBadge: 'bg-sky-500/25 border-sky-400/40 text-sky-300 group-hover:bg-sky-500/35',
    headerIcon: 'text-sky-300',
    container: 'bg-[#eef6ff] p-1.5 rounded-xl border-2 border-sky-400/90 shadow-md space-y-1',
    itemIdle: 'bg-sky-100 hover:bg-sky-600 text-sky-950 hover:text-white border-2 border-sky-300 hover:border-sky-600 font-extrabold shadow-2xs transition-all duration-150',
    itemActive: 'bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 text-white font-black border-2 border-sky-500 shadow-sm ring-2 ring-sky-400/50',
    iconIdle: 'text-sky-700 group-hover:text-white transition-colors',
    iconActive: 'text-white drop-shadow-xs',
    badge: 'bg-sky-200 text-sky-950 border border-sky-400 font-bold group-hover:bg-white group-hover:text-sky-900 transition-colors',
    activeBadge: 'bg-white/20 text-white border border-white/40 font-bold',
    chevron: 'text-white',
  };

  const adminTheme = {
    header: 'bg-gradient-to-r from-[#132c25] via-[#18362e] to-[#122721] hover:from-[#17372e] hover:to-[#173129] border-emerald-500/50 hover:border-emerald-400 text-emerald-100 hover:text-white shadow-xs',
    iconBadge: 'bg-emerald-500/25 border-emerald-400/40 text-emerald-300 group-hover:bg-emerald-500/35',
    headerIcon: 'text-emerald-300',
    container: 'bg-[#eefbf4] p-1.5 rounded-xl border-2 border-emerald-400/90 shadow-md space-y-1',
    itemIdle: 'bg-emerald-100 hover:bg-emerald-600 text-emerald-950 hover:text-white border-2 border-emerald-300 hover:border-emerald-600 font-extrabold shadow-2xs transition-all duration-150',
    itemActive: 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white font-black border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-400/50',
    iconIdle: 'text-emerald-700 group-hover:text-white transition-colors',
    iconActive: 'text-white drop-shadow-xs',
    badge: 'bg-emerald-200 text-emerald-950 border border-emerald-400 font-bold group-hover:bg-white group-hover:text-emerald-900 transition-colors',
    activeBadge: 'bg-white/20 text-white border border-white/40 font-bold',
    chevron: 'text-white',
  };

  const isTabActive = (itemId: NavigationTab) => {
    if (activeTab === itemId) return true;
    if (itemId === 'dashboard' && activeTab === 'dashboard') return true;
    if (itemId === 'stock-entry-records' && (activeTab === 'stock-entry-records' || activeTab === 'stock-register' || activeTab === 'stock-entry')) return true;
    if (itemId === 'delivery-entry-records' && (activeTab === 'delivery-entry-records' || activeTab === 'delivery-register')) return true;
    if (itemId === 'report-cold-storage-in' && (activeTab === 'report-cold-storage-in' || activeTab === 'reports-stock')) return true;
    if (itemId === 'report-delivery' && (activeTab === 'report-delivery' || activeTab === 'reports-delivery')) return true;
    if (itemId === 'report-daily-in-out-stock' && (activeTab === 'report-daily-in-out-stock' || activeTab === 'report-daywise-in-out-stock')) return true;
    if (itemId === 'report-closing-stock' && (activeTab === 'report-closing-stock' || activeTab === 'reports-closing' || activeTab === 'reports-in-out' || activeTab === 'reports-dimensions' || activeTab === 'report-combined' || activeTab === 'reports-storage' || activeTab === 'reports-sr' || activeTab === 'report-sr-status' || activeTab === 'reports-challan' || activeTab === 'report-challan-status')) return true;
    if (itemId === 'report-daywise-stock' && activeTab === 'report-daywise-stock') return true;
    if (itemId === 'report-daywise-delivery' && activeTab === 'report-daywise-delivery') return true;
    return false;
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Ash-toned Sidebar with w-56 compact width */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[min(16rem,calc(100vw-2.5rem))] sm:w-56 bg-[#222834] text-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-700/70 shadow-2xl lg:shadow-none no-print pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`}
      >
        {/* Company Branding */}
        <div className="flex items-center justify-between h-15 px-3 border-b border-slate-700/70 bg-[#1a202c]/95 shrink-0">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity group cursor-pointer focus:outline-none min-w-0 flex-1"
            title="Go to Dashboard"
          >
            {companySettings.logoUrl ? (
              <img
                src={companySettings.logoUrl}
                alt={companySettings.companyName}
                className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5 border border-white/20 shadow-md group-hover:scale-105 transition-transform shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-white/20 shrink-0">
                <Sprout className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-[11px] font-black tracking-tight text-white leading-tight truncate group-hover:text-sky-300 transition-colors uppercase">
                {companySettings.companyName || companySettings.logoText || 'KISHAN BOTANIX LTD.'}
              </h1>
              <p className="text-[8.5px] text-sky-400 font-bold tracking-wider uppercase truncate mt-0.5">
                {companySettings.companyTagline || companySettings.tagline || 'INVENTORY MANAGEMENT APP'}
              </p>
            </div>
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 lg:hidden cursor-pointer shrink-0 ml-1"
            title="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation scrollable area - Strictly maintaining 4 main menus with dividers above and below and requested sequence */}
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-3 space-y-2">
          
          {/* ========================================================
              DIVIDER ABOVE MENU 1
              ======================================================== */}
          <div className="border-t border-slate-700/80 my-1" />

          {/* ========================================================
              MAIN MENU 1: OVERVIEW & REPORTS (Sky Blue Theme)
              ======================================================== */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleToggleGroup('overview-reports')}
              className={`w-full flex items-center justify-between px-2 py-2 min-h-[42px] rounded-xl border select-none transition-all duration-200 cursor-pointer ${overviewTheme.header} group active:scale-[0.99]`}
              title="Toggle OVERVIEW & REPORTS menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs transition-all group-hover:scale-105 ${overviewTheme.iconBadge}`}>
                  <BarChart3 className={`w-3.5 h-3.5 ${overviewTheme.headerIcon}`} />
                </div>
                <span className="font-nav-main text-[9.5px] font-extrabold tracking-tight uppercase whitespace-nowrap text-slate-100 group-hover:text-white drop-shadow-xs">
                  OVERVIEW & REPORTS
                </span>
              </div>

              <div className="flex items-center shrink-0 ml-1">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  openGroup === 'overview-reports'
                    ? 'bg-white/15 border-white/25 text-white'
                    : 'bg-black/20 border-white/10 text-slate-400 group-hover:text-slate-200'
                }`}>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-200 stroke-[3] ${
                      openGroup === 'overview-reports' ? 'rotate-90 text-white' : ''
                    }`}
                  />
                </div>
              </div>
            </button>

            {/* Sub-menu Container for OVERVIEW & REPORTS: Lighter background ("ARO LIGHT/HALKA COLOR") */}
            {openGroup === 'overview-reports' && (
              <div className={`${overviewTheme.container} transition-all duration-200 mt-1`}>
                {overviewItems
                  .filter((item) => !item.permission || hasPermission(item.permission as any))
                  .map((item) => {
                    const Icon = item.icon;
                    const active = isTabActive(item.id);

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSubItem(item.id, 'overview-reports')}
                        className={`w-full group flex items-center justify-between px-2.5 py-1.5 min-h-[30px] rounded-lg transition-all duration-150 cursor-pointer ${
                          active ? overviewTheme.itemActive : overviewTheme.itemIdle
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                              active ? overviewTheme.iconActive : overviewTheme.iconIdle
                            }`}
                          />
                          <span className="truncate uppercase text-[9px] font-extrabold tracking-tight text-left text-inherit">
                            {item.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {item.badge && (
                            <span
                              className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full transition-colors ${
                                active ? overviewTheme.activeBadge : overviewTheme.badge
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {active && (
                            <ChevronRight className={`w-2.5 h-2.5 stroke-[2.5] ${overviewTheme.chevron}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ========================================================
              DIVIDER BELOW MENU 1 / ABOVE MENU 2
              ======================================================== */}
          <div className="border-t border-slate-700/80 my-1" />

          {/* ========================================================
              MAIN MENU 2: ADMIN & OPERATIONS (Emerald Green Theme)
              ======================================================== */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleToggleGroup('admin-operations')}
              className={`w-full flex items-center justify-between px-2 py-2 min-h-[42px] rounded-xl border select-none transition-all duration-200 cursor-pointer ${adminTheme.header} group active:scale-[0.99]`}
              title="Toggle ADMIN & OPERATIONS menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs transition-all group-hover:scale-105 ${adminTheme.iconBadge}`}>
                  <Sliders className={`w-3.5 h-3.5 ${adminTheme.headerIcon}`} />
                </div>
                <span className="font-nav-main text-[9.5px] font-extrabold tracking-tight uppercase whitespace-nowrap text-slate-100 group-hover:text-white drop-shadow-xs">
                  ADMIN & OPERATIONS
                </span>
              </div>

              <div className="flex items-center shrink-0 ml-1">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  openGroup === 'admin-operations'
                    ? 'bg-white/15 border-white/25 text-white'
                    : 'bg-black/20 border-white/10 text-slate-400 group-hover:text-slate-200'
                }`}>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-200 stroke-[3] ${
                      openGroup === 'admin-operations' ? 'rotate-90 text-white' : ''
                    }`}
                  />
                </div>
              </div>
            </button>

            {/* Sub-menu Container for ADMIN & OPERATIONS: Lighter background ("ARO LIGHT/HALKA COLOR") */}
            {openGroup === 'admin-operations' && (
              <div className={`${adminTheme.container} transition-all duration-200 mt-1`}>
                {adminItems
                  .filter((item) => !item.permission || hasPermission(item.permission as any))
                  .map((item) => {
                    const Icon = item.icon;
                    const active = isTabActive(item.id);

                    return (
                      <div key={item.id} className="space-y-0.5">
                        <button
                          onClick={() => handleSelectSubItem(item.id, 'admin-operations')}
                          className={`w-full group flex items-center justify-between px-2.5 py-1.5 min-h-[30px] rounded-lg transition-all duration-150 cursor-pointer ${
                            active ? adminTheme.itemActive : adminTheme.itemIdle
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                                active ? adminTheme.iconActive : adminTheme.iconIdle
                              }`}
                            />
                            <span className="truncate uppercase text-[9px] font-extrabold tracking-tight text-left text-inherit">
                              {item.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {item.badge && (
                              <span
                                className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full transition-colors ${
                                  active ? adminTheme.activeBadge : adminTheme.badge
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            {active && (
                              <ChevronRight className={`w-2.5 h-2.5 stroke-[2.5] ${adminTheme.chevron}`} />
                            )}
                          </div>
                        </button>

                        {/* MASTER DATA SUBMENUS: Varieties, Classes, Grades, Blocks with attractive icons and borders */}
                        {item.id === 'master-data' && (
                          <div className="pl-2 pr-1 py-1.5 space-y-1 bg-emerald-950/20 dark:bg-emerald-950/40 rounded-xl my-1 border border-emerald-400/30 dark:border-emerald-700/50">
                            {[
                              { id: 'varieties', label: 'VARIETIES', icon: Sprout },
                              { id: 'classes', label: 'CLASSES', icon: Award },
                              { id: 'grades', label: 'GRADES', icon: Sliders },
                              { id: 'blocks', label: 'BLOCKS', icon: MapPin },
                            ].map((sub) => {
                              const isSubActive = activeTab === 'master-data' && masterDataSubTab === sub.id;
                              const SubIcon = sub.icon;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMasterDataSubTab(sub.id as any);
                                    handleSelectSubItem('master-data', 'admin-operations');
                                  }}
                                  className={`w-full group flex items-center justify-between px-2.5 py-1 text-[8.5px] rounded-lg transition-all cursor-pointer ${
                                    isSubActive
                                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white font-black border border-emerald-400 shadow-xs ring-1 ring-emerald-300/40'
                                      : 'bg-white/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/60 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 font-bold shadow-2xs'
                                  }`}
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                      isSubActive
                                        ? 'bg-white/25 border-white/40 text-white'
                                        : 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-emerald-500'
                                    }`}>
                                      <SubIcon className="w-2.5 h-2.5" />
                                    </div>
                                    <span className="tracking-tight uppercase">{sub.label}</span>
                                  </span>
                                  {isSubActive && <ChevronRight className="w-2.5 h-2.5 stroke-[2.5] text-white shrink-0 ml-1" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* USERS & ROLES SUBMENUS: System Users, Roles & Permissions with attractive icons and borders */}
                        {item.id === 'users-roles' && (
                          <div className="pl-2 pr-1 py-1.5 space-y-1 bg-emerald-950/20 dark:bg-emerald-950/40 rounded-xl my-1 border border-emerald-400/30 dark:border-emerald-700/50">
                            {[
                              { id: 'users', label: 'SYSTEM USERS', icon: UserCheck },
                              { id: 'roles', label: 'ROLES & PERMISSIONS', icon: ShieldCheck },
                            ].map((sub) => {
                              const isSubActive = activeTab === 'users-roles' && usersRolesSubTab === sub.id;
                              const SubIcon = sub.icon;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUsersRolesSubTab(sub.id as any);
                                    handleSelectSubItem('users-roles', 'admin-operations');
                                  }}
                                  className={`w-full group flex items-center justify-between px-2.5 py-1 text-[8.5px] rounded-lg transition-all cursor-pointer ${
                                    isSubActive
                                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white font-black border border-emerald-400 shadow-xs ring-1 ring-emerald-300/40'
                                      : 'bg-white/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/60 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 font-bold shadow-2xs'
                                  }`}
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                      isSubActive
                                        ? 'bg-white/25 border-white/40 text-white'
                                        : 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-emerald-500'
                                    }`}>
                                      <SubIcon className="w-2.5 h-2.5" />
                                    </div>
                                    <span className="tracking-tight uppercase">{sub.label}</span>
                                  </span>
                                  {isSubActive && <ChevronRight className="w-2.5 h-2.5 stroke-[2.5] text-white shrink-0 ml-1" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ========================================================
              DIVIDER BELOW MENU 2 / ABOVE MENU 3
              ======================================================== */}
          <div className="border-t border-slate-700/80 my-1" />

          {/* ========================================================
              MAIN MENU 3: IMPORT EXCEL (Indigo / Violet Theme)
              ======================================================== */}
          <div>
            <button
              onClick={() => {
                setIsImportModalOpen(true);
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center justify-between px-2 py-2 min-h-[42px] rounded-xl text-indigo-100 hover:text-white bg-gradient-to-r from-[#1e1b4b] via-[#2e1065] to-[#1e1b4b] hover:from-[#2e2a72] hover:to-[#3b1277] border border-indigo-500/50 hover:border-indigo-400 transition-all duration-200 shadow-xs cursor-pointer group active:scale-[0.99]"
              title="Import Data from Excel"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6.5 h-6.5 rounded-lg bg-indigo-500/25 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-indigo-500/35 transition-all">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-300" />
                </div>
                <span className="font-nav-main text-[9.5px] font-extrabold tracking-tight uppercase whitespace-nowrap text-indigo-100 group-hover:text-white drop-shadow-xs">
                  IMPORT EXCEL
                </span>
              </div>
              <span className="text-[7.5px] font-black font-mono uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/50 shrink-0 ml-1 shadow-2xs">
                XLSX
              </span>
            </button>
          </div>

          {/* ========================================================
              DIVIDER BELOW MENU 3 / ABOVE MENU 4
              ======================================================== */}
          <div className="border-t border-slate-700/80 my-1" />

          {/* ========================================================
              MAIN MENU 4: RECYCLE BIN (Crimson Rose Theme)
              ======================================================== */}
          <div>
            <button
              onClick={() => {
                setIsRecycleModalOpen(true);
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center justify-between px-2 py-2 min-h-[42px] rounded-xl text-rose-100 hover:text-white bg-gradient-to-r from-[#2c161d] via-[#351a23] to-[#241318] hover:from-[#3a1d27] hover:to-[#2c171e] border border-rose-600/50 hover:border-rose-400 transition-all duration-200 shadow-xs shadow-rose-950/30 cursor-pointer group active:scale-[0.99]"
              title="Open Recycle Bin"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6.5 h-6.5 rounded-lg bg-rose-500/25 border border-rose-400/40 text-rose-300 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-rose-500/35 transition-all">
                  <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                </div>
                <span className="font-nav-main text-[9.5px] font-extrabold tracking-tight uppercase whitespace-nowrap text-rose-100 group-hover:text-white drop-shadow-xs">
                  RECYCLE BIN
                </span>
              </div>
              {recycledItems.length > 0 && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/50 shrink-0 ml-1 shadow-2xs">
                  {recycledItems.length}
                </span>
              )}
            </button>
          </div>

          {/* ========================================================
              DIVIDER BELOW MENU 4
              ======================================================== */}
          <div className="border-t border-slate-700/80 my-1" />

        </div>

        {/* Sidebar Footer: Developer Branding */}
        <div className="p-2 border-t border-slate-700/70 bg-[#1a202c]/95 shrink-0">
          <a
            href="https://www.facebook.com/Tahamid.Faruk"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full relative group overflow-hidden rounded-lg p-[1.5px] focus:outline-none block transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-slate-900/50"
            title="Open Developer Profile (Tahamid Faruk)"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 via-purple-500 to-pink-500 rounded-lg group-hover:from-cyan-400 group-hover:via-indigo-400 group-hover:to-pink-500 transition-all duration-500" />
            <span className="relative flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] bg-[#1a202c] group-hover:bg-[#151a23] transition-colors">
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-sky-500 via-indigo-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:rotate-6 transition-transform">
                <Code2 className="w-3 h-3 text-white drop-shadow-xs" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-[9px] font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-200 to-pink-300 truncate uppercase">
                  DEVELOPED BY @ TAHAMID
                </div>
                <div className="text-[8px] font-bold text-slate-300 flex items-center gap-0.5 truncate mt-0.5">
                  <Phone className="w-2 h-2 text-emerald-400 shrink-0" />
                  <span className="tracking-tight text-emerald-300">019 77 87 87 18</span>
                </div>
              </div>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-sky-300 shrink-0 transition-colors" />
            </span>
          </a>
        </div>
      </aside>
    </>
  );
};
