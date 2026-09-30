export const INITIAL_USERS = [
  {
    id: 1,
    idCard: 'AST-SA-001',
    name: 'Kevin Pratama',
    username: 'kevin_astemo',
    role: 'Superadmin',
    datetime: '06/09/2026 12:00',
    password: 'kevin12345',
    passwordMasked: '*****************'
  },
  {
    id: 2,
    idCard: 'AST-OP-002',
    name: 'Suep Suryadi',
    username: 'suep_astemo',
    role: 'Operator',
    datetime: '06/09/2026 12:00',
    password: 'suep12345',
    passwordMasked: '*****************'
  },
  {
    id: 3,
    idCard: 'AST-OP-003',
    name: 'Budi Welding',
    username: 'budi_welding',
    role: 'Operator',
    datetime: '07/09/2026 08:30',
    password: 'budi12345',
    passwordMasked: '*****************'
  },
  {
    id: 4,
    idCard: 'AST-ENG-004',
    name: 'Andi Quality',
    username: 'andi_quality',
    role: 'Engineer',
    datetime: '08/09/2026 14:15',
    password: 'andi12345',
    passwordMasked: '*****************'
  }
];

export const INITIAL_ROLES = [
  {
    id: 1,
    role: 'Superadmin',
    menus: [
      'Dashboard',
      'Planning Production',
      'User Management',
      'Role Management',
      'Master Data',
      'Register'
    ],
    permissions: [
      'Create, Read, Update, Delete',
      'Create, Read, Update, Delete',
      'Create, Read, Update, Delete',
      'Create, Read, Update, Delete',
      'Create, Read, Update, Delete',
      'Create, Read, Update, Delete'
    ],
    datetime: '06/09/2026 12:00'
  },
  {
    id: 2,
    role: 'Admin',
    menus: [
      'Dashboard',
      'Planning Production',
      'User Management',
      'Role Management',
      'Master Data',
      'Register'
    ],
    permissions: [
      'Create, Read, Update, Delete',
      'Create, Read, Update, Delete',
      'Create, Read, Update, Delete',
      'Create, Read, Update, Delete',
      'Create, Read, Update, Delete',
      'Create, Read, Update, Delete'
    ],
    datetime: '06/09/2026 12:00'
  },
  {
    id: 3,
    role: 'Operator',
    menus: ['Testing Process'],
    permissions: ['Read, Create'],
    datetime: '07/09/2026 09:00'
  }
];

export const INITIAL_MODELS = [
  { id: 1, model: 'SKA01-20-110', stroke: 1700, angle: 45, speed: 500, datetime: '06/09/2026 12:00' },
  { id: 2, model: 'SKA01-20-111', stroke: 1700, angle: 45, speed: 520, datetime: '06/09/2026 12:00' },
  { id: 3, model: 'SKA01-20-112', stroke: 1700, angle: 40, speed: 500, datetime: '06/09/2026 12:00' },
  { id: 4, model: 'SKA01-20-113', stroke: 1700, angle: 45, speed: 500, datetime: '06/09/2026 12:00' },
  { id: 5, model: 'SKA01-20-114', stroke: 1700, angle: 42, speed: 480, datetime: '06/09/2026 12:00' },
  { id: 6, model: 'SKA01-20-115', stroke: 1700, angle: 45, speed: 510, datetime: '06/09/2026 12:00' },
  { id: 7, model: 'SKA01-20-116', stroke: 1700, angle: 45, speed: 500, datetime: '06/09/2026 12:00' },
  { id: 8, model: 'SKA01-20-117', stroke: 1700, angle: 45, speed: 500, datetime: '06/09/2026 12:00' },
  { id: 9, model: 'SKA01-20-118', stroke: 1700, angle: 45, speed: 500, datetime: '06/09/2026 12:00' },
  { id: 10, model: 'SKA01-20-119', stroke: 1700, angle: 45, speed: 500, datetime: '06/09/2026 12:00' }
];

export const TOTAL_TESTING_POINTS = 1700;

