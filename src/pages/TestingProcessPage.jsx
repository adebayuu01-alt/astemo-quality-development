import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  RotateCcw,
  Play,
  CheckCircle,
  Image as ImageIcon,
  Printer,
  FileSpreadsheet,
  X
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
import Toast from '../components/Toast';
import CustomDropdown from '../components/CustomDropdown';
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

const STROKE_LABELS = [0, 10, 20, 30, 40, 50, 60];

// Realistic S-curve damper target values for testing trials 1 to 10+
const BASE_FINAL_CURVES = [
  [0, 1.5, 4.0, 9.5, 17.5, 33.0, 48.0],   // Testing 1
  [0, 2.5, 6.0, 12.0, 21.0, 38.0, 50.0],  // Testing 2
  [0, 3.8, 8.2, 14.5, 23.8, 41.5, 52.0],  // Testing 3
  [0, 5.0, 10.5, 17.0, 26.5, 45.0, 54.0], // Testing 4
  [0, 6.2, 12.0, 19.5, 29.0, 48.5, 56.0], // Testing 5
  [0, 7.0, 13.5, 21.0, 31.0, 50.0, 57.5], // Testing 6
  [0, 7.8, 14.8, 22.5, 33.0, 51.5, 58.5], // Testing 7
  [0, 8.5, 16.0, 24.0, 35.0, 53.0, 59.5], // Testing 8
  [0, 9.2, 17.2, 25.5, 37.0, 54.5, 60.0], // Testing 9
  [0, 10.0, 18.5, 27.0, 39.0, 56.0, 61.0] // Testing 10
];

const TRIAL_COLORS = [
  { stroke: '#FF4D4F', name: 'Testing 1' },
  { stroke: '#1890FF', name: 'Testing 2' },
  { stroke: '#00A854', name: 'Testing 3' },
  { stroke: '#FA8C16', name: 'Testing 4' },
  { stroke: '#722ED1', name: 'Testing 5' },
  { stroke: '#13C2C2', name: 'Testing 6' },
  { stroke: '#EB2F96', name: 'Testing 7' },
  { stroke: '#FAAD14', name: 'Testing 8' },
  { stroke: '#2F54EB', name: 'Testing 9' },
  { stroke: '#52C41A', name: 'Testing 10' }
];

const getTargetCurve = (trialIdx) => {
  if (trialIdx < BASE_FINAL_CURVES.length) {
    return BASE_FINAL_CURVES[trialIdx];
  }
  const offset = (trialIdx - 9) * 0.6;
  return [0, 10.0 + offset, 18.5 + offset, 27.0 + offset, 39.0 + offset, 56.0 + offset, 61.0 + offset];
};

