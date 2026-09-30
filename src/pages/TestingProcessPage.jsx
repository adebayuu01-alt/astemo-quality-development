import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  History,
  RotateCcw,
  Play,
  CheckCircle,
  Image as ImageIcon,
  Printer,
  FileSpreadsheet,
  X,
  MinusCircle,
  PlusCircle
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

// Vertical guideline plugin (Crosshair bar on hover)
const verticalLinePlugin = {
  id: 'verticalGuideline',
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
      ctx.strokeStyle = '#B0E9CF';
      ctx.stroke();
      ctx.restore();
    }
  }
};

const STROKE_LABELS = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90];

// Machine curve colors: Kompresi (Menekan Shock) = Merah, Tensi (Menarik Shock) = Ungu
const COMPRESSION_COLOR = '#EF4444'; // Red (Kompresi)
const TENSION_COLOR = '#7C3AED';     // Purple (Tensi)

// Plugin: Menggambar kurva transisi dari puncak Kompresi (merah) ke awal Tensi (ungu) di titik balik stroke maksimal
const transitionLinePlugin = {
  id: 'transitionLine',
  afterDatasetsDraw: (chart) => {
    const datasets = chart.data.datasets;
    if (!datasets || datasets.length < 2) return;

    // Cari dataset Kompresi dan Tensi
    const compIdx = datasets.findIndex((ds) => ds.isCompression || ds.label === 'Compression');
    const tensIdx = datasets.findIndex((ds) => ds.isTension || ds.label === 'Tension');
    if (compIdx === -1 || tensIdx === -1) return;

    if (!chart.isDatasetVisible(compIdx) || !chart.isDatasetVisible(tensIdx)) return;

    const compMeta = chart.getDatasetMeta(compIdx);
    const tensMeta = chart.getDatasetMeta(tensIdx);
    if (!compMeta?.data?.length || !tensMeta?.data?.length) return;

    // Cari index titik terjauh (stroke maksimal) yang sudah memiliki data kompresi
    let peakIdx = -1;
    for (let i = STROKE_LABELS.length - 1; i >= 0; i--) {
      const val = datasets[compIdx].data?.[i];
      if (val !== null && val !== undefined) {
        peakIdx = i;
        break;
      }
    }

    if (peakIdx === -1) return;

    // Hanya gambar garis transisi jika titik transisi/tensi sudah tercapai
    const tensVal = datasets[tensIdx].data?.[peakIdx];
    if (tensVal === null || tensVal === undefined) return;

    const ptComp = compMeta.data[peakIdx];
    const ptTens = tensMeta.data[peakIdx];
    if (!ptComp || ptComp.skip || !ptTens || ptTens.skip) return;

    const x1 = ptComp.x;
    const y1 = ptComp.y;
    const x2 = ptTens.x;
    const y2 = ptTens.y;

    const ctx = chart.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);

    // Lengkungan transisi keluar ke kanan (bulge) seperti pada mesin aktual / gambar referensi
    const dy = y2 - y1;
    const bulge = Math.max(5, Math.min(12, Math.abs(dy) * 0.14));

    const ctrlX1 = x1 + bulge;
    const ctrlY1 = y1 + dy * 0.25;
    const ctrlX2 = x2 + bulge;
    const ctrlY2 = y2 - dy * 0.25;

    ctx.bezierCurveTo(ctrlX1, ctrlY1, ctrlX2, ctrlY2, x2, y2);

    // Gradien mulus dari Merah (Kompresi) ke Ungu (Tensi)
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, '#EF4444');
    grad.addColorStop(0.35, '#E11D48');
    grad.addColorStop(0.7, '#8B5CF6');
    grad.addColorStop(1, '#7C3AED');

    ctx.strokeStyle = grad;
    ctx.lineWidth = datasets[compIdx].borderWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }
};

// Realistic Hysteresis benchmark datasets matching machine monitor (0 - 90 mm, -100 to 1500 N)
const BASE_HYSTERESIS_TARGETS = [
  {
    compression: [0, 160, 210, 250, 290, 330, 375, 425, 485, 560, 650, 760, 890, 1030, 1090, null],
    rebound: [0, 115, 160, 195, 230, 265, 305, 350, 400, 465, 540, 635, 750, 890, 890, null]
  },
  {
    compression: [0, 170, 222, 265, 305, 348, 395, 448, 510, 588, 680, 795, 925, 1070, 1130, null],
    rebound: [0, 125, 170, 208, 245, 282, 322, 370, 422, 490, 568, 665, 782, 925, 925, null]
  },
  {
    compression: [0, 180, 235, 278, 320, 365, 412, 468, 532, 612, 708, 825, 958, 1105, 1165, null],
    rebound: [0, 135, 180, 220, 258, 295, 338, 388, 442, 512, 592, 692, 810, 958, 958, null]
  },
  {
    compression: [0, 190, 248, 290, 335, 380, 428, 485, 550, 632, 730, 850, 985, 1135, 1195, null],
    rebound: [0, 142, 190, 232, 270, 308, 352, 405, 460, 530, 612, 715, 835, 985, 985, null]
  },
  {
    compression: [0, 200, 260, 302, 348, 395, 445, 502, 570, 655, 755, 878, 1015, 1165, 1225, null],
    rebound: [0, 150, 200, 242, 282, 322, 368, 422, 480, 550, 635, 740, 865, 1015, 1015, null]
  },
  {
    compression: [0, 210, 272, 315, 362, 410, 462, 520, 590, 678, 780, 905, 1045, 1195, 1255, null],
    rebound: [0, 158, 210, 252, 295, 335, 382, 438, 500, 572, 660, 765, 895, 1045, 1045, null]
  }
];

const WARMUP_COLORS = [
  '#FA8C16', // Amber / Orange
  '#722ED1', // Purple
  '#1890FF', // Blue
  '#13C2C2', // Cyan
  '#EB2F96', // Pink
  '#FAAD14', // Gold
  '#2F54EB'  // Indigo
];
const ACTUAL_TEST_COLOR = '#00A854'; // Astemo Emerald Green

const getCycleInfo = (cycleIdx, totalWarmUps) => {
  if (cycleIdx < totalWarmUps) {
    return {
      name: `Warming Up ${cycleIdx + 1}`,
      isWarmUp: true,
      color: WARMUP_COLORS[cycleIdx % WARMUP_COLORS.length]
    };
  }
  return {
    name: 'Testing',
    isWarmUp: false,
    color: ACTUAL_TEST_COLOR
  };
};

