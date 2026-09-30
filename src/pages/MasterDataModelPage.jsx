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

export default function MasterDataModelPage({ models, onUpdateModels }) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);

  // Form states
  const [modelName, setModelName] = useState('');
  const [strokeVal, setStrokeVal] = useState('');
  const [angleVal, setAngleVal] = useState('');
  const [speedVal, setSpeedVal] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredModels = models.filter((m) =>
    m.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(m.stroke).toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(m.speed).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEntries = filteredModels.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const paginatedModels = filteredModels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenAdd = () => {
    setEditingModel(null);
    setModelName('');
    setStrokeVal('');
    setAngleVal('');
    setSpeedVal('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (m) => {
    setEditingModel(m);
    setModelName(m.model);
    setStrokeVal(m.stroke !== undefined ? String(m.stroke) : '');
    setAngleVal(m.angle !== undefined ? String(m.angle) : '');
    setSpeedVal(m.speed !== undefined ? String(m.speed) : '');
    setShowAddModal(true);
  };

  const handleSaveModel = (e) => {
    e.preventDefault();
    if (!modelName.trim()) {
      setToast({ type: 'error', title: 'Error', message: 'Model name is required.' });
      return;
    }
    if (strokeVal === '' || angleVal === '' || speedVal === '') {
      setToast({ type: 'error', title: 'Error', message: 'Semua parameter (Stroke, Angle, Speed) wajib diisi.' });
      return;
    }

    const parsedStroke = parseFloat(strokeVal) || 0;
    const parsedAngle = parseFloat(angleVal) || 0;
    const parsedSpeed = parseFloat(speedVal) || 0;

    if (editingModel) {
      const updated = models.map((m) =>
        m.id === editingModel.id
          ? {
              ...m,
              model: modelName.trim(),
              stroke: parsedStroke,
              angle: parsedAngle,
              speed: parsedSpeed
            }
          : m
      );
      onUpdateModels(updated);
      setToast({
        type: 'success',
        title: 'Model Updated',
        message: `Model ${modelName} has been successfully updated.`
      });
    } else {
      const newModel = {
        id: Date.now(),
        model: modelName.trim(),
        stroke: parsedStroke,
        angle: parsedAngle,
        speed: parsedSpeed,
        datetime: new Date().toLocaleDateString('en-GB') + ' 12:00'
      };
      onUpdateModels([...models, newModel]);
      setToast({
        type: 'success',
        title: 'Model Added Successfully',
        message: `Model ${modelName} has been added to the master data.`
      });
    }

    setShowAddModal(false);
    setEditingModel(null);
    setModelName('');
    setStrokeVal('');
    setAngleVal('');
    setSpeedVal('');
  };

  const handleDeleteModel = (id) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      onUpdateModels(models.filter((m) => m.id !== id));
      setToast({ type: 'success', title: 'Deleted', message: 'Model deleted successfully.' });
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <PageHeaderCard title="Model" subtitle="Master data model parameters configuration" />

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
                placeholder="Search model, stroke, or speed..."
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
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2 bg-[#00A854] hover:bg-[#008C45] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Data</span>
              </button>
            </div>
          </div>

          {/* Table / Skeleton */}
          {loading ? (
            <SkeletonTable rows={5} cols={7} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#D0D5DD]">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#F2F2F7] border-b border-[#D0D5DD]">
                  <tr className="text-[#23262B] font-semibold text-xs">
                    <th className="py-3.5 px-4 w-14">
                      <div className="flex items-center gap-1 cursor-pointer select-none">
                        <span>No</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1 cursor-pointer select-none">
                        <span>Model</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1 cursor-pointer select-none">
                        <span>Stroke (mm)</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1 cursor-pointer select-none">
                        <span>Angle (deg)</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1 cursor-pointer select-none">
                        <span>Speed (mm/min)</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1 cursor-pointer select-none">
                        <span>Datetime</span>
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] bg-white">
                  {paginatedModels.map((m, index) => {
                    const strokeDisplay =
                      m.stroke !== undefined
                        ? Number(m.stroke).toLocaleString('en-US', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 2
                          })
                        : '84.5';
                    return (
                      <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-gray-600 font-medium">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="py-3.5 px-4 text-gray-900 font-semibold">
                          {m.model}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                          {strokeDisplay} mm
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 font-medium">
                          {m.angle ?? 45}°
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 font-medium">
                          {m.speed ?? 500} mm/min
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-xs">
                          {m.datetime}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(m)}
                              className="p-1.5 border border-amber-300 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Model"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(m.id)}
                              className="p-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Model"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Add / Edit Model Modal */}
      <ModalPortal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div className="flex items-start justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {editingModel ? 'Edit Model' : 'Add Model'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Setting parameter model untuk digunakan operator saat pengujian
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveModel} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Model Name
              </label>
              <input
                type="text"
                required
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Contoh: SKA01-20-110"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Stroke (mm) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Stroke (mm)
              </label>
              <input
                type="number"
                step="any"
                required
                value={strokeVal}
                onChange={(e) => setStrokeVal(e.target.value)}
                placeholder="Input parameter stroke (e.g. 84.5)"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Angle (deg) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Angle (deg)
              </label>
              <input
                type="number"
                step="any"
                required
                value={angleVal}
                onChange={(e) => setAngleVal(e.target.value)}
                placeholder="Input parameter angle (e.g. 45)"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Speed (mm/min) - placed below Angle */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Speed (mm/min)
              </label>
              <input
                type="number"
                step="any"
                required
                value={speedVal}
                onChange={(e) => setSpeedVal(e.target.value)}
                placeholder="Input parameter speed (e.g. 500)"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
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
