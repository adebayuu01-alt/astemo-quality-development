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

export const INITIAL_HISTORY = [
  {
    id: 1,
    model: 'SKA01-20-110',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 20,
    angle: 45,
    metrics: { stroke: 55, load: 55, loadCompression: 58, loadForce: 59, frictionForce: 50 },
    chartData: {
      s1: [0, 1.5, 3.8, 6.2, 10.1, 16.5, 23.8, 33.2, 43.1, 48.0],
      s2: [0, 2.0, 4.5, 7.8, 12.0, 19.2, 27.5, 38.0, 46.5, 50.2],
      s3: [0, 2.8, 6.5, 11.2, 15.8, 24.1, 34.0, 45.5, 52.8, 54.5]
    }
  },
  {
    id: 2,
    model: 'SKA01-20-111',
    datetime: '06/09/2026 12:00',
    speed: 520,
    stroke: 22,
    angle: 45,
    metrics: { stroke: 56, load: 54, loadCompression: 57, loadForce: 58, frictionForce: 49 },
    chartData: {
      s1: [0, 1.4, 3.6, 6.0, 9.8, 16.0, 23.2, 32.5, 42.0, 47.5],
      s2: [0, 1.9, 4.3, 7.5, 11.6, 18.8, 26.9, 37.2, 45.8, 49.6],
      s3: [0, 2.7, 6.2, 10.8, 15.3, 23.5, 33.2, 44.6, 51.9, 53.8]
    }
  },
  {
    id: 3,
    model: 'SKA01-20-112',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 20,
    angle: 40,
    metrics: { stroke: 55, load: 55, loadCompression: 58, loadForce: 60, frictionForce: 51 }
  },
  {
    id: 4,
    model: 'SKA01-20-113',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 20,
    angle: 45,
    metrics: { stroke: 54, load: 53, loadCompression: 56, loadForce: 57, frictionForce: 48 }
  },
  {
    id: 5,
    model: 'SKA01-20-114',
    datetime: '06/09/2026 12:00',
    speed: 480,
    stroke: 18,
    angle: 42,
    metrics: { stroke: 55, load: 55, loadCompression: 58, loadForce: 59, frictionForce: 50 }
  },
  {
    id: 6,
    model: 'SKA01-20-115',
    datetime: '06/09/2026 12:00',
    speed: 510,
    stroke: 20,
    angle: 45,
    metrics: { stroke: 55, load: 56, loadCompression: 59, loadForce: 60, frictionForce: 52 }
  },
  {
    id: 7,
    model: 'SKA01-20-116',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 20,
    angle: 45,
    metrics: { stroke: 55, load: 55, loadCompression: 58, loadForce: 59, frictionForce: 50 }
  },
  {
    id: 8,
    model: 'SKA01-20-117',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 25,
    angle: 45,
    metrics: { stroke: 55, load: 55, loadCompression: 58, loadForce: 59, frictionForce: 50 }
  },
  {
    id: 9,
    model: 'SKA01-20-118',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 20,
    angle: 45,
    metrics: { stroke: 55, load: 55, loadCompression: 58, loadForce: 59, frictionForce: 50 }
  },
  {
    id: 10,
    model: 'SKA01-20-119',
    datetime: '06/09/2026 12:00',
    speed: 500,
    stroke: 20,
    angle: 45,
    metrics: { stroke: 55, load: 55, loadCompression: 58, loadForce: 59, frictionForce: 50 }
  }
];