export const BASELINE_COMPRESSION = [0, 160, 210, 250, 290, 330, 375, 425, 485, 560, 650, 760, 890, 1030, 1090];
export const BASELINE_REBOUND     = [0, 115, 160, 195, 230, 265, 305, 350, 400, 465, 540, 635, 750,  890,  890];

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function interpolateBenchmark(baseArr, count) {
  const res = [];
  const n = baseArr.length;
  for (let i = 0; i < count; i++) {
    const norm = (i / (count - 1)) * (n - 1);
    const idx = Math.floor(norm);
    const t = norm - idx;
    if (idx >= n - 1) {
      res.push(baseArr[n - 1]);
      continue;
    }
    const p0 = baseArr[Math.max(0, idx - 1)];
    const p1 = baseArr[idx];
    const p2 = baseArr[Math.min(n - 1, idx + 1)];
    const p3 = baseArr[Math.min(n - 1, idx + 2)];
    res.push(catmullRom(p0, p1, p2, p3, t));
  }
  return res;
}

export const generateCurvePoints = (peakComp = 1090, peakTension = 890, noiseSeed = 1) => {
  const compBase = interpolateBenchmark(BASELINE_COMPRESSION, TOTAL_TESTING_POINTS);
  const rebBase = interpolateBenchmark(BASELINE_REBOUND, TOTAL_TESTING_POINTS);

  const compScale = peakComp / 1090;
  const rebScale = peakTension / 890;

  const comp = [];
  const reb = [];

  for (let i = 0; i < TOTAL_TESTING_POINTS; i++) {
    if (i === 0) {
      comp.push(0);
      reb.push(0);
    } else if (i === TOTAL_TESTING_POINTS - 1) {
      comp.push(peakComp);
      reb.push(peakTension);
    } else {
      const jitter = Math.sin((i + 1) * 0.45 + noiseSeed) * 0.4 + Math.cos((i + 1) * 0.85 + noiseSeed) * 0.3;
      comp.push(Math.round(compBase[i] * compScale + jitter));
      reb.push(Math.round(rebBase[i] * rebScale + jitter * 0.7));
    }
  }

  return { compression: comp, rebound: reb };
};

export const SAMPLE_TESTING_CURVES = [
  generateCurvePoints(1090, 890, 1),
  generateCurvePoints(1130, 925, 2),
  generateCurvePoints(1165, 958, 3),
  generateCurvePoints(1195, 985, 4)
];

// Data dummy diskrit 1 s/d 1700 titik untuk pengujian
export const DUMMY_TESTING_DATA_1700 = Array.from({ length: TOTAL_TESTING_POINTS }, (_, i) => {
  const point = i + 1;
  const compVal = SAMPLE_TESTING_CURVES[0].compression[i];
  const rebVal = SAMPLE_TESTING_CURVES[0].rebound[i];
  return {
    point, // 1 - 1700
    compression: compVal,
    rebound: rebVal,
    loadCompression: compVal,
    loadTension: rebVal,
    frictionForce: Math.abs(compVal - rebVal)
  };
});

// Sesi pengujian dummy lengkap 1 - 1700 titik (Warming Up + Testing Aktual)
export const DUMMY_TESTING_SESSION = {
  model: 'SKA01-20-110',
  speed: 500,
  stroke: 1700,
  angle: 45,
  warmingUpCount: 1,
  completedCycles: 2,
  actualTestCompleted: true,
  metrics: {
    stroke: 1700,
    load: 1090,
    loadCompression: 1090,
    loadForce: 890,
    frictionForce: 200
  },
  cycles: [
    {
      index: 0,
      name: 'Warming Up 1',
      isWarmUp: true,
      color: '#FA8C16',
      compression: SAMPLE_TESTING_CURVES[1].compression,
      rebound: SAMPLE_TESTING_CURVES[1].rebound,
      metrics: { stroke: 1700, load: 1130, loadCompression: 1130, loadForce: 925, frictionForce: 205 }
    },
    {
      index: 1,
      name: 'Testing',
      isWarmUp: false,
      color: '#00A854',
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      metrics: { stroke: 1700, load: 1090, loadCompression: 1090, loadForce: 890, frictionForce: 200 }
    }
  ]
};

