import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AppFeedbackModal } from './components/common/AppFeedbackModal';
import { RecycleBinModal } from './components/common/RecycleBinModal';
import { ExcelImportModal } from './components/common/ExcelImportModal';
import { StockEntryModal } from './components/stock/StockEntryModal';
import { DeliveryModal } from './components/delivery/DeliveryModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { StockRegisterView } from './components/stock/StockRegisterView';
import { StockBalanceView } from './components/stock/StockBalanceView';
import { DeliveryRegisterView } from './components/delivery/DeliveryRegisterView';
import { ColdStorageListView } from './components/coldStorage/ColdStorageListView';
import { ReportsView } from './components/reports/ReportsView';
import { StockInAllRecordsView } from './components/reports/StockInAllRecordsView';
import { StockOutAllRecordsView } from './components/reports/StockOutAllRecordsView';
import { InOutStockAllRecordsView } from './components/reports/InOutStockAllRecordsView';
import { AllItemClosingStockView } from './components/reports/AllItemClosingStockView';
import { DimensionsMatrixReportView } from './components/reports/DimensionsMatrixReportView';
import { DayWiseStockReportView } from './components/reports/DayWiseStockReportView';
import { DayWiseDeliveryReportView } from './components/reports/DayWiseDeliveryReportView';
import { DailyInOutStockReportView } from './components/reports/DailyInOutStockReportView';
import { QuickActionsFab } from './components/common/QuickActionsFab';
import { ToastContainer } from './components/common/ToastContainer';
import { MasterDataView } from './components/admin/MasterDataView';
import { UsersRolesView } from './components/admin/UsersRolesView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { SettingsView } from './components/admin/SettingsView';
import { ProfileModal } from './components/common/ProfileModal';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { PrintConfirmationModal } from './components/common/PrintConfirmationModal';
import { Breadcrumbs } from './components/common/Breadcrumbs';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ArrowUp } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsStockModalOpen,
    isStockModalOpen,
    isDeliveryModalOpen,
    setIsDeliveryModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isRecycleModalOpen,
    setIsRecycleModalOpen,
    closeFeedbackDialog,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    addToast,
  } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPrintConfirmOpen, setIsPrintConfirmOpen] = useState(false);

  // Global Keyboard Shortcuts for Power Users
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isMod = isMac ? e.metaKey : e.ctrlKey;

      // 1. Shift + ? or F1: Open Keyboard Shortcuts Cheat Sheet
      if ((e.key === '?' && e.shiftKey && !isInput) || e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
        return;
      }

      // 2. Ctrl + N / Cmd + N: New Stock Entry (Stock In)
      if (isMod && (e.key === 'n' || e.key === 'N') && !e.shiftKey) {
        e.preventDefault();
        setIsStockModalOpen(true);
        addToast?.('Quick Shortcut: Opened New Stock Entry', 'info');
        return;
      }

      // 3. Ctrl + Shift + N or Alt + N or Ctrl + D: New Delivery / Stock Out
      if (
        (isMod && e.shiftKey && (e.key === 'n' || e.key === 'N')) ||
        (e.altKey && (e.key === 'n' || e.key === 'N')) ||
        (isMod && (e.key === 'd' || e.key === 'D'))
      ) {
        e.preventDefault();
        setIsDeliveryModalOpen(true);
        addToast?.('Quick Shortcut: Opened New Delivery Entry', 'info');
        return;
      }

      // 4. Ctrl + P / Cmd + P: Quick Printing - open confirmation dialog to avoid accidental printing
      if (isMod && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setIsPrintConfirmOpen(true);
        return;
      }

      // 5. Ctrl + I: Excel Import
      if (isMod && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        setIsImportModalOpen(true);
        return;
      }

      // 6. Ctrl + Shift + R: Recycle Bin
      if (isMod && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        setIsRecycleModalOpen(true);
        return;
      }

      // 7. Ctrl + B: Toggle Left Sidebar
      if (isMod && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }

      // 8. Alt + ArrowUp: Scroll to Top
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 9. Ctrl + Number: Tab Switcher (1 to 7)
      if (isMod && !e.shiftKey && !e.altKey && ['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        e.preventDefault();
        switch (e.key) {
          case '1':
            setActiveTab('dashboard');
            break;
          case '2':
            setActiveTab('stock-entry-records');
            break;
          case '3':
            setActiveTab('delivery-entry-records');
            break;
          case '4':
            setActiveTab('report-cold-storage-in');
            break;
          case '5':
            setActiveTab('report-closing-stock');
            break;
          case '6':
            setActiveTab('report-combined');
            break;
          case '7':
            setActiveTab('cold-storage');
            break;
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setIsStockModalOpen,
    setIsDeliveryModalOpen,
    setIsImportModalOpen,
    setIsRecycleModalOpen,
    setIsShortcutsModalOpen,
    setActiveTab,
    addToast,
  ]);

  // If user clicks on 'stock-entry' in sidebar, we can auto-open modal or render StockRegisterView with open modal
  React.useEffect(() => {
    if (activeTab === 'stock-entry') {
      setIsStockModalOpen(true);
    }
  }, [activeTab, setIsStockModalOpen]);

  const handleConfirmPrint = () => {
    setIsPrintConfirmOpen(false);
    // Allow confirmation dialog to completely close/unmount before launching print preview or window.print
    setTimeout(() => {
      const printBtn = document.querySelector(
        'button[title*="Print" i], button[aria-label*="Print" i]'
      ) as HTMLButtonElement | null;
      if (printBtn) {
        printBtn.click();
      } else {
        window.print();
      }
    }, 150);
  };

  const getTabDisplayName = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard & Live Stock Matrix';
      case 'stock-entry':
      case 'stock-register':
      case 'stock-entry-records':
        return 'Stock In All Record Register';
      case 'delivery-entry-records':
      case 'delivery-register':
        return 'Delivery All Record Register';
      case 'cold-storage':
        return 'Cold Storage Facility Summary';
      case 'reports-stock':
      case 'report-cold-storage-in':
        return 'Stock In Report';
      case 'reports-delivery':
      case 'report-delivery':
        return 'Stock Out Report';
      case 'reports-closing':
      case 'report-closing-stock':
        return 'Stock Register Report';
      case 'report-daywise-stock':
        return 'Day-Wise Stock In Report';
      case 'report-daywise-delivery':
        return 'Day-Wise Delivery Report';
      case 'report-daily-in-out-stock':
      case 'report-daywise-in-out-stock':
        return 'Daily In, Out & Stock Report';
      case 'reports-dimensions':
      case 'report-combined':
        return 'Dimensions Matrix Report';
      case 'master-data':
        return 'Master Data';
      case 'users-roles':
        return 'Users & Roles';
      case 'audit-logs':
        return 'Audit Logs';
      case 'settings':
        return 'Settings';
      default:
        return 'Stock Management Report';
    }
  };

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;

      case 'stock-entry':
      case 'stock-register':
      case 'stock-entry-records':
        return <StockRegisterView />;

      case 'stock-balance':
        return <StockBalanceView />;

      case 'delivery-register':
      case 'delivery-entry-records':
        return <DeliveryRegisterView />;

      case 'cold-storage':
        return <ColdStorageListView />;

      case 'reports-stock':
      case 'report-cold-storage-in':
        return <StockInAllRecordsView />;

      case 'reports-delivery':
      case 'report-delivery':
        return <StockOutAllRecordsView />;

      case 'reports-in-out':
        return <InOutStockAllRecordsView />;

      case 'reports-closing':
      case 'report-closing-stock':
        return <AllItemClosingStockView />;

      case 'report-daywise-stock':
        return <DayWiseStockReportView />;

      case 'report-daywise-delivery':
        return <DayWiseDeliveryReportView />;

      case 'report-daily-in-out-stock':
      case 'report-daywise-in-out-stock':
        return <DailyInOutStockReportView />;

      case 'reports-storage':
        return <ReportsView reportType="reports-storage" />;

      case 'reports-sr':
      case 'report-sr-status':
        return <ReportsView reportType="reports-sr" />;

      case 'reports-challan':
      case 'report-challan-status':
        return <ReportsView reportType="reports-challan" />;

      case 'reports-dimensions':
      case 'report-combined':
        return <DimensionsMatrixReportView />;

      case 'master-data':
        return <MasterDataView />;

      case 'users-roles':
        return <UsersRolesView />;

      case 'audit-logs':
        return <AuditLogsView />;

      case 'settings':
        return <SettingsView />;

      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-56 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        {/* Page View Container - Adjusted padding to eliminate excessive gap under header */}
        <main className="flex-1 px-2 py-2 sm:px-5 sm:py-3 lg:px-6 lg:py-3.5 max-w-7xl w-full mx-auto min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-8">
          {/* Breadcrumb Navigation Context */}
          <Breadcrumbs />

          <ErrorBoundary key={activeTab} onReset={() => window.location.reload()}>
            {renderCurrentView()}
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="py-3.5 px-4 sm:px-6 pb-[calc(0.875rem+env(safe-area-inset-bottom))] bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 no-print">
          <div className="max-w-7xl mx-auto flex flex-col items-center sm:relative sm:flex-row sm:items-center sm:justify-end gap-3 text-xs">
            <div className="flex items-center justify-center gap-2 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
              <span className="text-[9px] sm:text-[9.5px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                ALL RIGHTS RESERVED BY @
              </span>
              <a
                href="https://kisanbotanix.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black uppercase text-xs text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/30 tracking-widest"
                title="Visit Kisan Botanix Ltd."
                aria-label="Visit Kisan Botanix Ltd."
              >
                <span>🌱</span>
                <span>KBL</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              title="Scroll back to the top of the page"
            >
              <ArrowUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 group-hover:-translate-y-0.5 transition-transform" />
              <span>BACK TO TOP</span>
            </button>
          </div>
        </footer>
      </div>

      {/* Quick Access Speed Dial Floating Action Button */}
      <QuickActionsFab />

      {/* Floating Modern Toast Notification Container */}
      <ToastContainer />

      {/* Global Modals & System Dialogs */}
      <AppFeedbackModal
        onClose={closeFeedbackDialog}
      />
      <RecycleBinModal
        isOpen={isRecycleModalOpen}
        onClose={() => setIsRecycleModalOpen(false)}
      />
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
      <StockEntryModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />
      <DeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
      <PrintConfirmationModal
        isOpen={isPrintConfirmOpen}
        onClose={() => setIsPrintConfirmOpen(false)}
        onConfirm={handleConfirmPrint}
        currentPageName={getTabDisplayName(activeTab)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ThemeProvider>
  );
}
