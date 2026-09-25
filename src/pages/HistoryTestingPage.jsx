import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import SkeletonTable from '../components/SkeletonTable';
import Toast from '../components/Toast';
import CustomDropdown from '../components/CustomDropdown';
import AntDateRangePicker from '../components/AntDateRangePicker';
import ModalPortal from '../components/ModalPortal';
import PageHeaderCard from '../components/PageHeaderCard';

const STROKE_LABELS = [0, 10, 20, 30, 40, 50, 60];

const TRIAL_COLORS = [
  '#FF4D4F',
  '#1890FF',
  '#00A854',
  '#FA8C16',
  '#722ED1',
  '#13C2C2',
  '#EB2F96',
  '#FAAD14',
  '#2F54EB',
  '#52C41A'
];

export default function HistoryTestingPage({
  historyList,
  models,
  onBackToTesting
}) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModelFilter, setSelectedModelFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewRecord, setViewRecord] = useState(null);
  const [toast, setToast] = useState(null);

  // Skeleton loader on enter
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Filter records
  const filteredRecords = historyList.filter((item) => {
    const matchSearch =
      !searchQuery ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.datetime.toLowerCase().includes(searchQuery.toLowerCase());
    const matchModel =
      !selectedModelFilter || item.model === selectedModelFilter;
    return matchSearch && matchModel;
  });

  const totalEntries = filteredRecords.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownloadExcel = (record) => {
    const wb = XLSX.utils.book_new();
    const data = [
      ['ASTEMO - HISTORICAL TEST DATA'],
      ['Model', record.model],
      ['Testing Datetime', record.datetime],
      ['Speed (mm/min)', record.speed || 500],
      ['Stroke (mm)', record.stroke || 20],
      ['Angle (deg)', record.angle || 45],
      ['Trials Count', record.trialsCount || (record.chartData?.trials ? record.chartData.trials.length : 3)],
      [],
      ['REALTIME PARAMETERS'],
      ['Stroke', record.metrics?.stroke || 55],
      ['Load', record.metrics?.load || 55],
      ['Load Compression', record.metrics?.loadCompression || 58],
      ['Load Force', record.metrics?.loadForce || 59],
      ['Friction Force', record.metrics?.frictionForce || 50]
    ];

    if (record.chartData) {
      data.push([]);
      data.push(['CHART DATA (LOAD N vs STROKE mm)']);

      // Support dynamic trials if trials array is present
      const trialList = record.chartData.trials
        ? record.chartData.trials
        : [
          record.chartData.s1,
          record.chartData.s2,
          record.chartData.s3,
          record.chartData.s4,
          record.chartData.s5
        ].filter(Boolean);

      const header = ['Stroke (mm)'];
      trialList.forEach((_, idx) => header.push(`Testing ${idx + 1} (N)`));
      data.push(header);

      STROKE_LABELS.forEach((s, ptIdx) => {
        const row = [s];
        trialList.forEach((tData) => {
          row.push(tData?.[ptIdx] || 0);
        });
        data.push(row);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'History Details');
    XLSX.writeFile(wb, `History_Test_${record.model}_${record.id}.xlsx`);

    setToast({
      type: 'success',
      title: 'Download Successful',
      message: `Historical data for ${record.model} downloaded.`
    });
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header with Title on Left and Breadcrumb on Right inside the card */}
        <PageHeaderCard
          title="History Testing"
          subtitle="Realtime monitoring during product testing"
          action={
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={onBackToTesting}
                className="hover:text-gray-800 transition-colors flex items-center gap-1.5"
              >
                <span>Testing Process</span>
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-[#00A854] font-semibold">History Testing</span>
            </div>
          }
        />

        {/* Table Container Card */}
        <div className="bg-white rounded-xl border border-[#E4E7EC] p-6 shadow-sm space-y-5">
          {/* Filters bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search */}
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
              {/* Custom Model Filter Dropdown */}
              <div className="w-48">
                <CustomDropdown
                  value={selectedModelFilter}
                  onChange={(val) => setSelectedModelFilter(val)}
                  options={models}
                  placeholder="Select Model"
                  includeAllOption={true}
                  allOptionLabel="All Model"
                  className="w-full"
                />
              </div>

              {/* Ant Design RangePicker */}
              <AntDateRangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
              />
            </div>
          </div>

          {/* Content Table or Skeleton */}
          {loading ? (
            <SkeletonTable rows={10} cols={4} />
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
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        <span>Model</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        <span>Testing Datetime</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] bg-white">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">
                        No testing history data found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-gray-600 font-medium">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="py-3.5 px-4 text-gray-800 font-medium">
                          {item.model}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {item.datetime}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* View Button */}
                            <button
                              onClick={() => setViewRecord(item)}
                              className="p-1.5 border border-blue-200 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                              title="View Test Details & Chart"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Download Button */}
                            <button
                              onClick={() => handleDownloadExcel(item)}
                              className="p-1.5 border border-emerald-200 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Download Excel Document"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Record Modal rendered via ModalPortal (100% full-screen blur with ZERO gap) */}
        {/* View Record Modal rendered via ModalPortal (Matching Validation Modal with Chart on Top) */}
        <ModalPortal isOpen={!!viewRecord} onClose={() => setViewRecord(null)}>
          {viewRecord && (
            <div className="bg-white rounded-xl max-w-[560px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#EAECF0] animate-in fade-in zoom-in-95 duration-200">
              {/* 1. Header with bottom divider line */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-[#EAECF0] flex-shrink-0">
                <div>
                  <h3 className="text-base font-bold text-[#101828]">
                    Testing Details
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Executed at {viewRecord.datetime}
                  </p>
                </div>
                <button
                  onClick={() => setViewRecord(null)}
                  className="text-[#667085] hover:text-[#344054] p-1 -mr-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 2. Modal Body */}
              <div className="px-6 py-4 flex flex-col gap-4 overflow-y-auto">
                {/* Konten Paling Atas: Chart Curves Snapshot */}
                <div>
                  <p className="text-sm text-[#344054] mb-2 font-normal">Testing Curves</p>
                  <div className="border border-[#D0D5DD] rounded-xl p-3 bg-white">
                    <div className="h-44 w-full">
                      <Line
                        data={{
                          labels: STROKE_LABELS,
                          datasets: viewRecord.chartData?.trials
                            ? viewRecord.chartData.trials.map((tData, i) => ({
                              label: `Testing ${i + 1}`,
                              data: tData,
                              borderColor: TRIAL_COLORS[i % TRIAL_COLORS.length] || '#00A854',
                              borderWidth: 2,
                              tension: 0.35,
                              pointRadius: 0
                            }))
                            : [
                              {
                                label: 'First Testing',
                                data: viewRecord.chartData?.s1 || [0, 1.5, 4.0, 9.5, 17.5, 33.0, 48.0],
                                borderColor: '#FF4D4F',
                                borderWidth: 2,
                                tension: 0.35,
                                pointRadius: 0
                              },
                              {
                                label: 'Second Testing',
                                data: viewRecord.chartData?.s2 || [0, 2.5, 6.0, 12.0, 21.0, 38.0, 50.0],
                                borderColor: '#1890FF',
                                borderWidth: 2,
                                tension: 0.35,
                                pointRadius: 0
                              },
                              {
                                label: 'Third Testing',
                                data: viewRecord.chartData?.s3 || [0, 5.0, 10.5, 17.0, 26.5, 45.0, 54.0],
                                borderColor: '#00A854',
                                borderWidth: 2,
                                tension: 0.35,
                                pointRadius: 0
                              }
                            ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                boxWidth: 10,
                                font: { size: 10, family: 'Inter, sans-serif' },
                                color: '#475467'
                              }
                            },
                            tooltip: {
                              backgroundColor: '#1E232F',
                              titleFont: { size: 11 },
                              bodyFont: { size: 11 },
                              padding: 8,
                              cornerRadius: 6
                            }
                          },
                          scales: {
                            x: {
                              grid: { display: false },
                              ticks: { font: { size: 10 }, color: '#475467' }
                            },
                            y: {
                              min: 0,
                              max: 65,
                              grid: { color: '#F2F4F7' },
                              ticks: { stepSize: 10, font: { size: 10 }, color: '#475467' }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Line Pemisah */}
                <div className="border-t border-[#EAECF0]" />

                {/* Model */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#344054]">Model</span>
                  <span className="font-bold text-[#101828]">{viewRecord.model}</span>
                </div>

                {/* Siklus Pengujian */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#344054]">Siklus Pengujian</span>
                  <span className="font-bold text-[#101828]">
                    {viewRecord.trialsCount || (viewRecord.chartData?.trials ? viewRecord.chartData.trials.length : 3)}x Pengujian
                  </span>
                </div>

                {/* Parameter Pengujian */}
                <div>
                  <p className="text-sm text-[#344054] mb-2 font-normal">Parameter Pengujian</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-3 text-center bg-white">
                      <p className="text-xs text-[#344054]">Speed</p>
                      <p className="text-sm font-bold text-[#101828] mt-0.5">{viewRecord.speed || 500} mm/min</p>
                    </div>
                    <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-3 text-center bg-white">
                      <p className="text-xs text-[#344054]">Stroke</p>
                      <p className="text-sm font-bold text-[#101828] mt-0.5">{viewRecord.stroke || 20} mm</p>
                    </div>
                    <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-3 text-center bg-white">
                      <p className="text-xs text-[#344054]">Angle</p>
                      <p className="text-sm font-bold text-[#101828] mt-0.5">{viewRecord.angle || 45}°</p>
                    </div>
                  </div>
                </div>

                {/* Line Pemisah */}
                <div className="border-t border-[#EAECF0]" />

                {/* Hasil Pengujian */}
                <div>
                  <p className="text-sm text-[#344054] mb-2 font-normal">Hasil Pengujian</p>
                  <div className="grid grid-cols-5 gap-2.5">
                    <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-1 text-center bg-white">
                      <p className="text-xs text-[#344054]">Stroke</p>
                      <p className="text-sm font-bold text-[#101828] mt-0.5">{viewRecord.metrics?.stroke ?? 55}</p>
                    </div>
                    <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-1 text-center bg-white">
                      <p className="text-xs text-[#344054]">Load</p>
                      <p className="text-sm font-bold text-[#101828] mt-0.5">{viewRecord.metrics?.load ?? 55}</p>
                    </div>
                    <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-1 text-center bg-white">
                      <p className="text-xs text-[#344054]">Compress</p>
                      <p className="text-sm font-bold text-[#101828] mt-0.5">{viewRecord.metrics?.loadCompression ?? 58}</p>
                    </div>
                    <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-1 text-center bg-white">
                      <p className="text-xs text-[#344054]">Force</p>
                      <p className="text-sm font-bold text-[#101828] mt-0.5">{viewRecord.metrics?.loadForce ?? 59}</p>
                    </div>
                    <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-1 text-center bg-white">
                      <p className="text-xs text-[#344054]">Friction</p>
                      <p className="text-sm font-bold text-[#101828] mt-0.5">{viewRecord.metrics?.frictionForce ?? 50}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Footer with top divider line pemisah */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#EAECF0] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadExcel(viewRecord)}
                  className="flex items-center gap-2 px-6 py-2 border border-[#D0D5DD] bg-white text-[#344054] hover:bg-gray-50 rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#107C41]" />
                  <span>Export Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewRecord(null)}
                  className="px-7 py-2 bg-[#00A854] hover:bg-[#008C45] text-white rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </ModalPortal>
      </div>

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
