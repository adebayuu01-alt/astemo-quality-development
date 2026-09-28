export const INITIAL_USERS = [
  {
    id: 1,
    username: 'kevin_astemo',
    role: 'Superadmin',
    datetime: '06/09/2026 12:00',
    password: 'kevin12345',
    passwordMasked: '*****************'
  },
  {
    id: 2,
    username: 'suep_astemo',
    role: 'Admin',
    datetime: '06/09/2026 12:00',
    password: 'suep12345',
    passwordMasked: '*****************'
  },
  {
    id: 3,
    username: 'budi_welding',
    role: 'Operator',
    datetime: '07/09/2026 08:30',
    password: 'budi12345',
    passwordMasked: '*****************'
  },
  {
    id: 4,
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
    menus: ['Dashboard', 'Testing Process', 'History Testing'],
    permissions: ['Read, Create', 'Read, Create', 'Read'],
    datetime: '07/09/2026 09:00'
  }
];

export const INITIAL_MODELS = [
  { id: 1, model: 'SKA01-20-110', datetime: '06/09/2026 12:00' },
  { id: 2, model: 'SKA01-20-111', datetime: '06/09/2026 12:00' },
  { id: 3, model: 'SKA01-20-112', datetime: '06/09/2026 12:00' },
  { id: 4, model: 'SKA01-20-113', datetime: '06/09/2026 12:00' },
  { id: 5, model: 'SKA01-20-114', datetime: '06/09/2026 12:00' },
  { id: 6, model: 'SKA01-20-115', datetime: '06/09/2026 12:00' },
  { id: 7, model: 'SKA01-20-116', datetime: '06/09/2026 12:00' },
  { id: 8, model: 'SKA01-20-117', datetime: '06/09/2026 12:00' },
  { id: 9, model: 'SKA01-20-118', datetime: '06/09/2026 12:00' },
  { id: 10, model: 'SKA01-20-119', datetime: '06/09/2026 12:00' }
];

const SAMPLE_TESTING_CURVES = [
  {
    // Testing 1 (Red)
    compression: [0, 160, 210, 250, 290, 330, 375, 425, 485, 560, 650, 760, 890, 1030, 1090, null],
    rebound:     [0, 115, 160, 195, 230, 265, 305, 350, 400, 465, 540, 635, 750,  890, 1090, null]
  },
  {
    // Testing 2 (Blue)
    compression: [0, 170, 222, 265, 305, 348, 395, 448, 510, 588, 680, 795, 925, 1070, 1130, null],
    rebound:     [0, 125, 170, 208, 245, 282, 322, 370, 422, 490, 568, 665, 782,  925, 1130, null]
  },
  {
    // Testing 3 (Green)
    compression: [0, 180, 235, 278, 320, 365, 412, 468, 532, 612, 708, 825, 958, 1105, 1165, null],
    rebound:     [0, 135, 180, 220, 258, 295, 338, 388, 442, 512, 592, 692, 810,  958, 1165, null]
  },
  {
    // Testing 4 (Orange)
    compression: [0, 190, 248, 290, 335, 380, 428, 485, 550, 632, 730, 850, 985, 1135, 1195, null],
    rebound:     [0, 142, 190, 232, 270, 308, 352, 405, 460, 530, 612, 715, 835,  985, 1195, null]
  }
];

export const INITIAL_HISTORY = [
  {
    id: 1,
    model: 'SKA01-20-110',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 84,
    angle: 45,
    trialsCount: 1,
    metrics: { stroke: 84, load: 1090, loadCompression: 1090, loadForce: 890, frictionForce: 200 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      trials: [SAMPLE_TESTING_CURVES[0]]
    }
  },
  {
    id: 2,
    model: 'SKA01-20-111',
    datetime: '06/09/2026 12:00',
    speed: 520,
    stroke: 84,
    angle: 45,
    trialsCount: 2,
    metrics: { stroke: 84, load: 1130, loadCompression: 1130, loadForce: 925, frictionForce: 205 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      trials: [SAMPLE_TESTING_CURVES[0], SAMPLE_TESTING_CURVES[1]]
    }
  },
  {
    id: 3,
    model: 'SKA01-20-112',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 84,
    angle: 40,
    trialsCount: 3,
    metrics: { stroke: 84, load: 1165, loadCompression: 1165, loadForce: 958, frictionForce: 207 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      trials: [SAMPLE_TESTING_CURVES[0], SAMPLE_TESTING_CURVES[1], SAMPLE_TESTING_CURVES[2]]
    }
  },
  {
    id: 4,
    model: 'SKA01-20-113',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 84,
    angle: 45,
    trialsCount: 4,
    metrics: { stroke: 84, load: 1195, loadCompression: 1195, loadForce: 985, frictionForce: 210 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      trials: [SAMPLE_TESTING_CURVES[0], SAMPLE_TESTING_CURVES[1], SAMPLE_TESTING_CURVES[2], SAMPLE_TESTING_CURVES[3]]
    }
  },
  {
    id: 5,
    model: 'SKA01-20-114',
    datetime: '06/09/2026 12:00',
    speed: 480,
    stroke: 84,
    angle: 42,
    trialsCount: 2,
    metrics: { stroke: 84, load: 1130, loadCompression: 1130, loadForce: 925, frictionForce: 205 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      trials: [SAMPLE_TESTING_CURVES[0], SAMPLE_TESTING_CURVES[1]]
    }
  },
  {
    id: 6,
    model: 'SKA01-20-115',
    datetime: '06/09/2026 12:00',
    speed: 510,
    stroke: 84,
    angle: 45,
    trialsCount: 3,
    metrics: { stroke: 84, load: 1165, loadCompression: 1165, loadForce: 958, frictionForce: 207 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      trials: [SAMPLE_TESTING_CURVES[0], SAMPLE_TESTING_CURVES[1], SAMPLE_TESTING_CURVES[2]]
    }
  },
  {
    id: 7,
    model: 'SKA01-20-116',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 84,
    angle: 45,
    trialsCount: 4,
    metrics: { stroke: 84, load: 1195, loadCompression: 1195, loadForce: 985, frictionForce: 210 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      trials: [SAMPLE_TESTING_CURVES[0], SAMPLE_TESTING_CURVES[1], SAMPLE_TESTING_CURVES[2], SAMPLE_TESTING_CURVES[3]]
    }
  },
  {
    id: 8,
    model: 'SKA01-20-117',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 84,
    angle: 45,
    trialsCount: 1,
    metrics: { stroke: 84, load: 1090, loadCompression: 1090, loadForce: 890, frictionForce: 200 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      trials: [SAMPLE_TESTING_CURVES[0]]
    }
  },
  {
    id: 9,
    model: 'SKA01-20-118',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 84,
    angle: 45,
    trialsCount: 2,
    metrics: { stroke: 84, load: 1130, loadCompression: 1130, loadForce: 925, frictionForce: 205 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      trials: [SAMPLE_TESTING_CURVES[0], SAMPLE_TESTING_CURVES[1]]
    }
  },
  {
    id: 10,
    model: 'SKA01-20-119',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 84,
    angle: 45,
    trialsCount: 3,
    metrics: { stroke: 84, load: 1165, loadCompression: 1165, loadForce: 958, frictionForce: 207 },
    chartData: {
      compression: SAMPLE_TESTING_CURVES[0].compression,
      rebound: SAMPLE_TESTING_CURVES[0].rebound,
      trials: [SAMPLE_TESTING_CURVES[0], SAMPLE_TESTING_CURVES[1], SAMPLE_TESTING_CURVES[2]]
    }
  }
];