const getTargetHysteresis = (trialIdx) => {
  if (trialIdx < BASE_HYSTERESIS_TARGETS.length) {
    return BASE_HYSTERESIS_TARGETS[trialIdx];
  }
  const offset = (trialIdx - 5) * 30;
  return {
    compression: [0, 210 + offset, 272 + offset, 315 + offset, 362 + offset, 410 + offset, 462 + offset, 520 + offset, 590 + offset, 678 + offset, 780 + offset, 905 + offset, 1045 + offset, 1195 + offset, 1255 + offset, null],
    rebound: [0, 158 + offset, 210 + offset, 252 + offset, 295 + offset, 335 + offset, 382 + offset, 438 + offset, 500 + offset, 572 + offset, 660 + offset, 765 + offset, 895 + offset, 1045 + offset, 1045 + offset, null]
  };
};

// Helper: Calculate compression, tension, and friction force for a given stroke
const calculateStrokeLoads = (inputStrokeVal, trialIdx = 0) => {
  const parsed = parseFloat(inputStrokeVal);
  if (isNaN(parsed) || parsed <= 0) {
    return { compression: 0, tension: 0, friction: 0 };
  }

  const target = getTargetHysteresis(trialIdx);
  const clampedStroke = Math.min(84, Math.max(0, parsed));

  const stepSize = 6;
  const lowerIndex = Math.floor(clampedStroke / stepSize);
  const upperIndex = Math.min(lowerIndex + 1, 14);
  const ratio = (clampedStroke - lowerIndex * stepSize) / stepSize;

  const cLow = target.compression[lowerIndex] ?? 0;
  const cHigh = target.compression[upperIndex] ?? cLow;
  const compVal = Math.round(cLow + (cHigh - cLow) * ratio);

  const tLow = target.rebound[lowerIndex] ?? 0;
  const tHigh = target.rebound[upperIndex] ?? tLow;
  const tensionVal = Math.round(tLow + (tHigh - tLow) * ratio);

  const frictionVal = Math.abs(compVal - tensionVal);

  return {
    compression: compVal,
    tension: tensionVal,
    friction: frictionVal
  };
};