export const INITIAL_HISTORY = [
  {
    id: 1,
    model: 'SKA01-20-110',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 1700,
    angle: 45,
    warmingUpCount: 1,
    trialsCount: 1,
    metrics: { stroke: 1700, load: 1090, loadCompression: 1090, loadForce: 890, frictionForce: 200 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      cycles: [
        {
          name: 'Warming Up 1',
          isWarmUp: true,
          color: '#FA8C16',
          compression: SAMPLE_TESTING_CURVES[1].compression,
          rebound: SAMPLE_TESTING_CURVES[1].rebound,
          metrics: { stroke: 1700, load: 1130, loadCompression: 1130, loadForce: 925, frictionForce: 205 }
        },
        {
          name: 'Testing',
          isWarmUp: false,
          color: '#00A854',
          compression: SAMPLE_TESTING_CURVES[0].compression,
          rebound: SAMPLE_TESTING_CURVES[0].rebound,
          metrics: { stroke: 1700, load: 1090, loadCompression: 1090, loadForce: 890, frictionForce: 200 }
        }
      ],
      trials: [
        {
          compression: SAMPLE_TESTING_CURVES[0].compression,
          rebound: SAMPLE_TESTING_CURVES[0].rebound
        }
      ]
    }
  },
  {
    id: 2,
    model: 'SKA01-20-111',
    datetime: '06/09/2026 12:00',
    speed: 520,
    stroke: 1700,
    angle: 45,
    warmingUpCount: 2,
    trialsCount: 1,
    metrics: { stroke: 1700, load: 1130, loadCompression: 1130, loadForce: 925, frictionForce: 205 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      cycles: [
        {
          name: 'Warming Up 1',
          isWarmUp: true,
          color: '#FA8C16',
          compression: SAMPLE_TESTING_CURVES[1].compression,
          rebound: SAMPLE_TESTING_CURVES[1].rebound,
          metrics: { stroke: 1700, load: 1130, loadCompression: 1130, loadForce: 925, frictionForce: 205 }
        },
        {
          name: 'Warming Up 2',
          isWarmUp: true,
          color: '#722ED1',
          compression: SAMPLE_TESTING_CURVES[2].compression,
          rebound: SAMPLE_TESTING_CURVES[2].rebound,
          metrics: { stroke: 1700, load: 1165, loadCompression: 1165, loadForce: 958, frictionForce: 207 }
        },
        {
          name: 'Testing',
          isWarmUp: false,
          color: '#00A854',
          compression: SAMPLE_TESTING_CURVES[0].compression,
          rebound: SAMPLE_TESTING_CURVES[0].rebound,
          metrics: { stroke: 1700, load: 1090, loadCompression: 1090, loadForce: 890, frictionForce: 200 }
        }
      ],
      trials: [
        {
          compression: SAMPLE_TESTING_CURVES[0].compression,
          rebound: SAMPLE_TESTING_CURVES[0].rebound
        }
      ]
    }
  },
  {
    id: 3,
    model: 'SKA01-20-112',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 1700,
    angle: 40,
    warmingUpCount: 1,
    trialsCount: 1,
    metrics: { stroke: 1700, load: 1165, loadCompression: 1165, loadForce: 958, frictionForce: 207 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[2].compression,
      rebound: SAMPLE_TESTING_CURVES[2].rebound,
      cycles: [
        {
          name: 'Warming Up 1',
          isWarmUp: true,
          color: '#FA8C16',
          compression: SAMPLE_TESTING_CURVES[1].compression,
          rebound: SAMPLE_TESTING_CURVES[1].rebound
        },
        {
          name: 'Testing',
          isWarmUp: false,
          color: '#00A854',
          compression: SAMPLE_TESTING_CURVES[2].compression,
          rebound: SAMPLE_TESTING_CURVES[2].rebound
        }
      ],
      trials: [
        {
          compression: SAMPLE_TESTING_CURVES[2].compression,
          rebound: SAMPLE_TESTING_CURVES[2].rebound
        }
      ]
    }
  },
  {
    id: 4,
    model: 'SKA01-20-113',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 1700,
    angle: 45,
    warmingUpCount: 3,
    trialsCount: 1,
    metrics: { stroke: 1700, load: 1195, loadCompression: 1195, loadForce: 985, frictionForce: 210 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[3].compression,
      rebound: SAMPLE_TESTING_CURVES[3].rebound,
      cycles: [
        {
          name: 'Testing',
          isWarmUp: false,
          color: '#00A854',
          compression: SAMPLE_TESTING_CURVES[3].compression,
          rebound: SAMPLE_TESTING_CURVES[3].rebound
        }
      ],
      trials: [
        {
          compression: SAMPLE_TESTING_CURVES[3].compression,
          rebound: SAMPLE_TESTING_CURVES[3].rebound
        }
      ]
    }
  },
  {
    id: 5,
    model: 'SKA01-20-114',
    datetime: '06/09/2026 12:00',
    speed: 480,
    stroke: 1700,
    angle: 42,
    warmingUpCount: 1,
    trialsCount: 1,
    metrics: { stroke: 1700, load: 1130, loadCompression: 1130, loadForce: 925, frictionForce: 205 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[1].compression,
      rebound: SAMPLE_TESTING_CURVES[1].rebound,
      trials: [
        {
          compression: SAMPLE_TESTING_CURVES[1].compression,
          rebound: SAMPLE_TESTING_CURVES[1].rebound
        }
      ]
    }
  },
  {
    id: 6,
    model: 'SKA01-20-115',
    datetime: '06/09/2026 12:00',
    speed: 510,
    stroke: 1700,
    angle: 45,
    warmingUpCount: 2,
    trialsCount: 1,
    metrics: { stroke: 1700, load: 1165, loadCompression: 1165, loadForce: 958, frictionForce: 207 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[2].compression,
      rebound: SAMPLE_TESTING_CURVES[2].rebound,
      trials: [
        {
          compression: SAMPLE_TESTING_CURVES[2].compression,
          rebound: SAMPLE_TESTING_CURVES[2].rebound
        }
      ]
    }
  },
  {
    id: 7,
    model: 'SKA01-20-116',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 1700,
    angle: 45,
    warmingUpCount: 1,
    trialsCount: 1,
    metrics: { stroke: 1700, load: 1195, loadCompression: 1195, loadForce: 985, frictionForce: 210 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[3].compression,
      rebound: SAMPLE_TESTING_CURVES[3].rebound,
      trials: [
        {
          compression: SAMPLE_TESTING_CURVES[3].compression,
          rebound: SAMPLE_TESTING_CURVES[3].rebound
        }
      ]
    }
  },
  {
    id: 8,
    model: 'SKA01-20-117',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 1700,
    angle: 45,
    warmingUpCount: 1,
    trialsCount: 1,
    metrics: { stroke: 1700, load: 1090, loadCompression: 1090, loadForce: 890, frictionForce: 200 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      trials: [
        {
          compression: SAMPLE_TESTING_CURVES[0].compression,
          rebound: SAMPLE_TESTING_CURVES[0].rebound
        }
      ]
    }
  },
  {
    id: 9,
    model: 'SKA01-20-118',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 1700,
    angle: 45,
    warmingUpCount: 1,
    trialsCount: 1,
    metrics: { stroke: 1700, load: 1130, loadCompression: 1130, loadForce: 925, frictionForce: 205 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[1].compression,
      rebound: SAMPLE_TESTING_CURVES[1].rebound,
      trials: [
        {
          compression: SAMPLE_TESTING_CURVES[1].compression,
          rebound: SAMPLE_TESTING_CURVES[1].rebound
        }
      ]
    }
  },
  {
    id: 10,
    model: 'SKA01-20-119',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 1700,
    angle: 45,
    warmingUpCount: 2,
    trialsCount: 1,
    metrics: { stroke: 1700, load: 1165, loadCompression: 1165, loadForce: 958, frictionForce: 207 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[2].compression,
      rebound: SAMPLE_TESTING_CURVES[2].rebound,
      trials: [
        {
          compression: SAMPLE_TESTING_CURVES[2].compression,
          rebound: SAMPLE_TESTING_CURVES[2].rebound
        }
      ]
    }
  }
];
