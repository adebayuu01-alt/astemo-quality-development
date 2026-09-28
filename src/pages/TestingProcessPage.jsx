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

// Vertical guideline plugin (Crosshair bar on hover as shown in Image 2)
const verticalLinePlugin = {
  id: 'verticalGuideline',
  afterDraw: (chart) => {
    if (chart.tooltip?._active?.length) {
      const activePoint = chart.tooltip._active[0];
      const dataIndex = activePoint.index;
      // Only draw guideline if at least one visible dataset has data at this dot index
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
      ctx.strokeStyle = '#B0E9CF'; // Green vertical guideline matching Figma mockup
      ctx.stroke();
      ctx.restore();
    }
  }
};

const STROKE_LABELS = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90];

// Realistic Hysteresis benchmark datasets matching machine monitor (0 - 90 mm, -100 to 1500 N)
const BASE_HYSTERESIS_TARGETS = [
  {
    // Testing 1 (Red) - directly modeled from actual machine curve in Image 2
    compression: [0, 160, 210, 250, 290, 330, 375, 425, 485, 560, 650, 760, 890, 1030, 1090, null],
    rebound: [0, 115, 160, 195, 230, 265, 305, 350, 400, 465, 540, 635, 750, 890, 1090, null]
  },
  {
    // Testing 2 (Blue)
    compression: [0, 170, 222, 265, 305, 348, 395, 448, 510, 588, 680, 795, 925, 1070, 1130, null],
    rebound: [0, 125, 170, 208, 245, 282, 322, 370, 422, 490, 568, 665, 782, 925, 1130, null]
  },
  {
    // Testing 3 (Green)
    compression: [0, 180, 235, 278, 320, 365, 412, 468, 532, 612, 708, 825, 958, 1105, 1165, null],
    rebound: [0, 135, 180, 220, 258, 295, 338, 388, 442, 512, 592, 692, 810, 958, 1165, null]
  },
  {
    // Testing 4 (Orange)
    compression: [0, 190, 248, 290, 335, 380, 428, 485, 550, 632, 730, 850, 985, 1135, 1195, null],
    rebound: [0, 142, 190, 232, 270, 308, 352, 405, 460, 530, 612, 715, 835, 985, 1195, null]
  },
  {
    // Testing 5 (Purple)
    compression: [0, 200, 260, 302, 348, 395, 445, 502, 570, 655, 755, 878, 1015, 1165, 1225, null],
    rebound: [0, 150, 200, 242, 282, 322, 368, 422, 480, 550, 635, 740, 865, 1015, 1225, null]
  },
  {
    // Testing 6 (Cyan)
    compression: [0, 210, 272, 315, 362, 410, 462, 520, 590, 678, 780, 905, 1045, 1195, 1255, null],
    rebound: [0, 158, 210, 252, 295, 335, 382, 438, 500, 572, 660, 765, 895, 1045, 1255, null]
  }
];

const TRIAL_COLORS = [
  '#FF4D4F', // Testing 1: Red
  '#1890FF', // Testing 2: Blue
  '#00A854', // Testing 3: Green
  '#FA8C16', // Testing 4: Orange
  '#722ED1', // Testing 5: Purple
  '#13C2C2', // Testing 6: Cyan
  '#EB2F96'  // Testing 7: Pink
];

const getTargetHysteresis = (trialIdx) => {
  if (trialIdx < BASE_HYSTERESIS_TARGETS.length) {
    return BASE_HYSTERESIS_TARGETS[trialIdx];
  }
  const offset = (trialIdx - 5) * 30;
  return {
    compression: [0, 210 + offset, 272 + offset, 315 + offset, 362 + offset, 410 + offset, 462 + offset, 520 + offset, 590 + offset, 678 + offset, 780 + offset, 905 + offset, 1045 + offset, 1195 + offset, 1255 + offset, null],
    rebound: [0, 158 + offset, 210 + offset, 252 + offset, 295 + offset, 335 + offset, 382 + offset, 438 + offset, 500 + offset, 572 + offset, 660 + offset, 765 + offset, 895 + offset, 1045 + offset, 1255 + offset, null]
  };
};

