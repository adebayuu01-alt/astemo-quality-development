import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import SkeletonTable from '../components/SkeletonTable';
import Toast from '../components/Toast';
import AntDateRangePicker from '../components/AntDateRangePicker';
import ModalPortal from '../components/ModalPortal';
import PageHeaderCard from '../components/PageHeaderCard';

const SYSTEM_MENUS = [
  'Dashboard',
  'Planning Production',
  'User Management',
  'Role Management',
  'Master Data'
];

export default function RoleManagementPage({ roles, onUpdateRoles }) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // Form State
  const [roleName, setRoleName] = useState('');
  const [permissionsState, setPermissionsState] = useState(
    SYSTEM_MENUS.reduce((acc, m) => {
      acc[m] = { view: true, create: false, edit: false, delete: false };
      return acc;
    }, {})
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredRoles = roles.filter((r) =>
    r.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEntries = filteredRoles.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleAll = (checked) => {
    const updated = {};
    SYSTEM_MENUS.forEach((m) => {
      updated[m] = {
        view: checked,
        create: checked,
        edit: checked,
        delete: checked
      };
    });
    setPermissionsState(updated);
  };

  const handleToggleRow = (menu, key) => {
    setPermissionsState((prev) => ({
      ...prev,
      [menu]: {
        ...prev[menu],
        [key]: !prev[menu][key]
      }
    }));
  };

  // 3. Add Data Success Alert
  const handleSaveRole = (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setToast({ type: 'error', title: 'Error', message: 'Role name is required.' });
      return;
    }

    const enabledMenus = [];
    const enabledPerms = [];

    SYSTEM_MENUS.forEach((m) => {
      const p = permissionsState[m];
      const active = [];
      if (p.create) active.push('Create');
      if (p.view) active.push('Read');
      if (p.edit) active.push('Update');
      if (p.delete) active.push('Delete');

      if (active.length > 0) {
        enabledMenus.push(m);
        enabledPerms.push(active.join(', '));
      }
    });

    if (editingRole) {
      const updated = roles.map((r) =>
        r.id === editingRole.id
          ? {
            ...r,
            role: roleName,
            menus: enabledMenus.length ? enabledMenus : SYSTEM_MENUS,
            permissions: enabledPerms.length
              ? enabledPerms
              : SYSTEM_MENUS.map(() => 'Create, Read, Update, Delete')
          }
          : r
      );
      onUpdateRoles(updated);
      setToast({
        type: 'success',
        title: 'Role Updated',
        message: `Role ${roleName} has been successfully updated.`
      });
    } else {
      const newRole = {
        id: Date.now(),
        role: roleName,
        menus: enabledMenus.length ? enabledMenus : SYSTEM_MENUS,
        permissions: enabledPerms.length
          ? enabledPerms
          : SYSTEM_MENUS.map(() => 'Create, Read, Update, Delete'),
        datetime: new Date().toLocaleDateString('en-GB') + ' 12:00'
      };
      onUpdateRoles([...roles, newRole]);
      setToast({
        type: 'success',
        title: 'Role Created Successfully',
        message: `Role ${roleName} has been added to the system.`
      });
    }

    setShowAddModal(false);
    setEditingRole(null);
    setRoleName('');
  };

  const handleDeleteRole = (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      onUpdateRoles(roles.filter((r) => r.id !== id));
      setToast({ type: 'success', title: 'Deleted', message: 'Role deleted successfully.' });
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header matching Testing Process exactly */}
        <PageHeaderCard
          title="Role Management"
          subtitle="View your role in this system"
        />

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-[#E4E7EC] p-6 shadow-sm space-y-5">
          {/* Filters and Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full pl-10 pr-9 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Ant Design RangePicker */}
              <AntDateRangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
              />

              <button
                onClick={() => {
                  setEditingRole(null);
                  setRoleName('');
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#00A854] hover:bg-[#008C45] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Data</span>
              </button>
            </div>
          </div>

          {/* Table / Skeleton */}
          {loading ? (
            <SkeletonTable rows={3} cols={6} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#D0D5DD]">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#F2F2F7] border-b border-[#D0D5DD]">
                  <tr className="text-[#23262B] font-semibold">
                    <th className="py-3.5 px-4 w-16">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        <span>No</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 w-44">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        <span>Role</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 w-64">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        <span>Menu</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        <span>Permission</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 w-44">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        <span>Datetime</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] bg-white">
                  {paginatedRoles.map((r, index) => (
                    <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-4 text-gray-600 font-medium align-top">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-4 px-4 text-gray-800 font-medium align-top">
                        {r.role}
                      </td>
                      <td className="py-4 px-4 text-gray-700 align-top">
                        <ul className="space-y-1 text-xs">
                          {r.menus.map((m, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-4 px-4 text-gray-600 align-top">
                        <ul className="space-y-1 text-xs">
                          {r.permissions.map((p, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-4 px-4 text-gray-600 align-top">
                        {r.datetime}
                      </td>
                      <td className="py-4 px-4 text-right align-top">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingRole(r);
                              setRoleName(r.role);
                              setShowAddModal(true);
                            }}
                            className="p-1.5 border border-amber-300 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit Role"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(r.id)}
                            className="p-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-500">
            <div>
              Showing <span className="font-semibold text-gray-700">1</span> to{' '}
              <span className="font-semibold text-gray-700">
                {Math.min(itemsPerPage, totalEntries)}
              </span>{' '}
              of <span className="font-semibold text-gray-700">{totalEntries}</span>{' '}
              entries
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="w-7 h-7 flex items-center justify-center border border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold rounded-lg text-xs">
                  {currentPage}
                </span>
                <span>/ {totalPages}</span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-700 text-xs focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <span>entries</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Add / Edit Role Modal via ModalPortal (Zero Gap Blur) */}
      <ModalPortal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
          <div className="flex items-start justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {editingRole ? 'Edit Role Management' : 'Add Role Management'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                This field is for desc terms of service
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveRole} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Input Role Name"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Menu and Permission Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <span>Menu</span>
                <div className="flex items-center gap-2">
                  <span className="font-normal text-gray-500">Permission</span>
                  <label className="flex items-center gap-1.5 cursor-pointer font-normal text-gray-600">
                    <input
                      type="checkbox"
                      onChange={(e) => handleToggleAll(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Select All</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                {SYSTEM_MENUS.map((menu) => (
                  <div
                    key={menu}
                    className="flex items-center justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-xs font-medium text-gray-700 w-36 truncate">
                      {menu}
                    </span>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissionsState[menu]?.view || false}
                          onChange={() => handleToggleRow(menu, 'view')}
                          className="rounded text-[#00A854] focus:ring-emerald-500"
                        />
                        <span>View</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissionsState[menu]?.create || false}
                          onChange={() => handleToggleRow(menu, 'create')}
                          className="rounded text-[#00A854] focus:ring-emerald-500"
                        />
                        <span>Create</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissionsState[menu]?.edit || false}
                          onChange={() => handleToggleRow(menu, 'edit')}
                          className="rounded text-[#00A854] focus:ring-emerald-500"
                        />
                        <span>Edit</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissionsState[menu]?.delete || false}
                          onChange={() => handleToggleRow(menu, 'delete')}
                          className="rounded text-[#00A854] focus:ring-emerald-500"
                        />
                        <span>Delete</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#00A854] hover:bg-[#008C45] text-white rounded-lg text-sm font-medium shadow-sm"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </ModalPortal>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
