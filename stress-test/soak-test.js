import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * SOAK TEST (Test de Carga Sostenida)
 * 
 * Objetivo: Verificar estabilidad del sistema bajo carga constante durante períodos prolongados
 * Duración: 2 horas
 * Usuarios: 1,500 concurrentes constantes
 * Detecta: Memory leaks, degradación de rendimiento, problemas de conexiones
 */

const BASE_URL = 'https://pianoemotion.com';
const STRESS_TEST_SECRET = 'piano-emotion-stress-test-2026';

// Métricas personalizadas
const errorRate = new Rate('errors');
const successRate = new Rate('success');

export const options = {
  stages: [
    { duration: '5m', target: 1500 },   // Ramp-up: 0 → 1500 en 5 minutos
    { duration: '2h', target: 1500 },   // Carga sostenida: 1500 usuarios durante 2 horas
    { duration: '5m', target: 0 },      // Ramp-down: 1500 → 0 en 5 minutos
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'], // 95% < 2s, 99% < 5s
    'http_req_failed': ['rate<0.05'],                   // <5% de errores
    'errors': ['rate<0.05'],
    'success': ['rate>0.95'],
    'checks': ['rate>0.95'],                            // >95% de checks exitosos
  },
};

// Función para hacer request con bypass de autenticación
function makeAuthenticatedRequest(url, method = 'GET', body = null) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Stress-Test-Secret': STRESS_TEST_SECRET,
    },
    timeout: '30s',
  };

  let response;
  if (method === 'GET') {
    response = http.get(url, params);
  } else if (method === 'POST') {
    response = http.post(url, body ? JSON.stringify(body) : null, params);
  }

  return response;
}

// Función principal del test
export default function () {
  const testUser = `stress-test-user-${__VU}`;
  
  // 1. Verificar autenticación
  const authResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/auth.me?input={"limit":30}`);
  const authCheck = check(authResponse, {
    'auth.me status 200': (r) => r.status === 200,
    'auth.me response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  if (authCheck) {
    successRate.add(1);
  } else {
    errorRate.add(1);
  }

  sleep(1);

  // 2. Listar clientes
  const clientsResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/clients.list?input={"limit":30}`);
  const clientsCheck = check(clientsResponse, {
    'clients.list status 200': (r) => r.status === 200,
    'clients.list response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  if (clientsCheck) {
    successRate.add(1);
  } else {
    errorRate.add(1);
  }

  sleep(1);

  // 3. Listar pianos
  const pianosResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/pianos.list?input={"limit":30}`);
  const pianosCheck = check(pianosResponse, {
    'pianos.list status 200': (r) => r.status === 200,
    'pianos.list response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  if (pianosCheck) {
    successRate.add(1);
  } else {
    errorRate.add(1);
  }

  sleep(1);

  // 4. Listar servicios
  const servicesResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/services.list?input={"limit":30}`);
  const servicesCheck = check(servicesResponse, {
    'services.list status 200': (r) => r.status === 200,
    'services.list response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  if (servicesCheck) {
    successRate.add(1);
  } else {
    errorRate.add(1);
  }

  sleep(1);

  // 5. Listar citas
  const appointmentsResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/appointments.list?input={"limit":30}`);
  const appointmentsCheck = check(appointmentsResponse, {
    'appointments.list status 200': (r) => r.status === 200,
    'appointments.list response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  if (appointmentsCheck) {
    successRate.add(1);
  } else {
    errorRate.add(1);
  }

  // Pausa entre iteraciones (simula usuario real)
  sleep(3);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return {
    [`soak-test-${timestamp}.json`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = `\n${indent}=== SOAK TEST SUMMARY ===\n\n`;
  
  // Métricas generales
  summary += `${indent}Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += `${indent}VUs: ${data.metrics.vus.values.max}\n`;
  summary += `${indent}Iterations: ${data.metrics.iterations.values.count}\n\n`;
  
  // HTTP metrics
  summary += `${indent}HTTP Requests:\n`;
  summary += `${indent}  Total: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n`;
  summary += `${indent}  Failed: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n\n`;
  
  // Latency
  summary += `${indent}Response Time:\n`;
  summary += `${indent}  Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  p50: ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms\n`;
  summary += `${indent}  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `${indent}  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  
  // Checks
  summary += `${indent}Checks:\n`;
  summary += `${indent}  Passed: ${(data.metrics.checks.values.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}  Failed: ${((1 - data.metrics.checks.values.rate) * 100).toFixed(2)}%\n\n`;
  
  // Custom metrics
  if (data.metrics.errors) {
    summary += `${indent}Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  }
  if (data.metrics.success) {
    summary += `${indent}Success Rate: ${(data.metrics.success.values.rate * 100).toFixed(2)}%\n`;
  }
  
  return summary;
}
