import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Métrica personalizada para contar errores
const errors = new Counter('errors');

// Configuración de la prueba para 2500 usuarios concurrentes
export const options = {
  stages: [
    // Warm-up: 0 → 500 usuarios en 2 minutos
    { duration: '2m', target: 500 },
    // Ramp-up: 500 → 1500 usuarios en 3 minutos
    { duration: '3m', target: 1500 },
    // Peak: 1500 → 2500 usuarios en 5 minutos
    { duration: '5m', target: 2500 },
    // Sustained load: 2500 usuarios durante 10 minutos
    { duration: '10m', target: 2500 },
    // Ramp-down: 2500 → 0 usuarios en 2 minutos
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // 95% de las requests deben completarse en menos de 1000ms
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    // Tasa de error debe ser menor al 5%
    'errors': ['rate<0.05'],
    // 95% de las requests deben ser exitosas
    'http_req_failed': ['rate<0.05'],
  },
};

// URL base de la aplicación
const BASE_URL = 'https://pianoemotion.com';
const STRESS_TEST_SECRET = __ENV.STRESS_TEST_SECRET || 'STRESS_TEST_SECRET_2026';

// Simular diferentes tipos de usuarios
const USER_SCENARIOS = [
  'view_clients',
  'view_pianos',
  'view_appointments',
  'view_services',
  'view_dashboard',
];

// Setup: Configurar bypass de autenticación
export function setup() {
  console.log('🚀 Iniciando prueba de estrés de 2500 usuarios concurrentes...');
  console.log('✅ Bypass de autenticación y rate limiting configurado');
  
  return {
    stressTestSecret: STRESS_TEST_SECRET,
  };
}

export default function (data) {
  // Seleccionar un escenario aleatorio
  const scenario = USER_SCENARIOS[Math.floor(Math.random() * USER_SCENARIOS.length)];
  
  // Simular comportamiento de usuario real
  switch (scenario) {
    case 'view_clients':
      viewClients(data.stressTestSecret);
      break;
    case 'view_pianos':
      viewPianos(data.stressTestSecret);
      break;
    case 'view_appointments':
      viewAppointments(data.stressTestSecret);
      break;
    case 'view_services':
      viewServices(data.stressTestSecret);
      break;
    case 'view_dashboard':
      viewDashboard(data.stressTestSecret);
      break;
  }
  
  // Pausa realista entre requests (5-10 segundos)
  // Esto distribuye la carga: 2500 usuarios / 7.5s promedio = ~333 req/s
  sleep(Math.random() * 5 + 5);
}

function viewClients(secret) {
  const params = {
    headers: {
      'X-Stress-Test-Secret': secret,
    },
    tags: { name: 'clients.list' },
  };

  const response = http.get(
    `${BASE_URL}/api/trpc/clients.list`,
    params
  );

  const success = check(response, {
    'clients status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (!success) {
    errors.add(1);
  }
}

function viewPianos(secret) {
  const params = {
    headers: {
      'X-Stress-Test-Secret': secret,
    },
    tags: { name: 'pianos.list' },
  };

  const response = http.get(
    `${BASE_URL}/api/trpc/pianos.list`,
    params
  );

  const success = check(response, {
    'pianos status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (!success) {
    errors.add(1);
  }
}

function viewAppointments(secret) {
  const params = {
    headers: {
      'X-Stress-Test-Secret': secret,
    },
    tags: { name: 'appointments.list' },
  };

  const response = http.get(
    `${BASE_URL}/api/trpc/appointments.list`,
    params
  );

  const success = check(response, {
    'appointments status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (!success) {
    errors.add(1);
  }
}

function viewServices(secret) {
  const params = {
    headers: {
      'X-Stress-Test-Secret': secret,
    },
    tags: { name: 'services.list' },
  };

  const response = http.get(
    `${BASE_URL}/api/trpc/services.list`,
    params
  );

  const success = check(response, {
    'services status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (!success) {
    errors.add(1);
  }
}

function viewDashboard(secret) {
  const params = {
    headers: {
      'X-Stress-Test-Secret': secret,
    },
    tags: { name: 'auth.me' },
  };

  // 1. Obtener información del usuario
  const authResponse = http.get(
    `${BASE_URL}/api/trpc/auth.me`,
    params
  );

  check(authResponse, {
    'auth status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  // Pequeña pausa entre requests del mismo usuario
  sleep(1);

  // 2. Obtener resumen de clientes
  const clientsParams = {
    ...params,
    tags: { name: 'clients.list' },
  };

  const clientsResponse = http.get(
    `${BASE_URL}/api/trpc/clients.list`,
    clientsParams
  );

  const success = check(clientsResponse, {
    'clients status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (!success) {
    errors.add(1);
  }
}

// Teardown: Resumen final
export function teardown(data) {
  console.log('✅ Prueba de estrés completada');
  console.log('📊 Revisa los resultados arriba para ver el rendimiento del sistema');
}
