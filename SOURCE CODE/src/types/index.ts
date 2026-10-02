// All TypeScript interfaces and types for Potato Stock & Cold Storage Management

export type UserRoleName =
  | 'Super Admin'
  | 'Administrator'
  | 'Manager'
  | 'Data Entry Operator'
  | 'Store Officer'
  | 'Accounts Officer'
  | 'Viewer';

export type UserRole =
  | UserRoleName
  | 'super_admin'
  | 'administrator'
  | 'manager'
  | 'data_entry_operator'
  | 'store_officer'
  | 'accounts_officer'
  | 'viewer'
  | string;

export type PermissionKey =
  | 'view_dashboard'
  | 'view_stock'
  | 'add_stock'
  | 'edit_stock'
  | 'delete_stock'
  | 'approve_stock'
  | 'view_delivery'
  | 'add_delivery'
  | 'edit_delivery'
  | 'delete_delivery'
  | 'approve_delivery'
  | 'view_cold_storage'
  | 'add_cold_storage'
  | 'edit_cold_storage'
  | 'delete_cold_storage'
  | 'manage_cold_storage'
  | 'view_reports'
  | 'export_excel'
  | 'export_pdf'
  | 'print_reports'
  | 'view_users'
  | 'add_users'
  | 'edit_users'
  | 'delete_users'
  | 'manage_users'
  | 'view_settings'
  | 'manage_settings'
  | 'view_audit_logs';

export interface Role {
  id: string;
  roleName: UserRoleName | string;
  description: string;
  status: 'active' | 'inactive';
  permissions: PermissionKey[];
  isCustom?: boolean;
}

export interface User {
  id: string;
  fullName: string;
  name?: string;
  email: string;
  phone?: string;
  department?: string;
  roleId?: string;
  roleName?: UserRoleName | string;
  status?: 'active' | 'inactive';
  profilePhoto?: string;
  createdAt: string;
  lastLogin?: string;
  username?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ColdStorage {
  id: string;
  code: string;
  name: string;
  location: string;
  capacity: number; // in bags
  contactPerson?: string;
  phone?: string;
  address?: string;
  rentPerBag: number; // in currency e.g. BDT
  status?: 'active' | 'inactive';
  remarks?: string;
  district?: string;
  contactPhone?: string;
  isActive?: boolean;
}

export interface MasterItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface Variety extends MasterItem {}
export interface SeedClass extends MasterItem {}
export interface Grade extends MasterItem {
  sizeSpec?: string;
}
export interface ProductionBlock extends MasterItem {
  district?: string;
  location?: string;
}

export interface StockTransaction {
  id: string;
  transactionNo: string;
  date: string; // YYYY-MM-DD
  kblChallanNo: string;
  challanNo?: string;
  srNo: string;
  sackQuantity: number;
  entryNo?: string;
  kgPerBag: number;
  totalKg: number;
  totalMt: number;
  coldStorageId: string;
  varietyId: string;
  classId: string;
  gradeId: string;
  productionBlockId: string;
  blockId?: string;
  farmBlock?: string;
  truckNo?: string;
  driverName?: string;
  growerFarmerName?: string;
  remarks?: string;
  status: 'approved' | 'pending' | 'rejected';
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DeliveryTransaction {
  id: string;
  deliveryNo: string;
  date: string; // YYYY-MM-DD
  coldStorageId: string;
  kblChallanNo?: string;
  srNo?: string;
  varietyId: string;
  classId: string;
  gradeId: string;
  productionBlockId: string;
  sackQuantity: number;
  kgPerBag: number;
  totalKg: number;
  totalMt: number;
  customerReceiver: string;
  clientReceiver?: string;
  deliveryReference: string;
  doNumber?: string;
  destination?: string;
  quantity?: number;
  vehicleNo?: string;
  driverName?: string;
  remarks?: string;
  status: 'approved' | 'pending' | 'cancelled' | 'completed';
  isPrinted?: boolean;
  printedAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface RentPayment {
  id: string;
  coldStorageId: string;
  date: string;
  paymentRef: string;
  amountPaid: number;
  paymentMode: 'Bank Transfer' | 'Cheque' | 'Cash' | 'Online';
  remarks?: string;
  createdBy: string;
  createdAt: string;
  amount?: number;
  referenceNo?: string;
  bankName?: string;
  paymentMethod?: string;
  status?: string;
  voucherNo?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'IMPORT'
    | 'EXPORT'
    | 'APPROVE'
    | 'RENT_PAYMENT'
    | 'PASSWORD_CHANGE';
  module:
    | 'STOCK'
    | 'DELIVERY'
    | 'COLD_STORAGE'
    | 'RENT'
    | 'USER'
    | 'SETTINGS'
    | 'AUTH';
  entity?: string;
  entityId?: string;
  recordId?: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  read: boolean;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: number;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  companyTagline?: string;
  address: string;
  legalAddress?: string;
  phone: string;
  email: string;
  currency: string;
  currencySymbol?: string;
  dateFormat: string;
  fiscalYear: string;
  logoText: string;
  logoUrl?: string;
  // Financial & Banking Configuration
  defaultRentPerBag?: number;
  vatTinNo?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankBranch?: string;
  routingNo?: string;
}

export interface FilterState {
  startDate?: string;
  endDate?: string;
  coldStorageId?: string;
  varietyId?: string;
  classId?: string;
  gradeId?: string;
  productionBlockId?: string;
  challanNo?: string;
  srNo?: string;
  searchQuery?: string;
}

export interface RecycledItem {
  id: string;
  type: 'stock' | 'delivery' | 'cold_storage';
  title: string;
  subtitle: string;
  deletedAt: string;
  originalData: any;
}

export interface FeedbackDialog {
  isOpen: boolean;
  type?: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirmation?: boolean;
}

export type ThemeName =
  | 'corporate-light'
  | 'corporate-dark'
  | 'ocean-blue'
  | 'emerald-green'
  | 'royal-purple'
  | 'slate-gray'
  | 'modern-teal'
  | 'executive-navy'
  | 'warm-sand'
  | 'high-contrast';

export type ThemeMode = 'light' | 'dark' | 'system';

export type TableDensity = 'compact' | 'normal' | 'comfortable';

export type NavigationTab =
  | 'dashboard'
  | 'stock-entry'
  | 'stock-register'
  | 'stock-entry-records'
  | 'stock-balance'
  | 'delivery-register'
  | 'delivery-entry-records'
  | 'cold-storage'
  | 'reports-stock'
  | 'report-cold-storage-in'
  | 'reports-delivery'
  | 'report-delivery'
  | 'reports-in-out'
  | 'reports-closing'
  | 'report-closing-stock'
  | 'report-combined'
  | 'reports-storage'
  | 'reports-sr'
  | 'report-sr-status'
  | 'reports-challan'
  | 'report-challan-status'
  | 'reports-dimensions'
  | 'master-data'
  | 'users-roles'
  | 'audit-logs'
  | 'recycle-bin'
  | 'settings'
  | 'report-daywise-stock'
  | 'report-daywise-delivery'
  | 'report-daywise-in-out-stock'
  | 'report-daily-in-out-stock';