export default function TestingProcessPage({
  models,
  onNavigateToHistory,
  onSaveToHistory
}) {
  const chartRef = useRef(null);

  // Form State (No Trials count input as requested!)
  const [selectedModel, setSelectedModel] = useState('');
  const [speed, setSpeed] = useState('');
  const [stroke, setStroke] = useState('');
  const [angle, setAngle] = useState('');

  // 1-by-1 Testing State: Runs 1 trial per click of Start
  const [completedTrials, setCompletedTrials] = useState(0); // number of completed tests (0, 1, 2, ...)
  const [currentTrial, setCurrentTrial] = useState(0); // currently running test (0 = idle, 1, 2, ...)
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Realtime card metrics
  const [metrics, setMetrics] = useState({
    stroke: 0,
    load: 0,
    loadCompression: 0,
    loadForce: 0,
    frictionForce: 0
  });

  // Recorded curves array: each trial has 7 data points
  const [curves, setCurves] = useState(() => [[0, 0, 0, 0, 0, 0, 0]]);

  // Visibility state for each testing trial (true = visible/enabled, false = disabled)
  const [visibleTrials, setVisibleTrials] = useState(() => [true]);

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Validation Confirmation Modal State
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Toggle legend item visibility when legend is clicked
  const toggleTestVisibility = (index) => {
    setVisibleTrials((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  // Simulation runner effect - Runs single trial (1 per 1 per Start click)
  useEffect(() => {
    let intervalId = null;

    if (isRunning && currentTrial >= 1) {
      intervalId = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 5; // smooth step ~2 seconds per trial
          const ratio = Math.min(next / 100, 1);

          // Update metrics realistically for current trial
          const trialFactor = currentTrial;
          setMetrics({
            stroke: Math.round(55 * (0.85 + 0.02 * trialFactor) * ratio),
            load: Math.round(55 * (0.85 + 0.02 * trialFactor) * ratio),
            loadCompression: Math.round(58 * (0.85 + 0.02 * trialFactor) * ratio),
            loadForce: Math.round(59 * (0.85 + 0.02 * trialFactor) * ratio),
            frictionForce: Math.round(50 * (0.85 + 0.02 * trialFactor) * ratio)
          });

          // Incrementally draw current trial curve
          const targetFinal = getTargetCurve(currentTrial - 1);

          setCurves((prevCurves) => {
            const updated = [...prevCurves];
            updated[currentTrial - 1] = targetFinal.map((val) =>
              +(val * ratio).toFixed(1)
            );
            return updated;
          });

          if (next >= 100) {
            // Completed current trial!
            setIsRunning(false);
            setCompletedTrials(currentTrial);
            setMetrics({
              stroke: 55,
              load: 55,
              loadCompression: 58,
              loadForce: 59,
              frictionForce: 50
            });
            setToast({
              type: 'success',
              title: `Testing ${currentTrial} Completed`,
              message: `Testing ${currentTrial} successfully finished. Press Start again for Testing ${currentTrial + 1}, or click Done Testing to finish.`
            });
            return 100;
          }
          return next;
        });
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, currentTrial]);

  // Model and parameters are locked while testing for this product is in session
  const isModelLocked = isRunning || completedTrials > 0;

  // Model selection handler
  const handleModelChange = (val) => {
    setSelectedModel(val);
  };

  // Actions
  const handleStart = () => {
    if (!selectedModel) {
      setToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a Model first.'
      });
      return;
    }
    if (!speed) setSpeed('500');
    if (!stroke) setStroke('20');
    if (!angle) setAngle('45');

    // Run 1 by 1: Next trial number is completedTrials + 1
    const nextTrialNum = completedTrials + 1;
    setCurrentTrial(nextTrialNum);

    // Initialize or expand curves and visibility for this trial
    setCurves((prev) => {
      const next = [...prev];
      next[nextTrialNum - 1] = [0, 0, 0, 0, 0, 0, 0];
      return next;
    });

    setVisibleTrials((prev) => {
      const next = [...prev];
      next[nextTrialNum - 1] = true;
      return next;
    });

    setProgress(0);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentTrial(0);
    setCompletedTrials(0);
    setProgress(0);
    setSelectedModel('');
    setSpeed('');
    setStroke('');
    setAngle('');
    setMetrics({
      stroke: 0,
      load: 0,
      loadCompression: 0,
      loadForce: 0,
      frictionForce: 0
    });
    setCurves([[0, 0, 0, 0, 0, 0, 0]]);
    setVisibleTrials([true]);
    setToast({
      type: 'success',
      title: 'Form Reset',
      message: 'Testing parameters and chart curves have been reset.'
    });
  };

  // Trigger Validation Confirmation Modal when operator clicks "Done Testing"
  const handleDoneTestingClick = () => {
    if (isRunning) {
      setToast({
        type: 'error',
        title: 'Testing in Progress',
        message: 'Please wait until current testing cycle finishes.'
      });
      return;
    }

    if (!selectedModel) {
      setToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a Model first.'
      });
      return;
    }

    const hasData = completedTrials > 0 || curves[0].some((v) => v > 0);
    if (!hasData) {
      setToast({
        type: 'error',
        title: 'No Testing Data',
        message: 'Please run at least 1 testing cycle before clicking Done Testing.'
      });
      return;
    }

    // Open validation modal before saving
    setShowValidationModal(true);
  };

  // Confirmed in Validation Modal: Save to history, trigger PS5 achievement alert & sound, and reset
  const confirmDoneTesting = () => {
    setShowValidationModal(false);

    const recordedCount = Math.max(completedTrials, curves.length);

    const newRecord = {
      id: Date.now(),
      model: selectedModel,
      datetime:
        new Date().toLocaleDateString('en-GB') +
        ' ' +
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        }),
      speed: speed || 500,
      stroke: stroke || 20,
      angle: angle || 45,
      trialsCount: recordedCount,
      metrics: { ...metrics },
      chartData: {
        s1: [...(curves[0] || [])],
        s2: [...(curves[1] || [])],
        s3: [...(curves[2] || [])],
        s4: [...(curves[3] || [])],
        s5: [...(curves[4] || [])],
        trials: curves.slice(0, recordedCount).map((c) => [...c])
      }
    };

    onSaveToHistory(newRecord);

    const savedModelName = selectedModel;

    // Reset processing data immediately so operator is ready for next product
    setSelectedModel('');
    setSpeed('');
    setStroke('');
    setAngle('');
    setCompletedTrials(0);
    setCurrentTrial(0);
    setIsRunning(false);
    setProgress(0);
    setCurves([[0, 0, 0, 0, 0, 0, 0]]);
    setVisibleTrials([true]);
    setMetrics({
      stroke: 0,
      load: 0,
      loadCompression: 0,
      loadForce: 0,
      frictionForce: 0
    });

    setToast({
      type: 'success',
      title: 'Testing Completed & Saved to History',
      message: `Data pengujian ${savedModelName} (${recordedCount} siklus) telah berhasil disimpan ke History. Form dan grafik direset untuk pengujian berikutnya.`
    });
  };

  // 1. Save Graph with Solid White Background (reflects currently visible/toggled curves)
  const handleSaveGraph = () => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const { canvas } = chart;

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');

    // Fill background with solid white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the chart on top
    ctx.drawImage(canvas, 0, 0);

    const imageUri = tempCanvas.toDataURL('image/png', 1.0);

    const link = document.createElement('a');
    link.href = imageUri;
    link.download = `Testing_Graph_${selectedModel || 'ASTEMO'}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({
      type: 'success',
      title: 'Graph Downloaded',
      message: 'Chart image saved with white background as PNG.'
    });
  };

  // 2. Print Data - Opens modal
  const handlePrintData = () => {
    setShowPrintModal(true);
  };

  const handleExecutePrint = () => {
    window.print();
  };

  // 3. Export Excel - Reflects active/disabled tests (Only enabled tests are downloaded)
  const handleExportExcel = () => {
    const recordedCount = Math.max(completedTrials, curves.length);
    const hasData = completedTrials > 0 || curves[0].some((v) => v > 0);

    if (!hasData) {
      setToast({
        type: 'error',
        title: 'Export Warning',
        message: 'No completed testing data recorded yet. Please run testing first.'
      });
      return;
    }

    // Identify enabled trials based on legend visibility
    const enabledIndices = [];
    for (let i = 0; i < recordedCount; i++) {
      if (visibleTrials[i] !== false) {
        enabledIndices.push(i);
      }
    }

    if (enabledIndices.length === 0) {
      setToast({
        type: 'error',
        title: 'Export Warning',
        message: 'All testing trials are currently disabled in legend. Please enable at least one trial to export.'
      });
      return;
    }

    const activeNames = enabledIndices.map((i) => `Testing ${i + 1}`).join(', ');
    const disabledNames = [];
    for (let i = 0; i < recordedCount; i++) {
      if (visibleTrials[i] === false) {
        disabledNames.push(`Testing ${i + 1}`);
      }
    }

    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['ASTEMO - TESTING PROCESS REPORT'],
      ['Generated At', new Date().toLocaleString()],
      ['Model', selectedModel || 'SKA01-20-110'],
      ['Speed (mm/min)', speed || '500'],
      ['Stroke (mm)', stroke || '20'],
      ['Angle (deg)', angle || '45'],
      ['Total Trials Recorded', `${recordedCount} Trials (Data Testing 1 - ${recordedCount} Recorded)`],
      ['Exported Trials (Active)', activeNames],
      ['Excluded Trials (Disabled)', disabledNames.length > 0 ? disabledNames.join(', ') : 'None'],
      ['Status', completedTrials > 0 ? 'Completed' : 'Initial'],
      [],
      ['REALTIME PARAMETERS (FINAL)'],
      ['Stroke', metrics.stroke],
      ['Load', metrics.load],
      ['Load Compression', metrics.loadCompression],
      ['Load Force', metrics.loadForce],
      ['Friction Force', metrics.frictionForce],
      [],
      ['CHART READINGS DATA POINT (LOAD N vs STROKE mm)']
    ];

    // Table Header: ONLY includes Stroke (mm) and active/enabled tests!
    // E.g. If Testing 1 is disabled, only Testing 2, 3, 4, 5 columns appear
    const tableHeader = ['Stroke (mm)'];
    enabledIndices.forEach((idx) => {
      tableHeader.push(`Testing ${idx + 1} (N)`);
    });
    summaryData.push(tableHeader);

    // Data rows for each stroke point
    STROKE_LABELS.forEach((sVal, ptIdx) => {
      const row = [sVal];
      enabledIndices.forEach((idx) => {
        row.push(curves[idx]?.[ptIdx] || 0);
      });
      summaryData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Testing Report');

    XLSX.writeFile(
      wb,
      `Testing_Report_${selectedModel || 'ASTEMO'}_${Date.now()}.xlsx`
    );

    setToast({
      type: 'success',
      title: 'Excel Exported',
      message: `Downloaded active trials: ${activeNames}.${disabledNames.length > 0 ? ` (Excluded: ${disabledNames.join(', ')})` : ''}`
    });
  };

  // Chart datasets configuration
  const activeCount = Math.max(curves.length, completedTrials, currentTrial > 0 ? currentTrial : 1);
  const chartDatasets = curves.slice(0, activeCount).map((curveData, idx) => {
    const trialColor = TRIAL_COLORS[idx % TRIAL_COLORS.length] || { stroke: '#00A854' };
    const isVisible = visibleTrials[idx] !== false;
    return {
      label: `Testing ${idx + 1}`,
      data: curveData,
      borderColor: trialColor.stroke,
      backgroundColor: trialColor.stroke,
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 5,
      hidden: !isVisible
    };
  });

  const chartData = {
    labels: STROKE_LABELS,
    datasets: chartDatasets
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'bottom',
        cursor: 'pointer',
        onClick: (e, legendItem) => {
          const index = legendItem.datasetIndex;
          toggleTestVisibility(index);
        },
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          boxWidth: 8,
          boxHeight: 8,
          font: {
            size: 12,
            family: 'Inter, sans-serif'
          },
          color: '#475467'
        }
      },
      tooltip: {
        backgroundColor: '#1E232F',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 8,
        cornerRadius: 6
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Stroke (mm)',
          color: '#475467',
          font: { size: 12, weight: '500' }
        },
        grid: {
          display: false
        },
        ticks: {
          color: '#475467',
          font: { size: 11 }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Load (N)',
          color: '#475467',
          font: { size: 12, weight: '500' }
        },
        min: 0,
        max: 65,
        ticks: {
          stepSize: 10,
          color: '#475467',
          font: { size: 11 }
        },
        grid: {
          color: '#F2F4F7'
        }
      }
    }
  };

  return (
    <>
      {/* Fit 1 Page without Scroll on 1920x1080 */}
      <div className="h-[calc(100vh-72px-57px-3rem)] flex flex-col justify-between gap-4 max-h-[920px]">
        {/* Top Header Card matching all pages */}
        <PageHeaderCard
          title="Testing Process"
          subtitle="Realtime monitoring during product testing"
          action={
            <button
              onClick={onNavigateToHistory}
              className="flex items-center gap-2 px-4 py-2 bg-[#00A854] hover:bg-[#008C45] text-white font-medium rounded-lg text-sm transition-all shadow-sm active:scale-[0.98]"
            >
              <History className="w-4 h-4" />
              <span>History Testing</span>
            </button>
          }
        />

        {/* Main Grid: Left Form Card, Right Chart & Realtime Cards */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch min-h-0">
          {/* Left Column: Form & Action Buttons (4 cols) */}
          <div className="xl:col-span-4 bg-white rounded-xl border border-[#E4E7EC] p-4 shadow-sm flex flex-col justify-between overflow-y-auto max-h-full">
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-bold text-[#1E232F]">Product & Parameters</h2>
                <p className="text-[11px] text-gray-500">
                  Select model and start testing sequentially
                </p>
              </div>

              {/* Form Fields: Only Model, Speed, Stroke, Angle (No Trials Count Input) */}
              <div className="space-y-2.5">
                {/* Custom Model Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Model
                    </label>
                    {isModelLocked && (
                      <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        In Session (Locked)
                      </span>
                    )}
                  </div>
                  <CustomDropdown
                    value={selectedModel}
                    onChange={handleModelChange}
                    options={models}
                    placeholder="Select Model"
                    disabled={isModelLocked}
                    className="w-full"
                  />
                  {isModelLocked && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      Model locked during active testing. Click "Done Testing" to finish and select another model.
                    </p>
                  )}
                </div>

                {/* Speed */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Speed (mm/min)
                  </label>
                  <input
                    type="number"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    disabled={isModelLocked}
                    placeholder="Input parameter speed (e.g. 500)"
                    className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                {/* Stroke */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Stroke (mm)
                  </label>
                  <input
                    type="number"
                    value={stroke}
                    onChange={(e) => setStroke(e.target.value)}
                    disabled={isModelLocked}
                    placeholder="Input parameter stroke (e.g. 20)"
                    className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                {/* Angel / Angle */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Angel (deg)
                  </label>
                  <input
                    type="number"
                    value={angle}
                    onChange={(e) => setAngle(e.target.value)}
                    disabled={isModelLocked}
                    placeholder="Input parameter angel (e.g. 45)"
                    className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                {/* Reset, Start & Done Testing Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isRunning}
                    className="flex items-center justify-center gap-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg text-xs transition-all disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStart}
                    disabled={isRunning}
                    className="flex items-center justify-center gap-1 py-2.5 bg-[#00A854] hover:bg-[#008C45] text-white font-semibold rounded-lg text-xs transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isRunning ? 'Testing...' : 'Start'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDoneTestingClick}
                    disabled={isRunning || completedTrials === 0}
                    className="flex items-center justify-center gap-1 py-2.5 bg-[#1890FF] hover:bg-[#096DD9] text-white font-semibold rounded-lg text-xs transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="truncate">Done Testing</span>
                  </button>
                </div>

                {/* 1-by-1 Testing Status Indicator */}
                <div
                  className={`transition-all duration-200 overflow-hidden ${
                    isRunning || completedTrials > 0
                      ? 'max-h-24 opacity-100 mt-1'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800 space-y-1.5">
                    <div className="flex justify-between font-semibold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isRunning
                              ? 'bg-[#00A854] animate-pulse'
                              : 'bg-[#00A854]'
                          }`}
                        />
                        {isRunning
                          ? `Testing ${currentTrial} in progress...`
                          : `Testing ${completedTrials} Completed`}
                      </span>
                      <span>{progress}%</span>
                    </div>

                    {/* Progress Bar for Current Trial */}
                    <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#00A854] h-full transition-all duration-150"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Helper note for next trial */}
                    <p className="text-[10px] text-emerald-700 font-medium">
                      {isRunning
                        ? `Recording live curve data for Testing ${currentTrial}...`
                        : `Testing ${completedTrials} recorded. Press Start for Testing ${completedTrials + 1}, or click Done Testing to finish.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons: Save Graph and Print Data side-by-side, Export Excel underneath */}
            <div className="pt-2.5 border-t border-gray-100 flex flex-col gap-2 flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSaveGraph}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.99]"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                  <span>Save Graph</span>
                </button>

                <button
                  onClick={handlePrintData}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.99]"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-500" />
                  <span>Print Data</span>
                </button>
              </div>

              <button
                onClick={handleExportExcel}
                className="w-full flex items-center justify-center gap-2 py-2 px-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.99]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#107C41]" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Right Column: Chart & Realtime Cards (8 cols) */}
          <div className="xl:col-span-8 flex flex-col justify-between gap-4 min-h-0">
            {/* Testing Monitoring Chart Card (No toggle pill buttons, clean title & legend) */}
            <div className="bg-white rounded-xl border border-[#E4E7EC] p-4 xl:p-5 shadow-sm flex flex-col flex-1 min-h-0">
              <div className="mb-2">
                <h2 className="text-base font-bold text-[#1E232F]">
                  Testing Monitoring
                </h2>
                <p className="text-[11px] text-gray-500">
                  Monitor product testing performance in realtime. Click legend below to show/hide curves & export.
                </p>
              </div>

              {/* Chart Area */}
              <div className="w-full flex-1 min-h-[260px] relative">
                <Line ref={chartRef} data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Realtime Parameters Card below Chart */}
            <div className="bg-white rounded-xl border border-[#E4E7EC] px-4 py-3 shadow-sm flex-shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Stroke */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Stroke
                  </label>
                  <div className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-800 font-medium">
                    {metrics.stroke}
                  </div>
                </div>

                {/* Load */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Load
                  </label>
                  <div className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-800 font-medium">
                    {metrics.load}
                  </div>
                </div>

                {/* Load Compression */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Load Compression
                  </label>
                  <div className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-800 font-medium">
                    {metrics.loadCompression}
                  </div>
                </div>

                {/* Load Force */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Load Force
                  </label>
                  <div className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-800 font-medium">
                    {metrics.loadForce}
                  </div>
                </div>

                {/* Friction Force */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Friction Force
                  </label>
                  <div className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-800 font-medium">
                    {metrics.frictionForce}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Data Modal */}
      <ModalPortal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)}>
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 print:shadow-none print:p-0 print:border-none">
          <div className="flex items-start justify-between border-b border-gray-100 pb-3 print:hidden">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Print Testing Details: {selectedModel || 'SKA01-20-110'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Current active test parameters and measurement report ({completedTrials} Tests Completed)
              </p>
            </div>
            <button
              onClick={() => setShowPrintModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Test Parameters */}
          <div className="grid grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl text-xs">
            <div>
              <span className="text-gray-400">Speed:</span>{' '}
              <span className="font-semibold text-gray-800">
                {speed || 500} mm/min
              </span>
            </div>
            <div>
              <span className="text-gray-400">Stroke:</span>{' '}
              <span className="font-semibold text-gray-800">
                {stroke || 20} mm
              </span>
            </div>
            <div>
              <span className="text-gray-400">Angle:</span>{' '}
              <span className="font-semibold text-gray-800">
                {angle || 45} deg
              </span>
            </div>
            <div>
              <span className="text-gray-400">Tests Done:</span>{' '}
              <span className="font-semibold text-gray-800">
                {completedTrials} Cycles
              </span>
            </div>
          </div>

          {/* Realtime Parameters Snapshot */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">
              Realtime Parameters Snapshot
            </h4>
            <div className="grid grid-cols-5 gap-2.5 text-center text-xs">
              <div className="border border-gray-200 rounded-lg p-2 bg-[#FAFAFA]">
                <p className="text-[10px] text-gray-400">Stroke</p>
                <p className="font-bold text-gray-800 mt-0.5">{metrics.stroke}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-2 bg-[#FAFAFA]">
                <p className="text-[10px] text-gray-400">Load</p>
                <p className="font-bold text-gray-800 mt-0.5">{metrics.load}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-2 bg-[#FAFAFA]">
                <p className="text-[10px] text-gray-400">Compression</p>
                <p className="font-bold text-gray-800 mt-0.5">{metrics.loadCompression}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-2 bg-[#FAFAFA]">
                <p className="text-[10px] text-gray-400">Force</p>
                <p className="font-bold text-gray-800 mt-0.5">{metrics.loadForce}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-2 bg-[#FAFAFA]">
                <p className="text-[10px] text-gray-400">Friction</p>
                <p className="font-bold text-gray-800 mt-0.5">{metrics.frictionForce}</p>
              </div>
            </div>
          </div>

          {/* Testing Curves Chart Snapshot */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">
              Testing Curves (Active Toggled Curves)
            </h4>
            <div className="h-44 w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
            <button
              onClick={() => setShowPrintModal(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleExecutePrint}
              className="flex items-center gap-2 px-5 py-2 bg-[#00A854] hover:bg-[#008C45] text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now</span>
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Validation Confirmation Modal (Figma: Validasi Testing) */}
      <ModalPortal isOpen={showValidationModal} onClose={() => setShowValidationModal(false)}>
        <div className="bg-white rounded-xl max-w-[540px] w-full shadow-2xl overflow-hidden border border-[#EAECF0] animate-in fade-in zoom-in-95 duration-200">
          {/* 1. Header with bottom divider line */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-[#EAECF0]">
            <div>
              <h3 className="text-base font-bold text-[#101828]">
                Testing Validation
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                This field is for desc terms of service
              </p>
            </div>
            <button
              onClick={() => setShowValidationModal(false)}
              className="text-[#667085] hover:text-[#344054] p-1 -mr-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-4 flex flex-col gap-4">
            {/* Model */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#344054]">Model</span>
              <span className="font-bold text-[#101828]">{selectedModel || 'SKA01-20-110'}</span>
            </div>

            {/* Siklus Pengujian */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#344054]">Siklus Pengujian</span>
              <span className="font-bold text-[#101828]">
                {completedTrials > 0 ? `${completedTrials}x Pengujian` : '1x Pengujian'}
              </span>
            </div>

            {/* Parameter Pengujian */}
            <div>
              <p className="text-sm text-[#344054] mb-2">Parameter Pengujian</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-3 text-center bg-white">
                  <p className="text-xs text-[#344054]">Speed</p>
                  <p className="text-sm font-bold text-[#101828] mt-0.5">{speed || 500} mm/min</p>
                </div>
                <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-3 text-center bg-white">
                  <p className="text-xs text-[#344054]">Stroke</p>
                  <p className="text-sm font-bold text-[#101828] mt-0.5">{stroke || 20} mm</p>
                </div>
                <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-3 text-center bg-white">
                  <p className="text-xs text-[#344054]">Angle</p>
                  <p className="text-sm font-bold text-[#101828] mt-0.5">{angle || 45}°</p>
                </div>
              </div>
            </div>

            {/* 2. Line Pemisah antara Parameter Pengujian dan Hasil Pengujian */}
            <div className="border-t border-[#EAECF0]" />

            {/* Hasil Pengujian */}
            <div>
              <p className="text-sm text-[#344054] mb-2">Hasil Pengujian</p>
              <div className="grid grid-cols-5 gap-2.5">
                <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-1 text-center bg-white">
                  <p className="text-xs text-[#344054]">Stroke</p>
                  <p className="text-sm font-bold text-[#101828] mt-0.5">{metrics.stroke}</p>
                </div>
                <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-1 text-center bg-white">
                  <p className="text-xs text-[#344054]">Load</p>
                  <p className="text-sm font-bold text-[#101828] mt-0.5">{metrics.load}</p>
                </div>
                <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-1 text-center bg-white">
                  <p className="text-xs text-[#344054]">Compress</p>
                  <p className="text-sm font-bold text-[#101828] mt-0.5">{metrics.loadCompression}</p>
                </div>
                <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-1 text-center bg-white">
                  <p className="text-xs text-[#344054]">Force</p>
                  <p className="text-sm font-bold text-[#101828] mt-0.5">{metrics.loadForce}</p>
                </div>
                <div className="border border-[#D0D5DD] rounded-lg py-2.5 px-1 text-center bg-white">
                  <p className="text-xs text-[#344054]">Friction</p>
                  <p className="text-sm font-bold text-[#101828] mt-0.5">{metrics.frictionForce}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Footer with top divider line pemisah */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#EAECF0]">
            <button
              type="button"
              onClick={() => setShowValidationModal(false)}
              className="px-6 py-2 border border-[#D0D5DD] bg-white text-[#344054] hover:bg-gray-50 rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDoneTesting}
              className="px-7 py-2 bg-[#00A854] hover:bg-[#008C45] text-white rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              Save
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Toast via portal */}
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


