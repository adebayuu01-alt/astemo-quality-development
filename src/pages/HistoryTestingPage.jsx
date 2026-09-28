import React, { useState, useEffect, useRef } from 'react';
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import SkeletonTable from '../components/SkeletonTable';
import Toast from '../components/Toast';
import CustomDropdown from '../components/CustomDropdown';
import AntDateRangePicker from '../components/AntDateRangePicker';
import ModalPortal from '../components/ModalPortal';
import PageHeaderCard from '../components/PageHeaderCard';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Vertical guideline plugin matching TestingProcessPage
const verticalLinePlugin = {
  id: 'verticalGuidelineHistory',
  afterDraw: (chart) => {
    if (chart.tooltip?._active?.length) {
      const activePoint = chart.tooltip._active[0];
      const dataIndex = activePoint.index;
      const hasDataAtPoint = chart.data.datasets.some((ds, idx) => {
        if (chart.isDatasetVisible(idx) === false) return false;
        const val = ds.data?.[dataIndex];
        return val !== null && val !== undefined;
      });

      if (!hasDataAtPoint) return;

      const ctx = chart.ctx;
      const x = activePoint.element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#B0E9CF'; // Matching user's vertical guideline
      ctx.stroke();
      ctx.restore();
    }
  }
};

const STROKE_LABELS = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90];

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
  const modalTooltipRef = useRef(null);

  // Custom Tooltip HTML matching Testing Process Page exactly
  const customModalTooltipHandler = (context) => {
    const { chart, tooltip } = context;
    const tooltipEl = modalTooltipRef.current;
    if (!tooltipEl) return;

    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = '0';
      return;
    }

    if (tooltip.body) {
      let innerHtml = `
        <div style="text-align: center; font-weight: 700; font-size: 11px; color: #101828; margin-bottom: 8px;">
          Testing Value
        </div>
        <div style="display: flex; flex-direction: column; gap: 5px;">
      `;

      let hasValidPoints = false;
      tooltip.dataPoints.forEach((dp) => {
        if (dp.raw === null || dp.raw === undefined) return;

        hasValidPoints = true;
        const dataset = chart.data.datasets[dp.datasetIndex];
        const color = dataset.borderColor;
        const label = dataset.label;
        const val = dp.formattedValue;

        innerHtml += `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; white-space: nowrap;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; flex-shrink: 0;"></span>
              <span style="font-size: 11px; color: #475467; font-weight: 500;">${label}</span>
            </div>
            <span style="font-size: 11px; color: #101828; font-weight: 700; margin-left: 12px;">${val}</span>
          </div>
        `;
      });

      if (!hasValidPoints) {
        tooltipEl.style.opacity = '0';
        return;
      }

      innerHtml += `</div>`;
      tooltipEl.innerHTML = innerHtml;
    }

    const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
    const chartWidth = chart.width;
    const chartHeight = chart.height;

    tooltipEl.style.opacity = '1';

    if (tooltip.caretX > chartWidth * 0.55) {
      tooltipEl.style.left = (positionX + tooltip.caretX - 16) + 'px';
      const clampedY = Math.max(50, Math.min(tooltip.caretY, chartHeight - 70));
      tooltipEl.style.top = (positionY + clampedY) + 'px';
      tooltipEl.style.transform = 'translate(-100%, -50%)';
    } else if (tooltip.caretX < chartWidth * 0.18) {
      tooltipEl.style.left = (positionX + tooltip.caretX + 16) + 'px';
      const clampedY = Math.max(50, Math.min(tooltip.caretY, chartHeight - 70));
      tooltipEl.style.top = (positionY + clampedY) + 'px';
      tooltipEl.style.transform = 'translate(0%, -50%)';
    } else {
      tooltipEl.style.left = (positionX + tooltip.caretX) + 'px';
      const clampedY = Math.max(60, tooltip.caretY);
      tooltipEl.style.top = (positionY + clampedY) + 'px';
      tooltipEl.style.transform = 'translate(-50%, -115%)';
    }
  };

  // Modal Chart Options identical to TestingProcessPage
  const modalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'bottom',
        cursor: 'pointer',
        onClick: (e, legendItem, legend) => {
          const chart = legend.chart;
          const trialIndex = legendItem.datasetIndex;
          const dsIdx1 = trialIndex * 2;
          const dsIdx2 = trialIndex * 2 + 1;
          const isVisible = chart.isDatasetVisible(dsIdx1);
          chart.setDatasetVisibility(dsIdx1, !isVisible);
          if (chart.data.datasets[dsIdx2]) {
            chart.setDatasetVisibility(dsIdx2, !isVisible);
          }
          chart.update();
        },
        labels: {
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            const items = [];
            for (let i = 0; i < datasets.length; i += 2) {
              const trialNum = Math.floor(i / 2) + 1;
              const color = datasets[i].borderColor;
              const isHidden = !chart.isDatasetVisible(i);
              items.push({
                text: `Testing ${trialNum}`,
                fillStyle: color,
                strokeStyle: color,
                lineWidth: 1,
                hidden: isHidden,
                datasetIndex: Math.floor(i / 2)
              });
            }
            return items;
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 14,
          boxWidth: 8,
          boxHeight: 8,
          font: {
            size: 11,
            family: 'Inter, sans-serif'
          },
          color: '#475467'
        }
      },
      tooltip: {
        enabled: false,
        external: customModalTooltipHandler
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Disp. (mm)',
          color: '#4C4E67',
          font: { size: 12, weight: '500' }
        },
        grid: {
          display: true,
          color: '#F2F4F7'
        },
        ticks: {
          color: '#475467',
          font: { size: 10 }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Force (N)',
          color: '#4C4E67',
          font: { size: 12, weight: '500' }
        },
        min: -100,
        max: 1500,
        ticks: {
          stepSize: 100,
          color: '#475467',
          font: { size: 10 }
        },
        grid: {
          color: '#F2F4F7'
        }
      }
    }
  };

  // Convert record chartData to identical dual-curve datasets
  const getModalDatasets = (record) => {
    if (!record?.chartData) return [];
    const cd = record.chartData;

    if (cd.trials && cd.trials.length > 0) {
      return cd.trials.flatMap((tData, i) => {
        const color = TRIAL_COLORS[i % TRIAL_COLORS.length] || '#00A854';
        return [
          {
            label: `Testing ${i + 1} (Kompresi)`,
            data: tData.compression,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            spanGaps: false
          },
          {
            label: `Testing ${i + 1} (Rebound)`,
            data: tData.rebound,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            spanGaps: false
          }
        ];
      });
    }

    if (cd.cycles && cd.cycles.length > 0) {
      return cd.cycles.flatMap((c, i) => {
        const color = TRIAL_COLORS[i % TRIAL_COLORS.length] || '#1890FF';
        return [
          {
            label: `Testing ${c.cycleNum || i + 1} (Kompresi)`,
            data: c.compression,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            spanGaps: false
          },
          {
            label: `Testing ${c.cycleNum || i + 1} (Rebound)`,
            data: c.rebound,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            spanGaps: false
          }
        ];
      });
    }

    if (cd.compression && cd.rebound) {
      const color = TRIAL_COLORS[0];
      return [
        {
          label: 'Testing 1 (Kompresi)',
          data: cd.compression,
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          spanGaps: false
        },
        {
          label: 'Testing 1 (Rebound)',
          data: cd.rebound,
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          spanGaps: false
        }
      ];
    }

    // Default hysteresis curve
    const color = TRIAL_COLORS[0];
    return [
      {
        label: 'Testing 1 (Kompresi)',
        data: cd.s1 || [0, 160, 210, 250, 290, 330, 375, 425, 485, 560, 650, 760, 890, 1030, 1090, null],
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        spanGaps: false
      },
      {
        label: 'Testing 1 (Rebound)',
        data: cd.s2 || [0, 115, 160, 195, 230, 265, 305, 350, 400, 465, 540, 635, 750, 890, 1090, null],
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        spanGaps: false
      }
    ];
  };

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
      ['ASTEMO - HISTORICAL TEST DATA (SHOCK ABSORBER)'],
      ['Model', record.model],
      ['Testing Datetime', record.datetime],
      ['Speed (mm/min)', record.speed || 500],
      ['Stroke (mm)', record.stroke || 20],
      ['Angle (deg)', record.angle || 45],
      ['Trials Count', record.trialsCount || (record.chartData?.cycles ? record.chartData.cycles.length : 1)],
      [],
      ['REALTIME PARAMETERS'],
      ['Stroke (mm)', record.metrics?.stroke || 60],
      ['Peak Load (N)', record.metrics?.load || 58],
      ['Peak Load Compression (N)', record.metrics?.loadCompression || 58],
      ['Peak Rebound Force (N)', record.metrics?.loadForce || 48.5],
      ['Friction Force (N)', record.metrics?.frictionForce || 50]
    ];

    if (record.chartData) {
      data.push([]);
      data.push(['CHART DATA: FORCE (N) vs STROKE (mm)']);

      if (record.chartData.cycles && record.chartData.cycles.length > 0) {
        const header = ['Stroke (mm)'];
        record.chartData.cycles.forEach((c) => {
          header.push(`Siklus ${c.cycleNum} - Kompresi (N)`);
          header.push(`Siklus ${c.cycleNum} - Rebound (N)`);
        });
        data.push(header);

        STROKE_LABELS.forEach((s, ptIdx) => {
          const row = [s];
          record.chartData.cycles.forEach((c) => {
            row.push(c.compression?.[ptIdx] ?? 0);
            row.push(c.rebound?.[ptIdx] ?? 0);
          });
          data.push(row);
        });
      } else if (record.chartData.compression && record.chartData.rebound) {
        data.push(['Stroke (mm)', 'Fase Kompresi (N)', 'Fase Rebound (N)']);
        STROKE_LABELS.forEach((s, ptIdx) => {
          data.push([
            s,
            record.chartData.compression[ptIdx] ?? 0,
            record.chartData.rebound[ptIdx] ?? 0
          ]);
        });
      } else {
        // Fallback for legacy format
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

        {/* View Record Modal rendered via ModalPortal (Matching Testing Process Chart) */}
        <ModalPortal isOpen={!!viewRecord} onClose={() => setViewRecord(null)}>
          {viewRecord && (
            <div className="bg-white rounded-xl max-w-[620px] w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#EAECF0] animate-in fade-in zoom-in-95 duration-200">
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
                    <div className="h-[280px] sm:h-[300px] w-full relative">
                      <Line
                        data={{
                          labels: STROKE_LABELS,
                          datasets: getModalDatasets(viewRecord)
                        }}
                        options={modalChartOptions}
                        plugins={[verticalLinePlugin]}
                      />

                      {/* Floating Custom Tooltip Container matching Testing Process Page */}
                      <div
                        ref={modalTooltipRef}
                        className="pointer-events-none absolute z-20 bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 shadow-lg transition-all duration-75 opacity-0 min-w-[140px] whitespace-nowrap"
                        style={{
                          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06)'
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