export default function TestingProcessPage({
  models,
  currentUser,
  plcConnected = true,
  onNavigateToHistory,
  onSaveToHistory
}) {
  const chartRef = useRef(null);
  const tooltipRef = useRef(null);

  // Role permissions check
  const isOperator =
    currentUser?.role === 'Operator' ||
    currentUser?.username === 'suep_astemo' ||
    currentUser?.idCard === 'AST-OP-002';

  // Form State - initially empty so inputs only display placeholder
  const [selectedModel, setSelectedModel] = useState('');
  const [speed, setSpeed] = useState('');
  const [stroke, setStroke] = useState('');
  const [angle, setAngle] = useState('');
  const [warmingUpCount, setWarmingUpCount] = useState('');

  // Cycle Management: Warming Up cycles + 1 Testing cycle
  const [currentCycle, setCurrentCycle] = useState(0); // 0 ... targetWarmUps
  const [completedCycles, setCompletedCycles] = useState(0);
  const [actualTestCompleted, setActualTestCompleted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Chart Zoom State (Image 2: Zoom in, Zoom out, Reset Zoom)
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Cycles data array: [{ index, name, isWarmUp, color, compression: [], rebound: [], metrics: {} }]
  const [cycles, setCycles] = useState([]);
  const [visibleCycles, setVisibleCycles] = useState([]);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Realtime card metrics
  const [metrics, setMetrics] = useState({
    stroke: 0,
    load: 0,
    loadCompression: 0,
    loadForce: 0,
    frictionForce: 0
  });

  // Print Preview & Validation Modal States
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Toggle cycle visibility on chart legend click
  const toggleCycleVisibility = (index) => {
    setVisibleCycles((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(3.0, +(prev + 0.35).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(1.0, +(prev - 0.35).toFixed(2)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  // Memoize computedLoads so it does NOT cause unnecessary re-renders
  const computedLoads = useMemo(() => {
    if (completedCycles > 0 || isRunning || actualTestCompleted) {
      return calculateStrokeLoads(stroke || 84.5, Math.max(0, currentCycle));
    }
    return { compression: 0, tension: 0, friction: 0 };
  }, [completedCycles, isRunning, actualTestCompleted, stroke, currentCycle]);

  // Stable refs for values used inside interval completion
  const strokeValRef = useRef(stroke);
  strokeValRef.current = stroke;
  const warmingUpCountRef = useRef(warmingUpCount);
  warmingUpCountRef.current = warmingUpCount;

  // Simulation runner effect - Steps through Warming Up 1..N and the 1x actual test
  useEffect(() => {
    let intervalId = null;

    if (isRunning) {
      const targetWarmUps = Math.max(1, parseInt(warmingUpCountRef.current) || 1);
      const target = getTargetHysteresis(currentCycle);
      let stepIdx = 0;

      // Start with first dot at stroke 0 mm for Compression
      setCycles((prev) => {
        const next = [...prev];
        if (!next[currentCycle]) return prev;
        const current = { ...next[currentCycle] };
        current.compression = [...current.compression];
        current.rebound = [...current.rebound];
        current.compression[0] = target.compression[0];
        next[currentCycle] = current;
        return next;
      });

      setMetrics({
        stroke: STROKE_LABELS[0],
        load: target.compression[0],
        loadCompression: target.compression[0],
        loadForce: 0,
        frictionForce: 10
      });
      setProgress(0);

      // Simulation steps (160ms per step = ~4.5s per cycle)
      intervalId = setInterval(() => {
        stepIdx += 1;

        if (stepIdx <= 14) {
          // Phase 1: Kompresi (Stroke 0 -> 84 mm)
          const currentStroke = STROKE_LABELS[stepIdx];
          const currentLoad = target.compression[stepIdx];
          const pct = Math.round((stepIdx / 28) * 100);

          setCycles((prev) => {
            const next = [...prev];
            if (!next[currentCycle]) return prev;
            const current = { ...next[currentCycle] };
            current.compression = [...current.compression];
            current.compression[stepIdx] = currentLoad;
            if (stepIdx === 14) {
              current.rebound = [...current.rebound];
              current.rebound[14] = target.rebound[14];
            }
            next[currentCycle] = current;
            return next;
          });

          setProgress(pct);
          setMetrics((prev) => ({
            ...prev,
            stroke: currentStroke,
            load: currentLoad,
            loadCompression: currentLoad,
            loadForce: Math.round(currentLoad * 0.8),
            frictionForce: Math.round(20 + stepIdx * 10)
          }));
        } else if (stepIdx <= 28) {
          // Phase 2: Tension / Rebound (Stroke 84 -> 0 mm)
          const rebStrokeIdx = 28 - stepIdx;
          const currentStroke = STROKE_LABELS[rebStrokeIdx];
          const currentLoad = target.rebound[rebStrokeIdx];
          const pct = Math.round((stepIdx / 28) * 100);

          setCycles((prev) => {
            const next = [...prev];
            if (!next[currentCycle]) return prev;
            const current = { ...next[currentCycle] };
            current.rebound = [...current.rebound];
            current.rebound[rebStrokeIdx] = currentLoad;
            next[currentCycle] = current;
            return next;
          });

          setProgress(pct);
          setMetrics((prev) => ({
            ...prev,
            stroke: currentStroke,
            load: currentLoad,
            loadCompression: target.compression[rebStrokeIdx],
            loadForce: currentLoad,
            frictionForce: Math.max(10, Math.round(target.compression[rebStrokeIdx] - currentLoad))
          }));
        } else {
          // Cycle completed
          clearInterval(intervalId);
          setIsRunning(false);
          setProgress(100);

          const finalStroke = parseFloat(strokeValRef.current) || 84.5;
          const loads = calculateStrokeLoads(finalStroke, currentCycle);
          const finalCycleMetrics = {
            stroke: finalStroke,
            load: target.compression[14] || 1090,
            loadCompression: loads.compression,
            loadForce: loads.tension,
            frictionForce: loads.friction
          };

          setMetrics(finalCycleMetrics);

          // Update metrics in this cycle
          setCycles((prev) => {
            const next = [...prev];
            if (next[currentCycle]) {
              next[currentCycle] = {
                ...next[currentCycle],
                metrics: finalCycleMetrics
              };
            }
            return next;
          });

          const finishedCount = currentCycle + 1;
          setCompletedCycles(finishedCount);

          if (currentCycle < targetWarmUps - 1) {
            // Still in warming up phase, proceed to next warming up cycle
            const nextCycleIdx = currentCycle + 1;
            setToast({
              type: 'info',
              title: `Warming Up (${currentCycle + 1}/${targetWarmUps}) Selesai`,
              message: `Melanjutkan siklus warming up ke-${nextCycleIdx + 1}...`
            });

            setTimeout(() => {
              setCurrentCycle(nextCycleIdx);
              setProgress(0);
              setIsRunning(true);
            }, 600);
          } else if (currentCycle === targetWarmUps - 1) {
            // All warming ups finished! Now trigger the 1x actual test
            const actualTestIdx = targetWarmUps;
            setToast({
              type: 'success',
              title: 'Warming Up Selesai',
              message: `Tahap warming up (${targetWarmUps}x) selesai. Memulai 1x pengujian aktual (Testing)...`
            });

            setTimeout(() => {
              setCurrentCycle(actualTestIdx);
              setProgress(0);
              setIsRunning(true);
            }, 800);
          } else {
            // Actual 1-time test has finished!
            setActualTestCompleted(true);
            setToast({
              type: 'success',
              title: 'Testing Selesai',
              message: `Pengujian aktual berhasil selesai direkam (1x testing setelah warming up). Klik "Done Testing" untuk menyimpan data ke History.`
            });
          }
        }
      }, 160);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, currentCycle]);

  const isModelLocked = isRunning || completedCycles > 0 || actualTestCompleted;

  // Model selection handler - Operator Suep only selects model, auto fills parameters
  const handleModelChange = (val) => {
    setSelectedModel(val);
    const found = models.find((m) => m.model === val);
    if (found) {
      setSpeed(found.speed !== undefined ? String(found.speed) : '500');
      setStroke(found.stroke !== undefined ? String(found.stroke) : '84.5');
      setAngle(found.angle !== undefined ? String(found.angle) : '45');
    }
  };

  // Start Action
  const handleStart = () => {
    if (!plcConnected) {
      setToast({
        type: 'error',
        title: 'PLC Disconnected',
        message: 'Koneksi PLC terputus dari mesin. Pastikan status PLC Connected sebelum memulai pengujian.'
      });
      return;
    }

    if (!selectedModel) {
      setToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Silakan pilih Model produk terlebih dahulu.'
      });
      return;
    }

    // Requirement 2: Warming Up merupakan field yang harus diisi, jika tidak diisi maka tidak bisa testing
    const parsedWarmUps = parseInt(warmingUpCount);
    if (!warmingUpCount || isNaN(parsedWarmUps) || parsedWarmUps < 1) {
      setToast({
        type: 'error',
        title: 'Warming Up Wajib Diisi',
        message: 'Warming Up Count merupakan field yang harus diisi (minimal 1) sebelum dapat melakukan testing.'
      });
      return;
    }

    // Requirement 1: Testing hanya bisa sekali saja setelah warming up
    if (actualTestCompleted) {
      setToast({
        type: 'info',
        title: 'Testing Sudah Selesai',
        message: 'Testing hanya bisa dilakukan satu kali setelah warming up. Silakan klik "Done Testing" untuk menyimpan data ke History.'
      });
      return;
    }

    if (!speed) setSpeed('500');
    if (!stroke) setStroke('84.5');
    if (!angle) setAngle('45');

    const totalWarmUps = parsedWarmUps;
    const totalCycles = totalWarmUps + 1; // Warming Up 1..N + 1x Testing

    // Initialize all cycle objects
    const initialCycles = [];
    const initialVisible = [];
    for (let i = 0; i < totalCycles; i++) {
      const info = getCycleInfo(i, totalWarmUps);
      const target = getTargetHysteresis(i);
      const cycleObj = {
        index: i,
        name: info.name,
        isWarmUp: info.isWarmUp,
        color: info.color,
        compression: Array(16).fill(null),
        rebound: Array(16).fill(null),
        metrics: null
      };
      if (i === 0) {
        cycleObj.compression[0] = target.compression[0];
      }
      initialCycles.push(cycleObj);
      initialVisible.push(true);
    }

    setCycles(initialCycles);
    setVisibleCycles(initialVisible);
    setCurrentCycle(0);
    setCompletedCycles(0);
    setActualTestCompleted(false);
    setProgress(0);
    setIsRunning(true);

    setToast({
      type: 'info',
      title: 'Proses Pengujian Dimulai',
      message: `System akan merekam ${totalWarmUps} siklus warming up dan 1x pengujian aktual (Testing).`
    });
  };

  // Reset Action
  const handleReset = () => {
    setIsRunning(false);
    setCurrentCycle(0);
    setCompletedCycles(0);
    setActualTestCompleted(false);
    setProgress(0);
    setSelectedModel('');
    setSpeed('');
    setStroke('');
    setAngle('');
    setWarmingUpCount('');
    setZoomLevel(1.0);
    setShowDetailPanel(false);
    setCycles([]);
    setVisibleCycles([]);
    setMetrics({
      stroke: 0,
      load: 0,
      loadCompression: 0,
      loadForce: 0,
      frictionForce: 0
    });
    setToast({
      type: 'success',
      title: 'Form Reset',
      message: 'Parameter dan kurva pengujian telah direset.'
    });
  };

  // Done Testing confirmation modal trigger
  const handleDoneTestingClick = () => {
    if (isRunning) {
      setToast({
        type: 'error',
        title: 'Pengujian Sedang Berjalan',
        message: 'Harap tunggu hingga proses pengujian saat ini selesai.'
      });
      return;
    }

    if (!selectedModel) {
      setToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Silakan pilih Model terlebih dahulu.'
      });
      return;
    }

    if (!actualTestCompleted && completedCycles === 0) {
      setToast({
        type: 'error',
        title: 'Belum Ada Data Pengujian',
        message: 'Harap selesaikan pemanasan (warming up) dan pengujian aktual sebelum menyimpan.'
      });
      return;
    }

    setShowValidationModal(true);
  };

  // Confirm save to history
  const confirmDoneTesting = () => {
    setShowValidationModal(false);

    const warmUpsNum = parseInt(warmingUpCount) || 1;
    const actualTestCycle = cycles[warmUpsNum] || cycles[cycles.length - 1] || {
      compression: Array(16).fill(0),
      rebound: Array(16).fill(0)
    };

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
      stroke: stroke || 84.5,
      angle: angle || 45,
      warmingUpCount: warmUpsNum,
      trialsCount: 1, // Only 1 actual test after warming up!
      metrics: {
        stroke: parseFloat(stroke) || 84.5,
        load: metrics.load || 1090,
        loadCompression: computedLoads.compression,
        loadForce: computedLoads.tension,
        frictionForce: computedLoads.friction
      },
      chartData: {
        compression: [...(actualTestCycle.compression || [])].map((v) => v ?? 0),
        rebound: [...(actualTestCycle.rebound || [])].map((v) => v ?? 0),
        cycles: cycles.map((c) => ({
          name: c.name,
          isWarmUp: c.isWarmUp,
          color: c.color,
          compression: [...(c.compression || [])].map((v) => v ?? 0),
          rebound: [...(c.rebound || [])].map((v) => v ?? 0),
          metrics: c.metrics
        })),
        trials: [
          {
            compression: [...(actualTestCycle.compression || [])].map((v) => v ?? 0),
            rebound: [...(actualTestCycle.rebound || [])].map((v) => v ?? 0)
          }
        ]
      }
    };

    onSaveToHistory(newRecord);

    const savedModelName = selectedModel;

    // Reset processing data for next product
    setSelectedModel('');
    setSpeed('');
    setStroke('');
    setAngle('');
    setWarmingUpCount('');
    setCurrentCycle(0);
    setCompletedCycles(0);
    setIsRunning(false);
    setActualTestCompleted(false);
    setProgress(0);
    setZoomLevel(1.0);
    setShowDetailPanel(false);
    setCycles([]);
    setVisibleCycles([]);
    setMetrics({
      stroke: 0,
      load: 0,
      loadCompression: 0,
      loadForce: 0,
      frictionForce: 0
    });

    setToast({
      type: 'success',
      title: 'Data Pengujian Tersimpan',
      message: `Data pengujian aktual ${savedModelName} (setelah ${warmUpsNum}x warming up) telah berhasil disimpan ke History.`
    });
  };

  // Save Graph as PNG
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

  // Print Data
  const handlePrintData = () => {
    setShowPrintModal(true);
  };

  const handleExecutePrint = () => {
    window.print();
  };

  // Export Excel
  const handleExportExcel = () => {
    const hasData = completedCycles > 0 || actualTestCompleted;

    if (!hasData) {
      setToast({
        type: 'error',
        title: 'Export Warning',
        message: 'Belum ada data pengujian aktual yang selesai direkam.'
      });
      return;
    }

    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['ASTEMO - TESTING PROCESS REPORT'],
      ['Generated At', new Date().toLocaleString()],
      ['Model', selectedModel || 'SKA01-20-110'],
      ['Speed (mm/min)', speed || '500'],
      ['Stroke (mm)', stroke || '84.5'],
      ['Angle (deg)', angle || '45'],
      ['Warming Up Count', warmingUpCount || '1'],
      ['Status', 'Completed (1x Testing after Warming Up)'],
      [],
      ['PARAMETER HASIL PENGUJIAN AKTUAL'],
      ['Stroke (mm)', stroke || '84.5'],
      ['Load (N)', metrics.load],
      ['Load (N) Compression', computedLoads.compression],
      ['Load (N) Tension', computedLoads.tension],
      ['Friction Force (N)', computedLoads.friction],
      [],
      ['CHART READINGS DATA POINT (LOAD N vs STROKE mm)']
    ];

    const headerRow = ['Stroke (mm)'];
    cycles.forEach((c) => {
      headerRow.push(`${c.name} - Compression (N)`);
      headerRow.push(`${c.name} - Tension (N)`);
    });
    summaryData.push(headerRow);

    STROKE_LABELS.forEach((sVal, ptIdx) => {
      const row = [sVal];
      cycles.forEach((c) => {
        row.push(c.compression?.[ptIdx] ?? 0);
        row.push(c.rebound?.[ptIdx] ?? 0);
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
      message: `Laporan pengujian ${selectedModel || 'ASTEMO'} berhasil di-export.`
    });
  };

  // Chart datasets configuration:
  // Requirement: Proses warming up tetap ada dan berjalan.
  // Namun setelah warming up selesai, line chart warming up dihilangkan dari grafik (hanya kurva Testing aktual yang tampil),
  // sedangkan counting-nya tetap ada dan datanya tetap masuk/tersimpan dalam sistem.
  const targetWarmUps = Math.max(1, parseInt(warmingUpCount) || 1);
  const isWarmingUpFinished = currentCycle >= targetWarmUps || actualTestCompleted;
  const chartDatasets = [];

  if (cycles.length === 0) {
    // State awal sebelum pengujian dimulai: sediakan placeholder kurva Testing agar sumbu grafik ter-render rapi
    chartDatasets.push({
      label: 'Compression',
      data: Array(16).fill(null),
      borderColor: COMPRESSION_COLOR,
      backgroundColor: COMPRESSION_COLOR,
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: COMPRESSION_COLOR,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      spanGaps: false,
      hidden: false,
      cycleIndex: 0,
      isCompression: true
    });
    chartDatasets.push({
      label: 'Tension',
      data: Array(16).fill(null),
      borderColor: TENSION_COLOR,
      backgroundColor: TENSION_COLOR,
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: TENSION_COLOR,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      spanGaps: false,
      hidden: false,
      cycleIndex: 0,
      isTension: true
    });
  } else {
    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];
      if (!cycle) continue;

      const isWarmUp = cycle.isWarmUp !== undefined ? cycle.isWarmUp : i < targetWarmUps;

      // Setelah warming up selesai, hilangkan line chart warming up dari grafik
      if (isWarmingUpFinished && isWarmUp) {
        continue;
      }

      // Selama tahap warming up berjalan, tampilkan siklus warming up yang aktif/sedang berproses
      if (!isWarmingUpFinished && isWarmUp && i !== currentCycle) {
        continue;
      }

      const isVisible = visibleCycles[i] !== false;
      const compColor = COMPRESSION_COLOR;
      const tensColor = TENSION_COLOR;

      // 1. Compression Curve (Menekan Shock - Garis Merah)
      chartDatasets.push({
        label: `Compression`,
        data: cycle.compression,
        borderColor: compColor,
        backgroundColor: compColor,
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: compColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        spanGaps: false,
        hidden: !isVisible,
        cycleIndex: i,
        isCompression: true
      });

      // 2. Tension Curve (Menarik Shock - Garis Ungu)
      chartDatasets.push({
        label: `Tension`,
        data: cycle.rebound,
        borderColor: tensColor,
        backgroundColor: tensColor,
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: tensColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        spanGaps: false,
        hidden: !isVisible,
        cycleIndex: i,
        isTension: true
      });
    }
  }

  const chartData = {
    labels: STROKE_LABELS,
    datasets: chartDatasets
  };

  // Custom Tooltip HTML with updated naming Compression (data saat naik) & Tension (data saat turun)
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
        if (dp.raw === null || dp.raw === undefined) return;

        hasValidPoints = true;
        const dataset = chart.data.datasets[dp.datasetIndex];
        const color = dataset.borderColor;
        const fullLabel = dataset.label || '';
        const val = dp.formattedValue;

        innerHtml += `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; white-space: nowrap;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; flex-shrink: 0;"></span>
              <span style="font-size: 11px; color: #475467; font-weight: 500;">${fullLabel}</span>
            </div>
            <span style="font-size: 11px; color: #101828; font-weight: 700; margin-left: 8px;">${val}</span>
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

  // Zoom bounds calculation
  const xSpan = 90 / zoomLevel;
  const xMin = Math.max(0, 45 - xSpan / 2);
  const xMax = Math.min(90, 45 + xSpan / 2);

  const yCenter = 700;
  const ySpan = 1600 / zoomLevel;
  const yMin = Math.round(yCenter - ySpan / 2);
  const yMax = Math.round(yCenter + ySpan / 2);

  const chartOptions = {
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
          const dsIdx = legendItem.datasetIndex;
          if (chart.data.datasets[dsIdx]) {
            const isVisible = chart.isDatasetVisible(dsIdx);
            chart.setDatasetVisibility(dsIdx, !isVisible);
            chart.update();
          }
        },
        labels: {
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((ds, idx) => ({
              text: ds.label || (idx === 0 ? 'Compression' : 'Tension'),
              fillStyle: ds.borderColor,
              strokeStyle: ds.borderColor,
              lineWidth: 1,
              hidden: !chart.isDatasetVisible(idx),
              datasetIndex: idx
            }));
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
        enabled: false,
        external: customTooltipHandler
      }
    },
    scales: {
      x: {
        min: 0,
        max: 90,
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
        min: -100,
        max: 1500,
        title: {
          display: true,
          text: 'Force (N)',
          color: '#4C4E67',
          font: { size: 12, weight: '500' }
        },
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

  const isWarmUpFilled = warmingUpCount !== '' && parseInt(warmingUpCount) >= 1;
  const isStartDisabled = isRunning || !plcConnected || !isWarmUpFilled || actualTestCompleted;
  const hasProcess = isRunning || completedCycles > 0 || actualTestCompleted;

  const warmUpCycles = cycles.filter((c) => c.isWarmUp);
  const actualTestCycle = cycles.find((c) => !c.isWarmUp);
  const warmUpsCount = Math.max(
    warmUpCycles.length,
    Math.max(2, parseInt(warmingUpCount) || 2)
  );

  // Nilai parameter tampilan depan (Front monitoring display)
  const frontMetrics = {
    stroke: hasProcess ? (parseFloat(stroke) || metrics.stroke || 0) : 0,
    load: metrics.load || 0,
    loadCompression: computedLoads.compression || 0,
    loadForce: computedLoads.tension || 0,
    frictionForce: computedLoads.friction || 0
  };

  // Nilai Hasil Testing di dalam panel:
  // - Ketika tidak ada proses: nilainya 0
  // - Ketika ada proses: mengikuti data pengujian aktual / tampilan depan
  const actualTestMetrics = (() => {
    if (!hasProcess) {
      return { stroke: 0, load: 0, loadCompression: 0, loadForce: 0, frictionForce: 0 };
    }
    if (actualTestCycle?.metrics) {
      return actualTestCycle.metrics;
    }
    if (isRunning && currentCycle >= targetWarmUps) {
      return frontMetrics;
    }
    return { stroke: 0, load: 0, loadCompression: 0, loadForce: 0, frictionForce: 0 };
  })();

  return (
    <>
      <div className="h-[calc(100vh-72px-57px-3rem)] flex flex-col justify-between gap-4 max-h-[920px]">
        {/* Top Header Card */}
        <PageHeaderCard
          title="Testing Process"
          subtitle="Realtime monitoring during product testing"
          action={
            !isOperator && (
              <button
                onClick={onNavigateToHistory}
                className="flex items-center gap-2 px-4 py-2 bg-[#00A854] hover:bg-[#008C45] text-white font-medium rounded-lg text-sm transition-all shadow-sm active:scale-[0.98]"
              >
                <History className="w-4 h-4" />
                <span>History Testing</span>
              </button>
            )
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
                  Select product and configure parameters
                </p>
              </div>

              {/* Form Fields: Model, Speed, Stroke, Angle, Warming Up Count */}
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
                      Model terkunci selama proses pengujian aktif. Klik "Done Testing" untuk selesai.
                    </p>
                  )}
                </div>

                {/* Speed (mm/min) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Speed (mm/min)
                  </label>
                  <input
                    type="number"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    disabled={isModelLocked || isOperator}
                    placeholder="Input parameter speed (e.g. 500)"
                    className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                {/* Stroke (mm) - Decimal Support (Strictly uses Inter font) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Stroke (mm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={stroke}
                    onChange={(e) => setStroke(e.target.value)}
                    disabled={isModelLocked || isOperator}
                    placeholder="Input parameter stroke (e.g. 20)"
                    className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                {/* Angle (deg) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Angle (deg)
                  </label>
                  <input
                    type="number"
                    value={angle}
                    onChange={(e) => setAngle(e.target.value)}
                    disabled={isModelLocked || isOperator}
                    placeholder="Input parameter angle (e.g. 45)"
                    className="w-full px-3 py-2 border border-[#D0D5DD] rounded-md text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                {/* Warming Up Count - Simple input field with required asterisk only */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Warming Up Count <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={warmingUpCount}
                    onChange={(e) => setWarmingUpCount(e.target.value)}
                    disabled={isModelLocked || isOperator}
                    placeholder="Input parameter warming up (e.g. 3)"
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
                    disabled={isStartDisabled}
                    className={`flex items-center justify-center gap-1 py-2.5 text-white font-semibold rounded-lg text-xs transition-all shadow-sm active:scale-[0.98] ${isStartDisabled
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#00A854] hover:bg-[#008C45]'
                      }`}
                    title={
                      !plcConnected
                        ? 'PLC Disconnected. Sambungkan PLC terlebih dahulu.'
                        : !isWarmUpFilled
                          ? 'Warming Up Count wajib diisi (minimal 1) untuk memulai testing.'
                          : actualTestCompleted
                            ? 'Testing hanya bisa dilakukan satu kali setelah warming up.'
                            : isRunning
                              ? 'Proses pengujian sedang berjalan...'
                              : 'Mulai Pengujian'
                    }
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>
                      {isRunning
                        ? currentCycle < (parseInt(warmingUpCount) || 1)
                          ? `Warming Up ${currentCycle + 1}...`
                          : 'Testing...'
                        : actualTestCompleted
                          ? 'Testing Selesai'
                          : 'Start'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDoneTestingClick}
                    disabled={isRunning || (!actualTestCompleted && completedCycles === 0)}
                    className="flex items-center justify-center gap-1 py-2.5 bg-[#1890FF] hover:bg-[#096DD9] text-white font-semibold rounded-lg text-xs transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="truncate">Done Testing</span>
                  </button>
                </div>

                {/* Clean Progress Bar Indicator */}
                <div
                  className={`transition-all duration-200 overflow-hidden ${isRunning || completedCycles > 0 || actualTestCompleted
                    ? 'max-h-28 opacity-100 mt-1'
                    : 'max-h-0 opacity-0'
                    }`}
                >
                  <div
                    className={`rounded-lg p-2.5 text-xs space-y-1.5 border ${isRunning && currentCycle < (parseInt(warmingUpCount) || 1)
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                  >
                    <div className="flex justify-between font-semibold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${isRunning
                            ? 'animate-pulse ' +
                            (currentCycle < (parseInt(warmingUpCount) || 1)
                              ? 'bg-amber-500'
                              : 'bg-[#00A854]')
                            : 'bg-[#00A854]'
                            }`}
                        />
                        {isRunning
                          ? currentCycle < (parseInt(warmingUpCount) || 1)
                            ? `Warming Up (${currentCycle + 1}/${parseInt(warmingUpCount) || 1}) in progress...`
                            : `Testing Aktual in progress (Warming Up ${parseInt(warmingUpCount) || 1}x Selesai)...`
                          : actualTestCompleted
                            ? `Testing Selesai (Warming Up ${parseInt(warmingUpCount) || 1}x)`
                            : `Warming Up Selesai (${parseInt(warmingUpCount) || 1}x)`}
                      </span>
                      <span>{progress}%</span>
                    </div>

                    <div
                      className={`w-full h-1.5 rounded-full overflow-hidden ${isRunning && currentCycle < (parseInt(warmingUpCount) || 1)
                        ? 'bg-amber-200'
                        : 'bg-emerald-200'
                        }`}
                    >
                      <div
                        className={`h-full transition-all duration-200 ease-linear ${isRunning && currentCycle < (parseInt(warmingUpCount) || 1)
                          ? 'bg-amber-500'
                          : 'bg-[#00A854]'
                          }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <p
                      className={`text-[10px] font-medium ${isRunning && currentCycle < (parseInt(warmingUpCount) || 1)
                        ? 'text-amber-800'
                        : 'text-emerald-700'
                        }`}
                    >
                      {isRunning
                        ? currentCycle < (parseInt(warmingUpCount) || 1)
                          ? `Mesin sedang melakukan proses Warming Up siklus ke-${currentCycle + 1} dari ${parseInt(warmingUpCount) || 1}...`
                          : progress <= 50
                            ? 'Proses Kompresi: Menekan shock absorber pada mesin friction (garis merah)...'
                            : progress <= 54
                              ? 'Transisi Kompresi ke Tensi di titik balik stroke maksimal...'
                              : 'Proses Tensi: Menarik shock absorber kembali ke posisi awal (garis ungu)...'
                        : actualTestCompleted
                          ? `Data pengujian aktual telah terekam (1x testing setelah ${parseInt(warmingUpCount) || 1}x warming up). Data warming up tersimpan. Klik "Done Testing" untuk menyimpan.`
                          : `Data pengujian aktual telah terekam. Klik Done Testing untuk menyimpan.`}
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
              {/* Header with Title and Zoom Controls (Image 2) */}
              <div className="mb-2 flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#1E232F]">
                      Testing Monitoring
                    </h2>
                    {zoomLevel > 1.0 && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                        Zoom {zoomLevel}x
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {isWarmingUpFinished
                      ? `Monitor product testing performance in realtime`
                      : 'Monitor product testing performance in realtime'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Zoom Controls exact match to Image 1: Reset (RotateCcw), Zoom Out (MinusCircle), Zoom In (PlusCircle) */}
                  <div className="flex items-center gap-1 text-gray-500">
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 1.0}
                      className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                      title="Zoom Out"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 3.0}
                      className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                      title="Zoom In"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Single Unified Detail Button matching Image 1 */}
                  <button
                    type="button"
                    onClick={() => setShowDetailPanel(true)}
                    className="px-5 py-2 bg-[#00A854] hover:bg-[#008C45] text-white font-semibold rounded-lg text-xs sm:text-sm transition-all shadow-sm active:scale-[0.98]"
                  >
                    Detail
                  </button>
                </div>
              </div>

              {/* Chart Area with scrollbar when data/zoom is larger than normal */}
              <div className="w-full flex-1 min-h-[300px] xl:min-h-[360px] overflow-x-auto overflow-y-hidden relative chart-scrollbar rounded-lg pb-1">
                <div
                  className="h-full min-h-[300px] xl:min-h-[360px] relative transition-all duration-150"
                  style={{
                    width: zoomLevel > 1.0 ? `${Math.round(zoomLevel * 100)}%` : '100%',
                    minWidth: zoomLevel > 1.0 ? `${Math.round(zoomLevel * 720)}px` : '100%'
                  }}
                >
                  <Line
                    ref={chartRef}
                    data={chartData}
                    options={chartOptions}
                    plugins={[verticalLinePlugin, transitionLinePlugin]}
                  />

                  {/* Floating Custom Tooltip Container */}
                  <div
                    ref={tooltipRef}
                    className="pointer-events-none absolute z-20 bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 shadow-lg transition-all duration-75 opacity-0 min-w-[140px] whitespace-nowrap"
                    style={{
                      boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Realtime Parameters Card below Chart (Image 1) */}
            <div className="bg-white rounded-xl border border-[#E4E7EC] px-4 py-3 shadow-sm flex-shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* 1. Stroke (Data yang diinputkan di sebelah kiri) */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Stroke
                  </label>
                  <div className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-800 font-medium">
                    {hasProcess ? (stroke || 0) : 0}
                  </div>
                </div>

                {/* 2. Load */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Load
                  </label>
                  <div className="w-full px-3 py-1.5 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm text-gray-800 font-medium">
                    {metrics.load || 0}
                  </div>
                </div>

                {/* 3. Load (N) Compression: fill red-50, stroke red-500 (Image 1) */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Load (N) Compression
                  </label>
                  <div className="w-full px-3 py-1.5 border border-red-500 rounded-lg bg-red-50 text-sm text-gray-800 font-medium">
                    {computedLoads.compression}
                  </div>
                </div>

                {/* 4. Load (N) Tension: fill purple-50, stroke purple-500 (Image 1) */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Load (N) Tension
                  </label>
                  <div className="w-full px-3 py-1.5 border border-purple-500 rounded-lg bg-purple-50 text-sm text-gray-800 font-medium">
                    {computedLoads.tension}
                  </div>
                </div>

                {/* 5. Friction Force (N): fill green-50, stroke green-500 (Image 1) */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Friction Force (N)
                  </label>
                  <div className="w-full px-3 py-1.5 border border-green-500 rounded-lg bg-green-50 text-sm text-gray-800 font-medium">
                    {computedLoads.friction}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Drawer Detail Testing Panel (Image 2) */}
      <ModalPortal isOpen={showDetailPanel} onClose={() => setShowDetailPanel(false)}>
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity"
            onClick={() => setShowDetailPanel(false)}
          />

          <div className="relative w-full max-w-[420px] bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#EAECF0] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-[#EAECF0] flex items-start justify-between bg-white flex-shrink-0">
              <div>
                <h3 className="text-xs font-bold text-[#101828]">
                  Detail Testing
                </h3>
                <p className="text-[11px] text-[#475467] mt-0.5">
                  Model: {selectedModel || 'SKA01-20-110'}
                </p>
              </div>

              <button
                onClick={() => setShowDetailPanel(false)}
                className="text-gray-400 hover:text-gray-600 p-1 -mr-1 rounded-lg hover:bg-gray-100 transition-colors"
                title="Tutup Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body matching Image 2 */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3.5">
              {/* 1. Hasil Testing Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#101828]">Hasil Testing</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#344054] mb-1">
                      Stroke
                    </label>
                    <div className="w-full px-3 py-1.5 border border-[#D0D5DD] rounded-md bg-white text-xs text-gray-800">
                      {actualTestMetrics.stroke}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#344054] mb-1">
                      Load
                    </label>
                    <div className="w-full px-3 py-1.5 border border-[#D0D5DD] rounded-md bg-white text-xs text-gray-800">
                      {actualTestMetrics.load}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#344054] mb-1">
                      Load (N) Compression
                    </label>
                    <div className="w-full px-3 py-1.5 border border-red-400 bg-[#FEF3F2] rounded-md text-xs text-gray-800 font-medium">
                      {actualTestMetrics.loadCompression}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#344054] mb-1">
                      Load (N) Tension
                    </label>
                    <div className="w-full px-3 py-1.5 border border-purple-400 bg-[#F9F5FF] rounded-md text-xs text-gray-800 font-medium">
                      {actualTestMetrics.loadForce}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#344054] mb-1">
                    Friction Force (N)
                  </label>
                  <div className="w-full px-3 py-1.5 border border-green-500 bg-[#ECFDF3] rounded-md text-xs text-gray-800 font-medium">
                    {actualTestMetrics.frictionForce}
                  </div>
                </div>
              </div>

              {/* Divider between Hasil Testing and Warming Up */}
              <div className="border-t border-[#EAECF0]" />

              {/* 2. Warming Up Sections (Warming Up 1, Warming Up 2, ...) */}
              {Array.from({ length: warmUpsCount }).map((_, idx) => {
                const wuCycle = warmUpCycles[idx];
                let wuMetrics = { stroke: 0, load: 0, loadCompression: 0, loadForce: 0, frictionForce: 0 };

                if (hasProcess) {
                  if (wuCycle?.metrics) {
                    wuMetrics = wuCycle.metrics;
                  } else if (isRunning && currentCycle === idx) {
                    wuMetrics = frontMetrics;
                  }
                }

                return (
                  <React.Fragment key={idx}>
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#101828]">Warming Up {idx + 1}</h4>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#344054] mb-1">
                            Stroke
                          </label>
                          <div className="w-full px-3 py-1.5 border border-[#D0D5DD] rounded-md bg-white text-xs text-gray-800">
                            {wuMetrics.stroke}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#344054] mb-1">
                            Load
                          </label>
                          <div className="w-full px-3 py-1.5 border border-[#D0D5DD] rounded-md bg-white text-xs text-gray-800">
                            {wuMetrics.load}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#344054] mb-1">
                            Load (N) Compression
                          </label>
                          <div className="w-full px-3 py-1.5 border border-red-400 bg-[#FEF3F2] rounded-md text-xs text-gray-800 font-medium">
                            {wuMetrics.loadCompression}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#344054] mb-1">
                            Load (N) Tension
                          </label>
                          <div className="w-full px-3 py-1.5 border border-purple-400 bg-[#F9F5FF] rounded-md text-xs text-gray-800 font-medium">
                            {wuMetrics.loadForce}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#344054] mb-1">
                          Friction Force (N)
                        </label>
                        <div className="w-full px-3 py-1.5 border border-green-500 bg-[#ECFDF3] rounded-md text-xs text-gray-800 font-medium">
                          {wuMetrics.frictionForce}
                        </div>
                      </div>
                    </div>
                    {idx < warmUpsCount - 1 && <div className="border-t border-[#EAECF0]" />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Footer matching Image 2 */}
            <div className="px-5 py-3.5 border-t border-[#EAECF0] bg-white flex items-center justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowDetailPanel(false)}
                className="px-5 py-2 bg-[#00A854] hover:bg-[#008C45] text-white font-semibold rounded-lg text-xs transition-all shadow-sm active:scale-[0.98]"
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
                Laporan parameter dan pengukuran aktual pengujian
              </p>
            </div>
            <button
              onClick={() => setShowPrintModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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
                {stroke || 84.5} mm
              </span>
            </div>
            <div>
              <span className="text-gray-400">Angle:</span>{' '}
              <span className="font-semibold text-gray-800">
                {angle || 45} deg
              </span>
            </div>
            <div>
              <span className="text-gray-400">Warm Up:</span>{' '}
              <span className="font-semibold text-gray-800">
                {warmingUpCount || 0}x
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">
              Parameter Pengujian (Final)
            </h4>
            <div className="grid grid-cols-5 gap-2.5 text-center text-xs">
              <div className="border border-gray-200 rounded-lg p-2 bg-[#FAFAFA]">
                <p className="text-[10px] text-gray-400">Stroke</p>
                <p className="font-bold text-gray-800 mt-0.5">{stroke || 84.5}</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-2 bg-[#FAFAFA]">
                <p className="text-[10px] text-gray-400">Load</p>
                <p className="font-bold text-gray-800 mt-0.5">{metrics.load}</p>
              </div>
              <div className="border border-red-500 rounded-lg p-2 bg-red-50">
                <p className="text-[10px] text-red-600">Compression</p>
                <p className="font-bold text-gray-800 mt-0.5">{computedLoads.compression}</p>
              </div>
              <div className="border border-purple-500 rounded-lg p-2 bg-purple-50">
                <p className="text-[10px] text-purple-600">Tension</p>
                <p className="font-bold text-gray-800 mt-0.5">{computedLoads.tension}</p>
              </div>
              <div className="border border-green-500 rounded-lg p-2 bg-green-50">
                <p className="text-[10px] text-green-600">Friction</p>
                <p className="font-bold text-gray-800 mt-0.5">{computedLoads.friction}</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">
              Kurva Pengujian (Compression & Tension)
            </h4>
            <div className="h-44 w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

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

      {/* Validation Confirmation Modal */}
      <ModalPortal isOpen={showValidationModal} onClose={() => setShowValidationModal(false)}>
        <div className="bg-white rounded-xl max-w-[540px] w-full shadow-2xl overflow-hidden border border-[#EAECF0] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between px-6 py-4 border-b border-[#EAECF0]">
            <div>
              <h3 className="text-base font-bold text-[#101828]">
                Validasi Hasil Pengujian
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Konfirmasi data pengujian aktual untuk disimpan ke riwayat
              </p>
            </div>
            <button
              onClick={() => setShowValidationModal(false)}
              className="text-[#667085] hover:text-[#344054] p-1 -mr-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#344054]">Model</span>
              <span className="font-bold text-[#101828]">{selectedModel || 'SKA01-20-110'}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[#344054]">Tahap Pengujian</span>
              <span className="font-bold text-emerald-700">
                Pengambilan Data Aktual {warmingUpCount && parseInt(warmingUpCount) > 0 ? `(Setelah ${warmingUpCount}x Warming Up)` : ''}
              </span>
            </div>

            <div>
              <p className="text-sm text-[#344054] mb-2">Parameter Pengujian</p>
              <div className="grid grid-cols-4 gap-2.5">
                <div className="border border-[#D0D5DD] rounded-lg py-2 px-2 text-center bg-white">
                  <p className="text-[11px] text-[#344054]">Speed</p>
                  <p className="text-xs font-bold text-[#101828] mt-0.5">{speed || 500} mm/m</p>
                </div>
                <div className="border border-[#D0D5DD] rounded-lg py-2 px-2 text-center bg-white">
                  <p className="text-[11px] text-[#344054]">Stroke</p>
                  <p className="text-xs font-bold text-[#101828] mt-0.5">{stroke || 84.5} mm</p>
                </div>
                <div className="border border-[#D0D5DD] rounded-lg py-2 px-2 text-center bg-white">
                  <p className="text-[11px] text-[#344054]">Angle</p>
                  <p className="text-xs font-bold text-[#101828] mt-0.5">{angle || 45}°</p>
                </div>
                <div className="border border-[#D0D5DD] rounded-lg py-2 px-2 text-center bg-white">
                  <p className="text-[11px] text-[#344054]">Warm Up</p>
                  <p className="text-xs font-bold text-[#101828] mt-0.5">{warmingUpCount || 0}x</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#EAECF0]" />

            <div>
              <p className="text-sm text-[#344054] mb-2">Hasil Pengujian Aktual</p>
              <div className="grid grid-cols-5 gap-2">
                <div className="border border-[#D0D5DD] rounded-lg py-2 px-1 text-center bg-white">
                  <p className="text-[10px] text-[#344054]">Stroke</p>
                  <p className="text-xs font-bold text-[#101828] mt-0.5">{stroke || 84.5}</p>
                </div>
                <div className="border border-[#D0D5DD] rounded-lg py-2 px-1 text-center bg-white">
                  <p className="text-[10px] text-[#344054]">Load</p>
                  <p className="text-xs font-bold text-[#101828] mt-0.5">{metrics.load}</p>
                </div>
                <div className="border border-red-500 rounded-lg py-2 px-1 text-center bg-red-50">
                  <p className="text-[10px] text-red-600 font-semibold">Compression</p>
                  <p className="text-xs font-bold text-[#101828] mt-0.5">{computedLoads.compression}</p>
                </div>
                <div className="border border-purple-500 rounded-lg py-2 px-1 text-center bg-purple-50">
                  <p className="text-[10px] text-purple-600 font-semibold">Tension</p>
                  <p className="text-xs font-bold text-[#101828] mt-0.5">{computedLoads.tension}</p>
                </div>
                <div className="border border-green-500 rounded-lg py-2 px-1 text-center bg-green-50">
                  <p className="text-[10px] text-green-600 font-semibold">Friction</p>
                  <p className="text-xs font-bold text-[#101828] mt-0.5">{computedLoads.friction}</p>
                </div>
              </div>
            </div>
          </div>

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
