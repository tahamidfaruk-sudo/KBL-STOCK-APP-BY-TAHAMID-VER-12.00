import React, { useState } from 'react';
import {
  Users,
  Search,
  RotateCcw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { matchesUniversalSearch } from '../../utils/searchUtils';
import { User, PermissionKey, UserRoleName, TableDensity, Role } from '../../types';
import { sortData } from '../../utils/sortUtils';
import { SortIcon } from '../common/SortIcon';
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { PrintPreviewModal } from '../common/PrintPreviewModal';

export const UsersRolesView: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    roles,
    addRole,
    deleteRole,
    updateRolePermissions,
    usersRolesSubTab,
    setUsersRolesSubTab,
    companySettings,
    addToast,
  } = useApp();

  const activeTab = usersRolesSubTab;
  const setActiveTab = setUsersRolesSubTab;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [density, setDensity] = useState<TableDensity>('compact');
  const [sortKey, setSortKey] = useState<string>('fullName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Custom Role Modal States
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<PermissionKey[]>([]);
  const [deletingCustomRole, setDeletingCustomRole] = useState<Role | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'Operations',
    roleName: 'Store Officer' as UserRoleName,
    status: 'active' as 'active' | 'inactive',
  });

  // Selected Role for Role Permissions tab
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || 'role-manager');

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRoleFilter('');
    setCurrentPage(1);
    addToast('User filters reset', 'info');
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const densityStyles = {
    compact: {
      row: 'h-8 sm:h-8.5',
      cell: 'py-1 text-[9.5px]',
      th: 'py-1 text-[9px]',
      badge: 'px-1 py-0.2 text-[8px]',
    },
    normal: {
      row: 'h-9 sm:h-9.5',
      cell: 'py-1.2 text-[10px]',
      th: 'py-1.5 text-[9.5px]',
      badge: 'px-1.2 py-0.2 text-[8.5px]',
    },
    comfortable: {
      row: 'h-10 sm:h-11',
      cell: 'py-1.5 text-[10.5px]',
      th: 'py-2 text-[10px]',
      badge: 'px-1.5 py-0.5 text-[9px]',
    },
  }[density];

  const cellPadding = densityStyles.cell;
  const thPadding = densityStyles.th;

  const filteredUsers = users.filter((u) => {
    const matchesSearch = matchesUniversalSearch(u, searchTerm, [
      u.fullName || u.name,
      u.email,
      u.phone,
      u.roleName || (u.role as string),
      u.department,
    ]);
    const matchesRole = selectedRoleFilter
      ? (u.roleName || (u.role as string)) === selectedRoleFilter
      : true;
    return matchesSearch && matchesRole;
  });

  const userTableRows = filteredUsers.map((u) => ({
    ...u,
    displayName: u.fullName || u.name || 'User',
    roleLabel: u.roleName || (u.role as string) || 'Operator',
    departmentLabel: u.department || '-',
    phoneLabel: u.phone || '-',
    statusLabel: (u.status || 'active').toUpperCase(),
    isCurrent: u.id === currentUser.id,
  }));

  const sortedUsers = sortData(userTableRows, sortKey, sortDir);
  const totalRecords = sortedUsers.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = pageSize === -1 ? 0 : (effectivePage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRecords : Math.min(startIndex + pageSize, totalRecords);
  const paginatedUsers = pageSize === -1 ? sortedUsers : sortedUsers.slice(startIndex, endIndex);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      department: 'Operations',
      roleName: 'Store Officer',
      status: 'active',
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || 'Operations',
      roleName: (user.roleName || user.role || 'Store Officer') as UserRoleName,
      status: (user.status || 'active') as 'active' | 'inactive',
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      addToast('Full name is required', 'warning');
      return;
    }
    if (!formData.email.trim()) {
      addToast('Email address is required', 'warning');
      return;
    }

    const matchedRole = roles.find((r) => r.roleName === formData.roleName);
    const roleId = matchedRole ? matchedRole.id : undefined;

    if (editingUser) {
      updateUser(editingUser.id, {
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        department: formData.department,
        roleName: formData.roleName,
        role: formData.roleName,
        roleId,
        status: formData.status,
      });
      addToast(`Updated user account "${formData.fullName}"!`, 'success');
    } else {
      addUser({
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        department: formData.department,
        roleName: formData.roleName,
        role: formData.roleName,
        roleId,
        status: formData.status,
      });
      addToast(`Created user account for "${formData.fullName}"!`, 'success');
    }

    setIsAddEditModalOpen(false);
    setEditingUser(null);
  };

  const confirmDelete = () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser.id) {
      addToast('Cannot delete currently logged-in account', 'error');
      setDeletingUser(null);
      return;
    }
    deleteUser(deletingUser.id);
    addToast(`User "${deletingUser.fullName || deletingUser.name}" removed`, 'info');
    setDeletingUser(null);
  };

  // Permissions list for Roles tab
  const ALL_SYSTEM_PERMISSIONS: { key: PermissionKey; label: string; group: string }[] = [
    { key: 'view_dashboard', label: 'View Dashboard & Analytics', group: 'Dashboard' },
    { key: 'view_stock', label: 'View Stock In Records', group: 'Stock Inward' },
    { key: 'add_stock', label: 'Create New Stock In Entries', group: 'Stock Inward' },
    { key: 'edit_stock', label: 'Edit Stock In Records', group: 'Stock Inward' },
    { key: 'delete_stock', label: 'Delete Stock In Records', group: 'Stock Inward' },
    { key: 'approve_stock', label: 'Approve Stock In Entries', group: 'Stock Inward' },
    { key: 'view_delivery', label: 'View Delivery Records', group: 'Delivery Dispatches' },
    { key: 'add_delivery', label: 'Create Delivery Dispatches', group: 'Delivery Dispatches' },
    { key: 'edit_delivery', label: 'Edit Delivery Records', group: 'Delivery Dispatches' },
    { key: 'delete_delivery', label: 'Delete Delivery Records', group: 'Delivery Dispatches' },
    { key: 'approve_delivery', label: 'Approve Delivery Orders', group: 'Delivery Dispatches' },
    { key: 'view_cold_storage', label: 'View Cold Storage Units', group: 'Cold Storage' },
    { key: 'add_cold_storage', label: 'Register New Facilities', group: 'Cold Storage' },
    { key: 'edit_cold_storage', label: 'Edit Facilities', group: 'Cold Storage' },
    { key: 'delete_cold_storage', label: 'Delete Facilities', group: 'Cold Storage' },
    { key: 'manage_cold_storage', label: 'Manage All Facilities', group: 'Cold Storage' },
    { key: 'view_reports', label: 'View Reports & Registers', group: 'Reports' },
    { key: 'export_excel', label: 'Export Data to Excel', group: 'Reports' },
    { key: 'export_pdf', label: 'Export Data to PDF', group: 'Reports' },
    { key: 'print_reports', label: 'Print Reports & Tables', group: 'Reports' },
    { key: 'view_users', label: 'View Users & Roles', group: 'Security & Admin' },
    { key: 'add_users', label: 'Create User Accounts', group: 'Security & Admin' },
    { key: 'edit_users', label: 'Edit User Accounts', group: 'Security & Admin' },
    { key: 'delete_users', label: 'Delete User Accounts', group: 'Security & Admin' },
    { key: 'manage_users', label: 'Manage Roles & Access', group: 'Security & Admin' },
    { key: 'view_settings', label: 'View Organization Profile', group: 'System Settings' },
    { key: 'manage_settings', label: 'Update System Settings', group: 'System Settings' },
    { key: 'view_audit_logs', label: 'View Audit Logs & Trail', group: 'System Settings' },
  ];

  const currentRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const togglePermission = (permKey: PermissionKey) => {
    if (!currentRole) return;
    const currentPerms = currentRole.permissions || [];
    let updated: PermissionKey[];
    if (currentPerms.includes(permKey)) {
      updated = currentPerms.filter((p) => p !== permKey);
    } else {
      updated = [...currentPerms, permKey];
    }
    updateRolePermissions(currentRole.id, updated);
  };

  // Export handlers
  const handleExportExcel = () => {
    if (activeTab === 'users') {
      const exportData = sortedUsers.map((u, i) => ({
        sl: i + 1,
        fullName: u.displayName,
        email: u.email,
        role: u.roleLabel,
        department: u.departmentLabel,
        phone: u.phoneLabel,
        status: u.statusLabel,
      }));
      const columns = [
        { header: '#', key: 'sl', align: 'left' as const },
        { header: 'FULL NAME', key: 'fullName', align: 'left' as const },
        { header: 'EMAIL', key: 'email', align: 'left' as const },
        { header: 'ROLE', key: 'role', align: 'left' as const },
        { header: 'DEPARTMENT', key: 'department', align: 'left' as const },
        { header: 'PHONE', key: 'phone', align: 'left' as const },
        { header: 'STATUS', key: 'status', align: 'left' as const },
      ];
      exportToExcel(
        exportData,
        columns,
        `USERS_LIST_${companySettings?.fiscalYear || '2024'}`,
        'SYSTEM USERS',
        companySettings,
        `Generated on ${new Date().toLocaleDateString('en-GB')}`
      );
      addToast?.('Users list exported to Excel!', 'success');
    } else {
      const exportData = roles.map((r) => ({
        role: r.roleName,
        description: r.description || '-',
        usersCount: users.filter((u) => (u.roleName || (u.role as string)) === r.roleName).length,
        permsCount: (r.permissions || []).length,
      }));
      const columns = [
        { header: 'ROLE', key: 'role', align: 'left' as const },
        { header: 'DESCRIPTION', key: 'description', align: 'left' as const },
        { header: 'ASSIGNED USERS', key: 'usersCount', isNumeric: true, align: 'right' as const },
        { header: 'PERMISSIONS', key: 'permsCount', isNumeric: true, align: 'right' as const },
      ];
      exportToExcel(
        exportData,
        columns,
        `ROLES_LIST_${companySettings?.fiscalYear || '2024'}`,
        'ROLES & PERMISSIONS',
        companySettings,
        `Generated on ${new Date().toLocaleDateString('en-GB')}`
      );
      addToast?.('Roles list exported to Excel!', 'success');
    }
  };

  const handleExportPdf = () => {
    if (activeTab === 'users') {
      const exportData = sortedUsers.map((u, i) => ({
        sl: String(i + 1),
        fullName: u.displayName,
        email: u.email,
        role: u.roleLabel,
        department: u.departmentLabel,
        phone: u.phoneLabel,
        status: u.statusLabel,
      }));
      const columns = [
        { header: '#', key: 'sl', align: 'left' },
        { header: 'FULL NAME', key: 'fullName', align: 'left' },
        { header: 'EMAIL', key: 'email', align: 'left' },
        { header: 'ROLE', key: 'role', align: 'left' },
        { header: 'DEPARTMENT', key: 'department', align: 'left' },
        { header: 'PHONE', key: 'phone', align: 'left' },
        { header: 'STATUS', key: 'status', align: 'left' },
      ];
      exportToPdf(
        exportData,
        columns,
        `USERS_LIST_${companySettings?.fiscalYear || '2024'}`,
        'SYSTEM USERS',
        companySettings,
        'p',
        `Total Operators: ${sortedUsers.length}`
      );
      addToast?.('Users list exported as PDF!', 'success');
    } else {
      const exportData = roles.map((r) => ({
        role: r.roleName,
        description: r.description || '-',
        usersCount: String(users.filter((u) => (u.roleName || (u.role as string)) === r.roleName).length),
        permsCount: String((r.permissions || []).length),
      }));
      const columns = [
        { header: 'ROLE', key: 'role', align: 'left' },
        { header: 'DESCRIPTION', key: 'description', align: 'left' },
        { header: 'USERS', key: 'usersCount', isNumeric: true, align: 'right' },
        { header: 'PERMISSIONS', key: 'permsCount', isNumeric: true, align: 'right' },
      ];
      exportToPdf(
        exportData,
        columns,
        `ROLES_LIST_${companySettings?.fiscalYear || '2024'}`,
        'ROLES & PERMISSIONS',
        companySettings,
        'p',
        `Total Roles: ${roles.length}`
      );
      addToast?.('Roles list exported as PDF!', 'success');
    }
  };

  const handleOpenCreateRole = () => {
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRolePerms([]);
    setIsCreateRoleModalOpen(true);
  };

  const handleSaveCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      addToast?.('Role name is required', 'warning');
      return;
    }
    const exists = roles.some((r) => r.roleName.toLowerCase() === newRoleName.trim().toLowerCase());
    if (exists) {
      addToast?.(`Role "${newRoleName.trim()}" already exists`, 'warning');
      return;
    }
    addRole({
      roleName: newRoleName.trim(),
      description: newRoleDesc.trim() || 'Custom system role',
      permissions: newRolePerms,
      isCustom: true,
    });
    setIsCreateRoleModalOpen(false);
    addToast?.(`Custom role "${newRoleName.trim()}" created successfully!`, 'success');
  };

  const confirmDeleteCustomRole = () => {
    if (!deletingCustomRole) return;
    deleteRole(deletingCustomRole.id);
    addToast?.(`Role "${deletingCustomRole.roleName}" deleted!`, 'info');
    if (selectedRoleId === deletingCustomRole.id) {
      setSelectedRoleId(roles[0]?.id || '');
    }
    setDeletingCustomRole(null);
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Page Title Card strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            USERS & ROLES
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-mono">
            {activeTab === 'users' ? `${users.length} OPERATORS` : `${roles.length} ROLES`}
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setDensity('compact');
                addToast?.('Table density set to COMPACT', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'compact'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMPACT
            </button>
            <button
              type="button"
              onClick={() => {
                setDensity('normal');
                addToast?.('Table density set to NORMAL', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'normal'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              NORMAL
            </button>
            <button
              type="button"
              onClick={() => {
                setDensity('comfortable');
                addToast?.('Table density set to COMFORTABLE', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'comfortable'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMFORTABLE
            </button>
          </div>

          <ReportButtonGroup
            iconOnly={true}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onPrint={() => setIsPreviewOpen(true)}
          />
        </div>
      </div>

      {/* 2. Unified Filter Toolbar: Integrated Subtabs, Actions, and Filters */}
      <div className="bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 rounded-xl p-2.5 sm:p-3 shadow-xs space-y-2.5 text-slate-800 dark:text-slate-100 no-print">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left grouping: Subtabs buttons + Contextual Action button + Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Subtabs Button Group */}
            <div className="inline-flex items-center p-0.5 bg-white/90 dark:bg-slate-800/90 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('users');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-[10.5px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                  activeTab === 'users'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                SYSTEM USERS ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('roles')}
                className={`px-2.5 py-1 text-[10.5px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                  activeTab === 'roles'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ROLES & PERMISSIONS ({roles.length})
              </button>
            </div>

            {/* Contextual Action Button */}
            {activeTab === 'users' ? (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer uppercase active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>ADD USER</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreateRole}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer uppercase active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>CREATE ROLE</span>
              </button>
            )}

            {/* Search Box & Dropdown (When on Users tab) */}
            {activeTab === 'users' && (
              <>
                <div className="relative w-36 sm:w-44 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs transition-all font-medium"
                    aria-label="Search users"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={selectedRoleFilter}
                  onChange={(e) => {
                    setSelectedRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="py-1 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold uppercase cursor-pointer shadow-2xs"
                >
                  <option value="">ALL ROLES</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.roleName}>
                      {r.roleName.toUpperCase()}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* Right grouping: Counter + Reset Button */}
          <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
            <span className="text-[10.5px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              {activeTab === 'users' ? (
                <>
                  <strong className="text-slate-800 dark:text-slate-200 font-semibold">{filteredUsers.length}</strong> operators
                </>
              ) : (
                <>
                  <strong className="text-slate-800 dark:text-slate-200 font-semibold">{roles.length}</strong> roles
                </>
              )}
            </span>

            {activeTab === 'users' && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
                title="Reset search and filters"
                aria-label="Reset search and filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- TAB 1: USERS --- */}
      {activeTab === 'users' && (
        <div className="space-y-3.5">

          <div className="border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px]">
                <tr>
                  <th
                    onClick={() => handleSort('displayName')}
                    className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                      sortKey === 'displayName'
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                        : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="inline-flex items-center gap-0.5 w-full">
                      <span className="break-words">FULL NAME</span>
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="displayName" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('email')}
                    className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                      sortKey === 'email'
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                        : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="inline-flex items-center gap-0.5 w-full">
                      <span className="break-words">EMAIL</span>
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="email" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('roleLabel')}
                    className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                      sortKey === 'roleLabel'
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                        : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="inline-flex items-center gap-0.5 w-full">
                      <span className="break-words">ROLE</span>
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="roleLabel" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('departmentLabel')}
                    className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                      sortKey === 'departmentLabel'
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                        : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="inline-flex items-center gap-0.5 w-full">
                      <span className="break-words">DEPARTMENT</span>
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="departmentLabel" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('phoneLabel')}
                    className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                      sortKey === 'phoneLabel'
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                        : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="inline-flex items-center gap-0.5 w-full">
                      <span className="break-words">PHONE</span>
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="phoneLabel" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('statusLabel')}
                    className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                      sortKey === 'statusLabel'
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                        : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="inline-flex items-center gap-0.5 w-full">
                      <span className="break-words">STATUS</span>
                      <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="statusLabel" />
                    </div>
                  </th>
                  <th className={`${thPadding} text-center border border-slate-300 dark:border-slate-700 select-none`}>
                    <span className="break-words">ACTIONS</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 text-xs"
                    >
                      <p className="font-medium">No matching user accounts found.</p>
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                      >
                        Add operator
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((row) => (
                    <tr
                      key={row.id}
                      className={`${densityStyles.row} transition-colors duration-150 ease-out hover:bg-sky-500/10 dark:hover:bg-sky-400/10 cursor-default`}
                    >
                      <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                        <span className="font-bold text-slate-800 dark:text-slate-100 break-words tracking-tight uppercase">
                          {row.displayName}
                          {row.isCurrent && (
                            <span className="ml-1 inline-block px-1 py-0.2 rounded text-[8px] font-mono font-bold border border-indigo-400 text-indigo-700 dark:text-indigo-300">
                              YOU
                            </span>
                          )}
                        </span>
                      </td>
                      <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300`}>
                        {row.email}
                      </td>
                      <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                        <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold border border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide bg-transparent shadow-2xs">
                          {row.roleLabel}
                        </span>
                      </td>
                      <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium`}>
                        {row.departmentLabel}
                      </td>
                      <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200`}>
                        {row.phoneLabel}
                      </td>
                      <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                        <span
                          className={`inline-block px-1 py-0.5 rounded font-bold uppercase tracking-wide border ${densityStyles.badge} ${
                            (row.status || 'active') === 'active'
                              ? 'border-emerald-400 text-emerald-700 dark:text-emerald-300'
                              : 'border-slate-400 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {row.statusLabel}
                        </span>
                      </td>
                      <td className={`${cellPadding} px-2 text-center border border-slate-300 dark:border-slate-700`}>
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingUser(row)}
                            className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                            title="View profile details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(row)}
                            className="p-1 rounded-md text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                            title="Edit user profile"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingUser(row)}
                            disabled={row.isCurrent}
                            className={`p-1 rounded-md border cursor-pointer ${
                              row.isCurrent
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 border-rose-200 dark:border-rose-900'
                            }`}
                            title={row.isCurrent ? 'Cannot delete current account' : 'Delete user account'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {sortedUsers.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-slate-850 font-bold border-t-2 border-slate-400 dark:border-slate-600">
                  <tr>
                    <td
                      colSpan={7}
                      className="py-2 pl-3 text-left uppercase tracking-wider text-slate-900 dark:text-white bg-slate-200/90 dark:bg-slate-800 font-black border border-slate-300 dark:border-slate-700 shadow-2xs"
                    >
                      <div className="flex items-center justify-start gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 text-xs font-black tracking-widest uppercase shadow-xs">
                          <Layers className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                          <span>TOTAL {sortedUsers.length} USER{sortedUsers.length === 1 ? '' : 'S'}</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {totalRecords > 0 && (
            <div className="pt-2 px-1 border-t border-slate-200 dark:border-slate-750 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 select-none">
              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-1.5 py-0.5 text-xs font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 shadow-2xs cursor-pointer font-bold"
                    aria-label="Rows per page"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={-1}>All</option>
                  </select>
                </div>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Showing <strong className="text-slate-900 dark:text-white font-bold">{startIndex + 1}</strong>–<strong className="text-slate-900 dark:text-white font-bold">{endIndex}</strong> of <strong className="text-slate-900 dark:text-white font-bold">{totalRecords}</strong> records
                </span>
              </div>
              {pageSize !== -1 && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setCurrentPage(1)} disabled={effectivePage === 1} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="First Page">
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={effectivePage === 1} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="Previous Page">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {effectivePage} / {totalPages}
                  </span>
                  <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={effectivePage === totalPages} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="Next Page">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={effectivePage === totalPages} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="Last Page">
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: ROLES & PERMISSIONS --- */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px]">
                <tr>
                  <th className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span className="break-words">ROLE</span>
                  </th>
                  <th className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700`}>
                    <span className="break-words">USERS</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {roles.map((r) => {
                  const isSelected = r.id === currentRole.id;
                  const count = users.filter((u) => (u.roleName || (u.role as string)) === r.roleName).length;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRoleId(r.id)}
                      className={`${densityStyles.row} transition-colors duration-150 ease-out cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/10 dark:bg-sky-400/10'
                          : 'hover:bg-sky-500/10 dark:hover:bg-sky-400/10'
                      }`}
                    >
                      <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                        <div className="flex items-center justify-between gap-1">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 break-words tracking-tight uppercase">
                              {r.roleName}
                            </span>
                            {r.isCustom && (
                              <span className="ml-1.5 px-1 py-0.2 rounded text-[8px] font-bold border border-amber-400 text-amber-700 dark:text-amber-300 uppercase">
                                CUSTOM
                              </span>
                            )}
                            {r.description && (
                              <span className="block text-slate-500 dark:text-slate-400 font-medium">{r.description}</span>
                            )}
                          </div>
                          {r.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingCustomRole(r);
                              }}
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer shrink-0"
                              title={`Delete role ${r.roleName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className={`${cellPadding} pr-3 text-right font-mono tabular-nums font-bold text-indigo-700 dark:text-indigo-400 border border-slate-300 dark:border-slate-700`}>
                        {count}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-850 font-bold border-t-2 border-slate-400 dark:border-slate-600">
                <tr>
                  <td className="py-2 px-2.5 text-center uppercase tracking-wider text-slate-900 dark:text-white bg-slate-200/90 dark:bg-slate-800 font-black border border-slate-300 dark:border-slate-700 shadow-2xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 text-xs font-black tracking-widest uppercase shadow-xs">
                      <Layers className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      <span>TOTAL</span>
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right font-bold text-indigo-700 dark:text-indigo-300 bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                    {roles.length}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Permissions Matrix Column */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>{currentRole.roleName} PERMISSIONS</span>
                </h3>
                <p className="text-xs text-slate-500">{currentRole.description}</p>
              </div>

              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {(currentRole.permissions || []).length} / {ALL_SYSTEM_PERMISSIONS.length} ACTIVE
              </span>
            </div>

            {/* Grouped Permissions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                const isEnabled = (currentRole.permissions || []).includes(perm.key);

                return (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      isEnabled
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => togglePermission(perm.key)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] uppercase tracking-wide">{perm.label}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-mono">{perm.group}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT USER MODAL --- */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {editingUser ? 'EDIT USER ACCOUNT' : 'ADD NEW USER ACCOUNT'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Management">Management</option>
                    <option value="Accounts">Accounts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.roleName}
                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.roleName}>
                        {r.roleName.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="inactive">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase shadow-xs transition-all cursor-pointer"
                >
                  {editingUser ? 'UPDATE USER' : 'CREATE USER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW USER MODAL --- */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-600 text-white font-bold flex items-center justify-center font-mono">
                  {(viewingUser.fullName || viewingUser.name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                    {viewingUser.fullName || viewingUser.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">{viewingUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">ROLE:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                  {viewingUser.roleName || (viewingUser.role as string)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">DEPARTMENT:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {viewingUser.department || 'Operations'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">PHONE:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {viewingUser.phone || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">STATUS:</span>
                <span className="font-bold text-emerald-600 uppercase">
                  {viewingUser.status || 'ACTIVE'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">JOINED:</span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString() : 'Active Member'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-xs cursor-pointer"
              >
                CLOSE
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingUser;
                  setViewingUser(null);
                  handleOpenEdit(target);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>EDIT USER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE USER CONFIRMATION MODAL --- */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  DELETE OPERATOR
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">"{deletingUser.fullName || deletingUser.name}"</span>?
                </p>
                <p className="text-[11px] text-rose-500 mt-1">
                  Their access credentials will be revoked immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CONFIRM DELETE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE CUSTOM ROLE MODAL --- */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  CREATE NEW CUSTOM ROLE
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomRole} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  ROLE NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit Inspector"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  ROLE DESCRIPTION
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inspects transactions and generates verification reports"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  PERMISSIONS ({newRolePerms.length} SELECTED)
                </label>
                <div className="max-h-52 overflow-y-auto space-y-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  {ALL_SYSTEM_PERMISSIONS.map((perm) => {
                    const isChecked = newRolePerms.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 cursor-pointer text-slate-800 dark:text-slate-200 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRolePerms((prev) => [...prev, perm.key]);
                            } else {
                              setNewRolePerms((prev) => prev.filter((k) => k !== perm.key));
                            }
                          }}
                          className="rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span className="font-semibold">{perm.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-auto">({perm.group})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold uppercase shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>CREATE ROLE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CUSTOM ROLE CONFIRMATION MODAL --- */}
      {deletingCustomRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  DELETE CUSTOM ROLE
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete role <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">"{deletingCustomRole.roleName}"</span>?
                </p>
                <p className="text-[11px] text-rose-500 mt-1">
                  Any users assigned to this role should be reassigned.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeletingCustomRole(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmDeleteCustomRole}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CONFIRM DELETE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={activeTab === 'users' ? 'SYSTEM USERS' : 'ROLES & PERMISSIONS'}
        documentTitle={activeTab === 'users' ? 'SYSTEM USERS' : 'ROLES & PERMISSIONS'}
        period={activeTab === 'users' ? `Total Operators: ${sortedUsers.length}` : `Total Roles: ${roles.length}`}
        columns={
          activeTab === 'users'
            ? [
                { header: '#', key: 'sl', align: 'left' },
                { header: 'FULL NAME', key: 'fullName', align: 'left' },
                { header: 'EMAIL', key: 'email', align: 'left' },
                { header: 'ROLE', key: 'role', align: 'left' },
                { header: 'DEPARTMENT', key: 'department', align: 'left' },
                { header: 'PHONE', key: 'phone', align: 'left' },
                { header: 'STATUS', key: 'status', align: 'left' },
              ]
            : [
                { header: 'ROLE', key: 'role', align: 'left' },
                { header: 'DESCRIPTION', key: 'description', align: 'left' },
                { header: 'USERS', key: 'usersCount', isNumeric: true, align: 'right' },
                { header: 'PERMISSIONS', key: 'permsCount', isNumeric: true, align: 'right' },
              ]
        }
        data={
          activeTab === 'users'
            ? sortedUsers.map((u, i) => ({
                sl: String(i + 1),
                fullName: u.displayName,
                email: u.email,
                role: u.roleLabel,
                department: u.departmentLabel,
                phone: u.phoneLabel,
                status: u.statusLabel,
              }))
            : roles.map((r) => ({
                role: r.roleName,
                description: r.description || '-',
                usersCount: String(users.filter((u) => (u.roleName || (u.role as string)) === r.roleName).length),
                permsCount: String((r.permissions || []).length),
              }))
        }
      />
    </div>
  );
};
