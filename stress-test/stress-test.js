import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métricas personalizadas
const errorRate = new Rate('errors');

// Configuración de la prueba
export const options = {
  stages: [
    // Ramp-up: 0 → 100 usuarios en 2 minutos
    { duration: '2m', target: 100 },
    // Ramp-up: 100 → 500 usuarios en 2 minutos
    { duration: '2m', target: 500 },
    // Ramp-up: 500 → 1000 usuarios en 2 minutos
    { duration: '2m', target: 1000 },
    // Ramp-up: 1000 → 1500 usuarios en 2 minutos
    { duration: '2m', target: 1500 },
    // Ramp-up: 1500 → 2500 usuarios en 2 minutos
    { duration: '2m', target: 2500 },
    // Sostenido: 2500 usuarios durante 10 minutos
    { duration: '10m', target: 2500 },
    // Ramp-down: 2500 → 0 usuarios en 2 minutos
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // 95% de las requests deben completarse en menos de 1000ms
    'http_req_duration': ['p(95)<1000'],
    // 99% de las requests deben completarse en menos de 2000ms
    'http_req_duration{p(99)}': ['p(99)<2000'],
    // Tasa de error debe ser menor al 1%
    'errors': ['rate<0.01'],
    // 95% de las requests deben ser exitosas
    'http_req_failed': ['rate<0.05'],
  },
};

// URL base de la aplicación
const BASE_URL = 'https://pianoemotion.com';

// Simular diferentes tipos de usuarios
const USER_SCENARIOS = [
  'view_clients',
  'view_pianos',
  'view_appointments',
  'view_services',
  'view_dashboard',
];

export default function () {
  // Seleccionar un escenario aleatorio
  const scenario = USER_SCENARIOS[Math.floor(Math.random() * USER_SCENARIOS.length)];
  
  // Simular comportamiento de usuario real
  switch (scenario) {
    case 'view_clients':
      viewClients();
      break;
    case 'view_pianos':
      viewPianos();
      break;
    case 'view_appointments':
      viewAppointments();
      break;
    case 'view_services':
      viewServices();
      break;
    case 'view_dashboard':
      viewDashboard();
      break;
  }
  
  // Pausa entre requests (simular tiempo de lectura del usuario)
  sleep(Math.random() * 3 + 2); // Entre 2 y 5 segundos
}

function viewClients() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'clients.list' },
  };
  
  const payload = JSON.stringify({
    '0': {
      json: {
        limit: 30,
        cursor: null,
        sortBy: 'name',
        sortOrder: 'asc',
      },
    },
  });
  
  const res = http.post(`${BASE_URL}/api/trpc/clients.list`, payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
}

function viewPianos() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'pianos.list' },
  };
  
  const payload = JSON.stringify({
    '0': {
      json: {
        limit: 30,
        cursor: null,
        sortBy: 'brand',
        sortOrder: 'asc',
      },
    },
  });
  
  const res = http.post(`${BASE_URL}/api/trpc/pianos.list`, payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
}

function viewAppointments() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'appointments.list' },
  };
  
  const payload = JSON.stringify({
    '0': {
      json: {
        limit: 30,
        cursor: null,
      },
    },
  });
  
  const res = http.post(`${BASE_URL}/api/trpc/appointments.list`, payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
}

function viewServices() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'services.list' },
  };
  
  const payload = JSON.stringify({
    '0': {
      json: {
        limit: 30,
      },
    },
  });
  
  const res = http.post(`${BASE_URL}/api/trpc/services.list`, payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
}

function viewDashboard() {
  // Simular carga del dashboard (múltiples requests)
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Request 1: auth.me
  const authPayload = JSON.stringify({});
  const authRes = http.post(`${BASE_URL}/api/trpc/auth.me`, authPayload, {
    ...params,
    tags: { name: 'auth.me' },
  });
  
  check(authRes, {
    'auth status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(0.5);
  
  // Request 2: clients.list (primeros 10)
  const clientsPayload = JSON.stringify({
    '0': {
      json: {
        limit: 10,
        cursor: null,
      },
    },
  });
  
  const clientsRes = http.post(`${BASE_URL}/api/trpc/clients.list`, clientsPayload, {
    ...params,
    tags: { name: 'clients.list' },
  });
  
  check(clientsRes, {
    'clients status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);
}
