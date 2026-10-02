import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Save,
  Download,
  RotateCcw,
  Building2,
  Image as ImageIcon,
  Trash2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Landmark,
  Receipt,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { PrintPreviewModal } from '../common/PrintPreviewModal';

export const SettingsView: React.FC = () => {
  const {
    companySettings,
    updateCompanySettings,
    exportDatabaseJson,
    resetToDemoData,
    addToast,
  } = useApp();

  const [companyName, setCompanyName] = useState(companySettings?.companyName || 'KISHAN BOTANIX LTD.');
  const [companyTagline, setCompanyTagline] = useState(
    companySettings?.companyTagline || companySettings?.tagline || 'INVENTORY MANAGEMENT APP'
  );
  const [address, setAddress] = useState(
    companySettings?.legalAddress || companySettings?.address || 'HOUSE-12, ROAD-04, BLOCK-F, BANANI, DHAKA-1213, BANGLADESH'
  );
  const [contactEmail, setContactEmail] = useState(companySettings?.email || 'INFO@KISANBOTANIX.COM');
  const [contactPhone, setContactPhone] = useState(companySettings?.phone || '+880 1711-234567');
  const [logoUrl, setLogoUrl] = useState(companySettings?.logoUrl || '');
  const [currency, setCurrency] = useState(companySettings?.currency || 'BDT');
  const [currencySymbol, setCurrencySymbol] = useState(companySettings?.currencySymbol || '৳');
  const [fiscalYear, setFiscalYear] = useState(companySettings?.fiscalYear || '2024-2025');
  const [defaultRentPerBag, setDefaultRentPerBag] = useState<number | ''>(
    companySettings?.defaultRentPerBag !== undefined ? companySettings.defaultRentPerBag : 140
  );
  const [vatTinNo, setVatTinNo] = useState(companySettings?.vatTinNo || 'TIN-489102938471 / BIN-002918274-0101');
  const [bankName, setBankName] = useState(companySettings?.bankName || 'DUTCH-BANGLA BANK PLC');
  const [bankAccountNo, setBankAccountNo] = useState(companySettings?.bankAccountNo || '105.120.0098765');
  const [bankBranch, setBankBranch] = useState(companySettings?.bankBranch || 'BANANI BRANCH, DHAKA');
  const [routingNo, setRoutingNo] = useState(companySettings?.routingNo || '090271234');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (companySettings) {
      if (companySettings.companyName) setCompanyName(companySettings.companyName.toUpperCase());
      if (companySettings.companyTagline || companySettings.tagline) {
        setCompanyTagline((companySettings.companyTagline || companySettings.tagline || '').toUpperCase());
      }
      if (companySettings.legalAddress || companySettings.address) {
        setAddress((companySettings.legalAddress || companySettings.address || '').toUpperCase());
      }
      if (companySettings.email) setContactEmail(companySettings.email.toUpperCase());
      if (companySettings.phone) setContactPhone(companySettings.phone);
      if (companySettings.logoUrl !== undefined) setLogoUrl(companySettings.logoUrl);
      if (companySettings.currency) setCurrency(companySettings.currency.toUpperCase());
      if (companySettings.currencySymbol) setCurrencySymbol(companySettings.currencySymbol);
      if (companySettings.fiscalYear) setFiscalYear(companySettings.fiscalYear);
      if (companySettings.defaultRentPerBag !== undefined) setDefaultRentPerBag(companySettings.defaultRentPerBag);
      if (companySettings.vatTinNo) setVatTinNo(companySettings.vatTinNo.toUpperCase());
      if (companySettings.bankName) setBankName(companySettings.bankName.toUpperCase());
      if (companySettings.bankAccountNo) setBankAccountNo(companySettings.bankAccountNo);
      if (companySettings.bankBranch) setBankBranch(companySettings.bankBranch.toUpperCase());
      if (companySettings.routingNo) setRoutingNo(companySettings.routingNo);
    }
  }, [companySettings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please upload a valid image file (PNG, JPG, SVG, WebP)', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('Logo file size should be less than 2MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoUrl(result);
      updateCompanySettings({ logoUrl: result });
      addToast('Company logo uploaded and updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    updateCompanySettings({ logoUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addToast('Company logo removed successfully', 'info');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({
      companyName: companyName.toUpperCase(),
      tagline: companyTagline.toUpperCase(),
      companyTagline: companyTagline.toUpperCase(),
      address: address.toUpperCase(),
      legalAddress: address.toUpperCase(),
      email: contactEmail.toUpperCase(),
      phone: contactPhone,
      logoUrl,
      currency: currency.toUpperCase(),
      currencySymbol,
      fiscalYear,
      defaultRentPerBag: Number(defaultRentPerBag) || 0,
      vatTinNo: vatTinNo.toUpperCase(),
      bankName: bankName.toUpperCase(),
      bankAccountNo,
      bankBranch: bankBranch.toUpperCase(),
      routingNo,
    });
    addToast('Updated organization & financial settings successfully!', 'success');
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `potato_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported full database backup', 'success');
  };

  const handleExportExcel = () => {
    const exportData = [
      { property: 'COMPANY NAME', value: companyName },
      { property: 'TAGLINE / SUBTITLE', value: companyTagline },
      { property: 'OFFICE / LEGAL ADDRESS', value: address },
      { property: 'OFFICIAL EMAIL', value: contactEmail },
      { property: 'CONTACT PHONE', value: contactPhone },
      { property: 'CURRENCY', value: `${currency} (${currencySymbol})` },
      { property: 'FISCAL YEAR', value: fiscalYear },
      { property: 'DEFAULT RENT RATE / BAG', value: `${defaultRentPerBag} BDT` },
      { property: 'VAT / TIN REGISTRATION', value: vatTinNo },
      { property: 'BANK NAME', value: bankName },
      { property: 'BANK ACCOUNT NO', value: bankAccountNo },
      { property: 'BANK BRANCH', value: bankBranch },
      { property: 'ROUTING NO', value: routingNo },
      { property: 'LOGO STATUS', value: logoUrl ? 'ACTIVE' : 'DEFAULT' },
    ];
    const columns = [
      { header: 'SETTING PROPERTY', key: 'property', width: 25, align: 'left' },
      { header: 'CONFIGURED VALUE', key: 'value', width: 35, align: 'left' },
    ];
    exportToExcel(
      exportData,
      columns,
      `COMPANY_SETTINGS_${fiscalYear.replace(/[^a-zA-Z0-9]/g, '_')}`,
      'COMPANY PROFILE & FINANCIAL SETTINGS',
      companySettings,
      `Generated on ${new Date().toLocaleDateString('en-GB')}`
    );
    addToast('Settings exported to Excel!', 'success');
  };

  const handleExportPdf = () => {
    const exportData = [
      { property: 'COMPANY NAME', value: companyName },
      { property: 'TAGLINE / SUBTITLE', value: companyTagline },
      { property: 'OFFICE / LEGAL ADDRESS', value: address },
      { property: 'OFFICIAL EMAIL', value: contactEmail },
      { property: 'CONTACT PHONE', value: contactPhone },
      { property: 'CURRENCY', value: `${currency} (${currencySymbol})` },
      { property: 'FISCAL YEAR', value: fiscalYear },
      { property: 'DEFAULT RENT RATE / BAG', value: `${defaultRentPerBag} BDT` },
      { property: 'VAT / TIN REGISTRATION', value: vatTinNo },
      { property: 'BANK NAME', value: bankName },
      { property: 'BANK ACCOUNT NO', value: bankAccountNo },
      { property: 'BANK BRANCH', value: bankBranch },
      { property: 'ROUTING NO', value: routingNo },
      { property: 'LOGO STATUS', value: logoUrl ? 'ACTIVE' : 'DEFAULT' },
    ];
    const columns = [
      { header: 'SETTING PROPERTY', key: 'property', align: 'left' },
      { header: 'CONFIGURED VALUE', key: 'value', align: 'left' },
    ];
    exportToPdf(
      exportData,
      columns,
      `COMPANY_SETTINGS_${fiscalYear.replace(/[^a-zA-Z0-9]/g, '_')}`,
      'COMPANY PROFILE & FINANCIAL SETTINGS',
      companySettings,
      'p',
      `Organization & Financial Profile`
    );
    addToast('Settings exported as PDF!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* 1. Page Title Card strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            SETTINGS
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 uppercase font-mono">
            CONFIGURATION
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors shadow-xs cursor-pointer uppercase active:scale-95"
            title="Download full JSON database backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT BACKUP</span>
          </button>

          <ReportButtonGroup
            iconOnly={true}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onPrint={() => setIsPreviewOpen(true)}
          />
        </div>
      </div>

      {/* 2-Column Balanced Layout */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT COLUMN: Company Brand & Logo */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    COMPANY BRAND & LOGO
                  </h3>
                </div>
                {logoUrl ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 uppercase">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    DEFAULT ICON
                  </span>
                )}
              </div>

              {/* Logo Preview Area */}
              <div className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 min-h-[170px]">
                {logoUrl ? (
                  <div className="max-w-full max-h-36 p-2 bg-white dark:bg-slate-900 rounded-lg shadow-2xs border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt="Company Logo Preview"
                      className="max-h-28 max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-center space-y-1.5">
                    <ImageIcon className="w-10 h-10 stroke-[1.2]" />
                    <span className="text-xs font-semibold">No Custom Logo Uploaded</span>
                    <span className="text-[10px] text-slate-400">The application is currently using default brand typography</span>
                  </div>
                )}
              </div>

              {/* Upload & Remove Controls */}
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs cursor-pointer transition-colors uppercase active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{logoUrl ? 'CHANGE LOGO' : 'UPLOAD LOGO'}</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 shadow-2xs cursor-pointer transition-colors uppercase"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>REMOVE</span>
                    </button>
                  )}
                </div>

                {/* Explicit recommendation text as requested */}
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                    Recommended: Width: 200px - 400px, Height: 60px - 120px (Max 2MB, Format: PNG/SVG/JPEG)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Top Bar & Reports Display:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">SYNCHRONIZED</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Company Information & Legal Address */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                COMPANY INFORMATION & LEGAL DETAILS
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Company Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  COMPANY NAME *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  SYSTEM TAGLINE / SUBTITLE
                </label>
                <input
                  type="text"
                  value={companyTagline}
                  onChange={(e) => setCompanyTagline(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold uppercase"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    OFFICIAL EMAIL
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    CONTACT PHONE
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* Office & Legal Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  OFFICE & LEGAL ADDRESS *
                </label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium uppercase resize-none leading-relaxed"
                />
              </div>

              {/* Financial Data & Banking Information */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Coins className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    FINANCIAL DATA & RENTAL RATES
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      CURRENCY CODE & SYMBOL
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase text-center"
                        title="Currency code (e.g. BDT)"
                      />
                      <input
                        type="text"
                        value={currencySymbol}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-center"
                        title="Currency symbol (e.g. ৳)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      FISCAL YEAR
                    </label>
                    <input
                      type="text"
                      value={fiscalYear}
                      onChange={(e) => setFiscalYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      DEFAULT RENT / BAG (BDT)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={defaultRentPerBag}
                      onChange={(e) => setDefaultRentPerBag(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>

                {/* VAT / TIN Registration */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    TAX / VAT / TIN REGISTRATION NUMBER
                  </label>
                  <input
                    type="text"
                    value={vatTinNo}
                    onChange={(e) => setVatTinNo(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold uppercase"
                  />
                </div>

                {/* Bank Information Header */}
                <div className="pt-2 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Landmark className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    OFFICIAL BANKING ACCOUNT DETAILS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      BANK NAME
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      ACCOUNT NUMBER
                    </label>
                    <input
                      type="text"
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      BRANCH NAME
                    </label>
                    <input
                      type="text"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      ROUTING NUMBER
                    </label>
                    <input
                      type="text"
                      value={routingNo}
                      onChange={(e) => setRoutingNo(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Save & Reset */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer uppercase font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET TO DEMO DATA</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-xs cursor-pointer uppercase active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE SETTINGS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  RESET SYSTEM DATA
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to reset the entire database to factory demo dataset?
                </p>
                <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                  All active transactions, lots, and custom records will be overwritten.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDemoData();
                  setIsResetConfirmOpen(false);
                  addToast('Restored factory demo dataset successfully!', 'info');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>CONFIRM RESET</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="COMPANY PROFILE & SETTINGS"
        documentTitle="COMPANY PROFILE & SETTINGS"
        period={`Fiscal Year: ${fiscalYear}`}
        columns={[
          { header: 'SETTING PROPERTY', key: 'property', align: 'left' },
          { header: 'CONFIGURED VALUE', key: 'value', align: 'left' },
        ]}
        data={[
          { property: 'COMPANY NAME', value: companyName },
          { property: 'TAGLINE / SUBTITLE', value: companyTagline },
          { property: 'OFFICE / LEGAL ADDRESS', value: address },
          { property: 'OFFICIAL EMAIL', value: contactEmail },
          { property: 'CONTACT PHONE', value: contactPhone },
          { property: 'CURRENCY', value: `${currency} (${currencySymbol})` },
          { property: 'FISCAL YEAR', value: fiscalYear },
          { property: 'DEFAULT RENT RATE / BAG', value: `${defaultRentPerBag} BDT` },
          { property: 'VAT / TIN REGISTRATION', value: vatTinNo },
          { property: 'BANK NAME', value: bankName },
          { property: 'BANK ACCOUNT NO', value: bankAccountNo },
          { property: 'BANK BRANCH', value: bankBranch },
          { property: 'ROUTING NO', value: routingNo },
          { property: 'LOGO STATUS', value: logoUrl ? 'ACTIVE' : 'DEFAULT' },
        ]}
      />
    </div>
  );
};
