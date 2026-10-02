import React from 'react';
import {
  ChevronRight,
  Home,
  LayoutDashboard,
  PackagePlus,
  Truck,
  Warehouse,
  TrendingDown,
  Scale,
  BarChart3,
  Files,
  FileCheck,
  Sliders,
  Users,
  History,
  ShieldCheck,
  Building2,
  Trash2,
  CalendarDays,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';

interface BreadcrumbConfig {
  section: string;
  sectionIcon?: React.ComponentType<{ className?: string }>;
  pageName: string;
  badge?: string;
  description?: string;
}

const TAB_BREADCRUMB_MAP: Partial<Record<NavigationTab, BreadcrumbConfig>> = {
  dashboard: {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: LayoutDashboard,
    pageName: 'DASHBOARD & STOCK ANALYTICS',
    badge: 'LIVE',
    description: 'Real-time cold storage metrics, item-wise matrix & stock summary',
  },
  'stock-entry': {
    section: 'ADMIN & OPERATIONS',
    sectionIcon: PackagePlus,
    pageName: 'STOCK INWARD REGISTER',
    badge: 'ENTRY',
    description: 'Inbound potato seed sacks received and verified at cold storage',
  },
  'stock-register': {
    section: 'ADMIN & OPERATIONS',
    sectionIcon: PackagePlus,
    pageName: 'STOCK INWARD REGISTER',
    badge: 'RECEIPTS',
    description: 'Comprehensive lot receipts, challan records and inward tracking',
  },
  'stock-entry-records': {
    section: 'ADMIN & OPERATIONS',
    sectionIcon: PackagePlus,
    pageName: 'STOCK IN ALL RECORD',
    badge: 'ALL RECORD',
    description: 'Consolidated records of all received potato seed stocks',
  },
  'delivery-entry-records': {
    section: 'ADMIN & OPERATIONS',
    sectionIcon: Truck,
    pageName: 'DELIVERY ALL RECORD',
    badge: 'ALL RECORD',
    description: 'Outbound deliveries, client receipts and gate pass records',
  },
  'delivery-register': {
    section: 'ADMIN & OPERATIONS',
    sectionIcon: Truck,
    pageName: 'DELIVERY REGISTER',
    badge: 'DISPATCHES',
    description: 'All outbound dispatch transactions and DO status',
  },
  'stock-balance': {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: Scale,
    pageName: 'ALL-ITEM CLOSING STOCK',
    badge: 'BALANCE',
    description: 'Variety, class and grade-wise balance sacks and metric tons',
  },
  'report-cold-storage-in': {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: Warehouse,
    pageName: 'STOCK IN',
    badge: 'INWARD',
    description: 'Cold storage inbound transactions, vehicle numbers and farmer lots',
  },
  'report-delivery': {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: TrendingDown,
    pageName: 'STOCK OUT',
    badge: 'DISPATCHES',
    description: 'Detailed outbound deliveries by client, destination and date',
  },
  'report-daywise-stock': {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: CalendarDays,
    pageName: 'DAY-WISE STOCK IN REPORT',
    badge: 'DAY-WISE',
    description: 'Day-to-day incoming potato batches received across all cold storages',
  },
  'report-daywise-delivery': {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: TrendingDown,
    pageName: 'DAY-WISE DELIVERY REPORT',
    badge: 'OUTBOUND',
    description: 'Day-to-day client deliveries, stock out metrics and remaining stock percentages',
  },
  'report-daily-in-out-stock': {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: BarChart3,
    pageName: 'DAILY IN, OUT & STOCK REPORT',
    badge: 'DAILY',
    description: 'Day-to-day stock in, stock out and running closing inventory ledger',
  },
  'report-daywise-in-out-stock': {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: BarChart3,
    pageName: 'DAILY IN, OUT & STOCK REPORT',
    badge: 'DAILY',
    description: 'Day-to-day stock in, stock out and running closing inventory ledger',
  },
  'report-closing-stock': {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: Scale,
    pageName: 'STOCK REGISTER',
    badge: 'REGISTER',
    description: 'Audited closing inventory balances across all cold storages',
  },
  'report-combined': {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: BarChart3,
    pageName: 'MULTI-DIMENSIONAL MATRIX',
    badge: 'CONSOLIDATED',
    description: 'Cross-tabulated analysis by variety, seed class, grade and storage',
  },
  'report-challan-status': {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: Files,
    pageName: 'CHALLAN STATUS & RECONCILIATION',
    badge: 'CROSS-MATCH',
    description: 'Consignor challan reconciliation, gate audit and warehouse vouchers',
  },
  'report-sr-status': {
    section: 'OVERVIEW & REPORTS',
    sectionIcon: FileCheck,
    pageName: 'SR LOT REGISTER & TRACEABILITY',
    badge: 'LOTS',
    description: 'Serial receipt lot registry, farmer contracts and sizing specifications',
  },
  'cold-storage': {
    section: 'ADMIN & OPERATIONS',
    sectionIcon: Warehouse,
    pageName: 'COLD STORAGE FACILITIES',
    badge: 'INFRASTRUCTURE',
    description: 'Storage units, chamber capacities, occupancy rates and supervisors',
  },
  'master-data': {
    section: 'ADMIN & OPERATIONS',
    sectionIcon: Sliders,
    pageName: 'MASTER DATA CATALOG',
    badge: 'CONFIG',
    description: 'Certified potato varieties, seed classes, grades and production blocks',
  },
  'users-roles': {
    section: 'ADMIN & OPERATIONS',
    sectionIcon: Users,
    pageName: 'USERS & ACCESS CONTROL',
    badge: 'SECURITY',
    description: 'Operator accounts, role permissions and authentication settings',
  },
  'audit-logs': {
    section: 'ADMIN & OPERATIONS',
    sectionIcon: History,
    pageName: 'SYSTEM AUDIT TRAIL',
    badge: 'IMMUTABLE',
    description: 'Chronological activity history, security events and modification logs',
  },
  settings: {
    section: 'ADMIN & OPERATIONS',
    sectionIcon: ShieldCheck,
    pageName: 'SETTINGS & ORGANIZATION PROFILE',
    badge: 'SYSTEM',
    description: 'Company information, fiscal year defaults, backup and restore',
  },
  'recycle-bin': {
    section: 'ADMIN & OPERATIONS',
    sectionIcon: Trash2,
    pageName: 'RECYCLE BIN & VAULT',
    badge: 'VAULT',
    description: 'Deleted stock transactions and restored data recovery',
  },
  'reports-stock': {
    section: 'REPORTS',
    sectionIcon: Warehouse,
    pageName: 'STOCK INWARD REGISTER',
    description: 'Historical records of received seed batches',
  },
  'reports-delivery': {
    section: 'REPORTS',
    sectionIcon: Truck,
    pageName: 'STOCK OUT',
    description: 'Client dispatch analysis and deliveries',
  },
  'reports-in-out': {
    section: 'REPORTS',
    sectionIcon: BarChart3,
    pageName: 'IN/OUT MOVEMENT REGISTER',
    description: 'Complete double-entry stock movement register',
  },
  'reports-closing': {
    section: 'REPORTS',
    sectionIcon: Scale,
    pageName: 'CLOSING STOCK REGISTER',
    description: 'Audited inventory quantities remaining in storage',
  },
  'reports-dimensions': {
    section: 'REPORTS',
    sectionIcon: BarChart3,
    pageName: 'MULTI-DIMENSIONAL MATRIX',
    description: 'Variety and grade matrix representation',
  },
  'reports-challan': {
    section: 'REPORTS',
    sectionIcon: Files,
    pageName: 'CHALLAN RECONCILIATION',
    description: 'Consignor challan reconciliation audit',
  },
  'reports-sr': {
    section: 'REPORTS',
    sectionIcon: FileCheck,
    pageName: 'SR LOT REGISTER',
    description: 'Serial receipt lot register and farmer traceability',
  },
  'reports-storage': {
    section: 'REPORTS',
    sectionIcon: Warehouse,
    pageName: 'FACILITY CHAMBER STATUS',
    description: 'Storage chamber utilization and stock levels',
  },
};

export const Breadcrumbs: React.FC = () => {
  const { activeTab, setActiveTab, filters, coldStorages, companySettings } = useApp();

  const currentConfig: BreadcrumbConfig = TAB_BREADCRUMB_MAP[activeTab] || {
    section: 'WORKSPACE',
    pageName: 'APPLICATION OVERVIEW',
  };

  const SectionIcon = currentConfig.sectionIcon;

  // Selected cold storage name for contextual badge (in uppercase)
  const selectedStorage =
    filters.coldStorageId && filters.coldStorageId !== 'all'
      ? coldStorages.find((cs) => cs.id === filters.coldStorageId)?.name?.toUpperCase()
      : null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-2.5 sm:mb-3 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 shadow-xs flex flex-nowrap items-center justify-between gap-2 uppercase tracking-wider overflow-hidden"
    >
      {/* Breadcrumb Path: single row, truncating */}
      <ol className="flex flex-nowrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 min-w-0 flex-1 overflow-hidden">
        {/* Home / Root */}
        <li className="inline-flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="inline-flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer group uppercase tracking-wider"
            title="GO TO DASHBOARD HOME"
          >
            <Home className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors" />
            <span className="hidden sm:inline font-bold">HOME</span>
          </button>
        </li>

        {/* Separator */}
        <li aria-hidden="true" className="shrink-0 text-slate-300 dark:text-slate-700">
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
        </li>

        {/* Section Group */}
        <li className="inline-flex items-center gap-1 min-w-0 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {SectionIcon && <SectionIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
          <span className="truncate min-w-0" title={currentConfig.section.toUpperCase()}>
            {currentConfig.section.toUpperCase()}
          </span>
        </li>

        {/* Separator */}
        <li aria-hidden="true" className="shrink-0 text-slate-300 dark:text-slate-700">
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
        </li>

        {/* Active Page Leaf */}
        <li className="inline-flex items-center gap-1.5 min-w-0 font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          <span aria-current="page" className="truncate min-w-0" title={currentConfig.pageName.toUpperCase()}>
            {currentConfig.pageName.toUpperCase()}
          </span>
          {currentConfig.badge && (
            <span className="hidden sm:inline-block shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded tracking-widest bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
              {currentConfig.badge.toUpperCase()}
            </span>
          )}
        </li>
      </ol>

      {/* Right-Side Contextual Meta Badge */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 whitespace-nowrap">
        {selectedStorage ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">
            <Building2 className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span className="truncate max-w-[140px]">{selectedStorage}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            <Building2 className="w-3 h-3 opacity-60" />
            <span>ALL FACILITIES</span>
          </span>
        )}

        <span className="text-slate-300 dark:text-slate-700">•</span>

        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider tabular-nums font-sans">
          FY {(companySettings?.fiscalYear || '2024-2025').toUpperCase()}
        </span>
      </div>
    </nav>
  );
};