export default function TestingProcessPage({
  models,
  onNavigateToHistory,
  onSaveToHistory
}) {
  const chartRef = useRef(null);
  const tooltipRef = useRef(null);

  // Form State
  const [selectedModel, setSelectedModel] = useState('');
  const [speed, setSpeed] = useState('');
  const [stroke, setStroke] = useState('');
  const [angle, setAngle] = useState('');

  // 1-by-1 Testing State: Runs 1 trial per click of Start
  const [completedTrials, setCompletedTrials] = useState(0); // number of completed tests (0, 1, 2, ...)
  const [currentTrial, setCurrentTrial] = useState(0); // currently running test (0 = idle, 1, 2, ...)
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Recorded curves array: each trial has compression and rebound 16-point curves (up to 84-90 mm)
  const [curves, setCurves] = useState(() => [
    { compression: Array(16).fill(null), rebound: Array(16).fill(null) }
  ]);

  // Stored trial detail snapshots: Array of { trialNum, metrics }
  const [trialDetails, setTrialDetails] = useState([]);

  // Visibility state for each testing trial in legend (true = visible, false = disabled)
  const [visibleTrials, setVisibleTrials] = useState(() => [true]);

  // Selected trial number to view in Side Drawer (1, 2, ... or null)
  const [selectedDetailTrial, setSelectedDetailTrial] = useState(null);

  // Realtime card metrics
  const [metrics, setMetrics] = useState({
    stroke: 0,
    load: 0,
    loadCompression: 0,
    loadForce: 0,
    frictionForce: 0
  });

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Validation Confirmation Modal State
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Toggle legend item visibility when clicked
  const toggleTestVisibility = (index) => {
    setVisibleTrials((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  // Simulation runner effect: Incremental point-by-point (dot-by-dot) movement over ~10 seconds
  // Phase 1: Kompresi (Stroke 0 -> 84 mm, step 0 to 14)
  // Phase 2: Rebound (Stroke 84 -> 0 mm, step 15 to 28)
  useEffect(() => {
    let intervalId = null;

    if (isRunning && currentTrial >= 1) {
      const target = getTargetHysteresis(currentTrial - 1);
      let stepIdx = 0;

      // Start with first dot at stroke 0 mm for Compression
      setCurves((prevCurves) => {
        const updated = [...prevCurves];
        const initialTrial = {
          compression: Array(16).fill(null),
          rebound: Array(16).fill(null)
        };
        initialTrial.compression[0] = target.compression[0];
        updated[currentTrial - 1] = initialTrial;
        return updated;
      });

      setMetrics({
        stroke: STROKE_LABELS[0],
        load: target.compression[0],
        loadCompression: target.compression[0],
        loadForce: 0,
        frictionForce: 10
      });
      setProgress(0);

      // 28 steps across ~10 seconds (350ms per step = 9,800ms)
      intervalId = setInterval(() => {
        stepIdx += 1;

        if (stepIdx <= 14) {
          // Fase 1: Kompresi (Stroke 0 -> 6 -> 12 ... -> 84 mm)
          setCurves((prevCurves) => {
            const updated = [...prevCurves];
            const current = {
              compression: [...(updated[currentTrial - 1]?.compression || Array(16).fill(null))],
              rebound: [...(updated[currentTrial - 1]?.rebound || Array(16).fill(null))]
            };
            current.compression[stepIdx] = target.compression[stepIdx];
            if (stepIdx === 14) {
              // Peak turnaround point at stroke 84 mm meets compression and rebound
              current.rebound[14] = target.rebound[14];
            }
            updated[currentTrial - 1] = current;
            return updated;
          });

          const currentStroke = STROKE_LABELS[stepIdx];
          const currentLoad = target.compression[stepIdx];
          const pct = Math.round((stepIdx / 28) * 100);
          setProgress(pct);

          setMetrics({
            stroke: currentStroke,
            load: currentLoad,
            loadCompression: currentLoad,
            loadForce: Math.round(currentLoad * 0.8),
            frictionForce: Math.round(20 + stepIdx * 10)
          });
        } else if (stepIdx <= 28) {
          // Fase 2: Rebound (Stroke 84 -> 78 -> 72 ... -> 0 mm)
          const rebStrokeIdx = 28 - stepIdx; // when stepIdx=15 -> idx=13 (78mm), ..., when stepIdx=28 -> idx=0 (0mm)

          setCurves((prevCurves) => {
            const updated = [...prevCurves];
            const current = {
              compression: [...(updated[currentTrial - 1]?.compression || Array(16).fill(null))],
              rebound: [...(updated[currentTrial - 1]?.rebound || Array(16).fill(null))]
            };
            current.rebound[rebStrokeIdx] = target.rebound[rebStrokeIdx];
            updated[currentTrial - 1] = current;
            return updated;
          });

          const currentStroke = STROKE_LABELS[rebStrokeIdx];
          const currentLoad = target.rebound[rebStrokeIdx];
          const pct = Math.round((stepIdx / 28) * 100);
          setProgress(pct);

          setMetrics({
            stroke: currentStroke,
            load: currentLoad,
            loadCompression: target.compression[rebStrokeIdx],
            loadForce: currentLoad,
            frictionForce: Math.max(10, Math.round(target.compression[rebStrokeIdx] - currentLoad))
          });
        } else {
          // Completed all 28 steps!
          clearInterval(intervalId);
          setIsRunning(false);
          setProgress(100);
          setCompletedTrials(currentTrial);

          const finalMetrics = {
            stroke: 84,
            load: 1090,
            loadCompression: 1090,
            loadForce: 890,
            frictionForce: 200
          };

          setMetrics(finalMetrics);

          // Record this trial's exact metrics for the detail panel
          setTrialDetails((prev) => {
            const updated = [...prev];
            updated[currentTrial - 1] = {
              trialNum: currentTrial,
              metrics: finalMetrics
            };
            return updated;
          });

          setToast({
            type: 'success',
            title: `Testing ${currentTrial} Completed`,
            message: `Testing ${currentTrial} (Kompresi & Rebound) successfully finished. Press Start again for Testing ${currentTrial + 1}, or click Done Testing to finish.`
          });
        }
      }, 350); // 350ms per step * 28 steps = ~9.8 detik
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, currentTrial]);

  // Model and parameters are locked while testing is in session
  const isModelLocked = isRunning || completedTrials > 0;

  // Model selection handler
  const handleModelChange = (val) => {
    setSelectedModel(val);
  };

  // Start Action
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
    if (!stroke) setStroke('84');
    if (!angle) setAngle('45');

    const nextTrialNum = completedTrials + 1;
    setCurrentTrial(nextTrialNum);

    const target = getTargetHysteresis(nextTrialNum - 1);
    const initialTrial = {
      compression: Array(16).fill(null),
      rebound: Array(16).fill(null)
    };
    initialTrial.compression[0] = target.compression[0];

    // Initialize or expand curves and visibility for this trial with Dot 0
    setCurves((prev) => {
      const next = [...prev];
      next[nextTrialNum - 1] = initialTrial;
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

  // Reset Action
  const handleReset = () => {
    setIsRunning(false);
    setCurrentTrial(0);
    setCompletedTrials(0);
    setProgress(0);
    setSelectedModel('');
    setSpeed('');
    setStroke('');
    setAngle('');
    setTrialDetails([]);
    setSelectedDetailTrial(null);
    setMetrics({
      stroke: 0,
      load: 0,
      loadCompression: 0,
      loadForce: 0,
      frictionForce: 0
    });
    setCurves([{ compression: Array(16).fill(null), rebound: Array(16).fill(null) }]);
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

    const hasData = completedTrials > 0 || (
      curves[0]?.compression?.some((v) => v !== null && v > 0) ||
      curves[0]?.rebound?.some((v) => v !== null && v > 0)
    );
    if (!hasData) {
      setToast({
        type: 'error',
        title: 'No Testing Data',
        message: 'Please run at least 1 testing cycle before clicking Done Testing.'
      });
      return;
    }

    setShowValidationModal(true);
  };

  // Confirmed in Validation Modal
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
      stroke: stroke || 84,
      angle: angle || 45,
      trialsCount: recordedCount,
      metrics: { ...metrics },
      chartData: {
        compression: [...(curves[0]?.compression || [])].map((v) => v ?? 0),
        rebound: [...(curves[0]?.rebound || [])].map((v) => v ?? 0),
        s1: [...(curves[0]?.compression || [])].map((v) => v ?? 0),
        s2: [...(curves[0]?.rebound || [])].map((v) => v ?? 0),
        trials: curves.slice(0, recordedCount).map((c) => ({
          compression: [...(c.compression || [])].map((v) => v ?? 0),
          rebound: [...(c.rebound || [])].map((v) => v ?? 0)
        }))
      }
    };

    onSaveToHistory(newRecord);

    const savedModelName = selectedModel;

    // Reset processing data immediately for next product
    setSelectedModel('');
    setSpeed('');
    setStroke('');
    setAngle('');
    setCompletedTrials(0);
    setCurrentTrial(0);
    setIsRunning(false);
    setProgress(0);
    setTrialDetails([]);
    setSelectedDetailTrial(null);
    setCurves([{ compression: Array(16).fill(null), rebound: Array(16).fill(null) }]);
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
      message: `Data pengujian ${savedModelName} (${recordedCount} siklus) telah berhasil disimpan ke History.`
    });
  };

  // Save Graph with Solid White Background as PNG
  const handleSaveGraph = () => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const { canvas } = chart;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
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

  // Print Data - Opens modal
  const handlePrintData = () => {
    setShowPrintModal(true);
  };

  const handleExecutePrint = () => {
    window.print();
  };

  // Export Excel
  const handleExportExcel = () => {
    const recordedCount = Math.max(completedTrials, curves.length);
    const hasData = completedTrials > 0 || (
      curves[0]?.compression?.some((v) => v !== null && v > 0) ||
      curves[0]?.rebound?.some((v) => v !== null && v > 0)
    );

    if (!hasData) {
      setToast({
        type: 'error',
        title: 'Export Warning',
        message: 'No completed testing data recorded yet. Please run testing first.'
      });
      return;
    }

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
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['ASTEMO - TESTING PROCESS REPORT'],
      ['Generated At', new Date().toLocaleString()],
      ['Model', selectedModel || 'SKA01-20-110'],
      ['Speed (mm/min)', speed || '500'],
      ['Stroke (mm)', stroke || '20'],
      ['Angle (deg)', angle || '45'],
      ['Total Trials Recorded', `${recordedCount} Trials`],
      ['Exported Trials (Active)', activeNames],
      ['Status', completedTrials > 0 ? 'Completed' : 'Running'],
      [],
      ['REALTIME PARAMETERS (FINAL)'],
      ['Stroke (mm)', metrics.stroke],
      ['Load (N)', metrics.load],
      ['Load Compression (N)', metrics.loadCompression],
      ['Load Force (N)', metrics.loadForce],
      ['Friction Force (N)', metrics.frictionForce],
      [],
      ['CHART READINGS DATA POINT (LOAD N vs STROKE mm)']
    ];

    const tableHeader = ['Stroke (mm)'];
    enabledIndices.forEach((idx) => {
      tableHeader.push(`Testing ${idx + 1} Kompresi (N)`);
      tableHeader.push(`Testing ${idx + 1} Rebound (N)`);
    });
    summaryData.push(tableHeader);

    STROKE_LABELS.forEach((sVal, ptIdx) => {
      const row = [sVal];
      enabledIndices.forEach((idx) => {
        const compVal = curves[idx]?.compression?.[ptIdx];
        const rebVal = curves[idx]?.rebound?.[ptIdx];
        row.push(compVal !== null && compVal !== undefined ? compVal : 0);
        row.push(rebVal !== null && rebVal !== undefined ? rebVal : 0);
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
      message: `Downloaded active trials: ${activeNames}.`
    });
  };

  // Chart datasets configuration with dual-phase hysteresis curves (Compression & Rebound, same color per trial)
  const activeCount = Math.max(curves.length, completedTrials, currentTrial > 0 ? currentTrial : 1);
  const chartDatasets = [];

  for (let i = 0; i < activeCount; i++) {
    const trialData = curves[i] || { compression: Array(16).fill(null), rebound: Array(16).fill(null) };
    const trialColor = TRIAL_COLORS[i % TRIAL_COLORS.length] || '#00A854';
    const isVisible = visibleTrials[i] !== false;

    // 1. Compression Curve (Kompresi) for Trial i
    chartDatasets.push({
      label: `Testing ${i + 1} (Kompresi)`,
      data: trialData.compression,
      borderColor: trialColor,
      backgroundColor: trialColor,
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: trialColor,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      spanGaps: false,
      hidden: !isVisible,
      trialIndex: i
    });

    // 2. Rebound Curve (Rebound) for Trial i (same color per session matching machine photo)
    chartDatasets.push({
      label: `Testing ${i + 1} (Rebound)`,
      data: trialData.rebound,
      borderColor: trialColor,
      backgroundColor: trialColor,
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: trialColor,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      spanGaps: false,
      hidden: !isVisible,
      trialIndex: i
    });
  }

  const chartData = {
    labels: STROKE_LABELS,
    datasets: chartDatasets
  };

  // Custom Tooltip HTML matching Image 1 & 2 (White card, Testing Value header, reads all bars)
  const customTooltipHandler = (context) => {
    const { chart, tooltip } = context;
    const tooltipEl = tooltipRef.current;
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
        // Skip null or unreached readings
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

    // Revision 2: Adaptive positioning - when cursor is on the rightmost data (near right boundary),
    // position tooltip to the LEFT of the crosshair/point so all data & numbers remain 100% visible
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'index',
      intersect: false // Reads all datasets in that vertical bar together
    },
    plugins: {
      legend: {
        position: 'bottom',
        cursor: 'pointer',
        onClick: (e, legendItem) => {
          const trialIndex = legendItem.datasetIndex;
          toggleTestVisibility(trialIndex);
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
        enabled: false, // Use custom HTML tooltip matching Figma Image 2
        external: customTooltipHandler
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
          font: { size: 11 }
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

  // Get active trial metrics for Image 1 Side Drawer
  const activeDetailData = selectedDetailTrial
    ? trialDetails[selectedDetailTrial - 1]?.metrics || {
      stroke: 84,
      load: 1090,
      loadCompression: 1090,
      loadForce: 890,
      frictionForce: 200
    }
    : null;

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
                <h2 className="text-base font-bold text-[#1E232F]">Product</h2>
                <p className="text-[11px] text-gray-500">
                  Select the product want to test
                </p>
              </div>

              {/* Form Fields: Model, Speed, Stroke, Angle */}
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
                    Angle (deg)
                  </label>
                  <input
                    type="number"
                    value={angle}
                    onChange={(e) => setAngle(e.target.value)}
                    disabled={isModelLocked}
                    placeholder="Input parameter angle (e.g. 45)"
                    className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                {/* Reset, Start & Done Testing Buttons */}
                <div className="grid grid-cols-3 gap-3 pt-1.5">
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

                {/* Clean Progress Bar Indicator (Button detail sesi di kiri sudah dihapus sesuai revisi 1) */}
                <div
                  className={`transition-all duration-200 overflow-hidden ${isRunning || completedTrials > 0
                    ? 'max-h-24 opacity-100 mt-1'
                    : 'max-h-0 opacity-0'
                    }`}
                >
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800 space-y-1.5">
                    <div className="flex justify-between font-semibold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${isRunning
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
                        className="bg-[#00A854] h-full transition-all duration-300 ease-linear"
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

            {/* Bottom Action Buttons */}
            <div className="pt-2.5 border-t border-gray-100 flex flex-col gap-3 flex-shrink-0">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSaveGraph}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.99]"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                  <span>Save Graph.</span>
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
            {/* Testing Monitoring Chart Card */}
            <div className="bg-white rounded-xl border border-[#E4E7EC] p-4 xl:p-5 shadow-sm flex flex-col flex-1 min-h-0 relative">
              <div className="mb-2 flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#1E232F]">
                    Testing Monitoring
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Monitor product testing performance in realtime
                  </p>
                </div>

                {/* Revision 1: Button detail sesi diletakkan di section chart */}
                {completedTrials > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Array.from({ length: completedTrials }, (_, i) => i + 1).map((trialNum) => {
                      const color = TRIAL_COLORS[(trialNum - 1) % TRIAL_COLORS.length];
                      return (
                        <button
                          key={trialNum}
                          type="button"
                          onClick={() => setSelectedDetailTrial(trialNum)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold bg-white hover:bg-gray-50 transition-all border-gray-200 shadow-xs hover:border-gray-300 active:scale-[0.98]"
                          title={`Buka detail nilai Testing ${trialNum}`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-gray-800">Detail Testing {trialNum}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chart Area with floating custom tooltip */}
              <div className="w-full flex-1 min-h-[320px] xl:min-h-[380px] relative">
                <Line
                  ref={chartRef}
                  data={chartData}
                  options={chartOptions}
                  plugins={[verticalLinePlugin]}
                />

                {/* Floating Custom Tooltip Container matching Image 1 & 2 */}
                <div
                  ref={tooltipRef}
                  className="pointer-events-none absolute z-20 bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 shadow-lg transition-all duration-75 opacity-0 min-w-[140px] whitespace-nowrap"
                  style={{
                    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06)'
                  }}
                />
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

      {/* Revision 3: Side Drawer Detail Testing persis seperti Image 1 */}
      <ModalPortal isOpen={selectedDetailTrial !== null} onClose={() => setSelectedDetailTrial(null)}>
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity"
            onClick={() => setSelectedDetailTrial(null)}
          />

          {/* Drawer Container (400px - 440px) */}
          <div className="relative w-full max-w-[420px] bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#EAECF0] animate-in slide-in-from-right duration-300">
            {/* 1. Header (Detail Testing X, Model) */}
            <div className="px-6 py-5 border-b border-[#EAECF0] flex items-start justify-between bg-white flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#101828]">
                  Detail Testing {selectedDetailTrial}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Model: {selectedModel || 'SKA01-20-110'}
                </p>
              </div>

              <button
                onClick={() => setSelectedDetailTrial(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 -mr-1 rounded-lg hover:bg-gray-100 transition-colors"
                title="Tutup Panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Body: Stroke, Load, Load Compression, Load Force, Friction Force persis seperti Image 1 */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Row 1: Stroke & Load (2 columns) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Stroke
                  </label>
                  <div className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg bg-white text-sm text-gray-800 font-normal">
                    {activeDetailData?.stroke ?? 55}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Load
                  </label>
                  <div className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg bg-white text-sm text-gray-800 font-normal">
                    {activeDetailData?.load ?? 55}
                  </div>
                </div>
              </div>

              {/* Row 2: Load Compression & Load Force (2 columns) */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Load Compression
                  </label>
                  <div className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg bg-white text-sm text-gray-800 font-normal">
                    {activeDetailData?.loadCompression ?? 58}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Load Force
                  </label>
                  <div className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg bg-white text-sm text-gray-800 font-normal">
                    {activeDetailData?.loadForce ?? 59}
                  </div>
                </div>
              </div>

              {/* Row 3: Friction Force (full width) */}
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                  Friction Force
                </label>
                <div className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg bg-white text-sm text-gray-800 font-normal">
                  {activeDetailData?.frictionForce ?? 50}
                </div>
              </div>
            </div>

            {/* 3. Footer: Tombol Tutup Panel Hijau di Kanan Bawah persis seperti Image 1 */}
            <div className="px-6 py-4 border-t border-[#EAECF0] bg-white flex items-center justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDetailTrial(null)}
                className="px-6 py-2.5 bg-[#00A854] hover:bg-[#008C45] text-white font-medium rounded-lg text-sm transition-all shadow-sm active:scale-[0.98]"
              >
                Tutup Panel
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

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
          {/* Header */}
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

            {/* Line Pemisah */}
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

          {/* Footer */}
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
