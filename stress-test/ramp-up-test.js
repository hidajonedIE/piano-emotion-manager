import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * RAMP-UP TEST (Test de Escalado Gradual)
 * 
 * Objetivo: Encontrar el punto de quiebre del sistema
 * Duración: 40 minutos
 * Patrón: 0 → 6,000 usuarios gradualmente
 * Detecta: Límite máximo de usuarios, cuellos de botella, degradación progresiva
 */

const BASE_URL = 'https://pianoemotion.com';
const STRESS_TEST_SECRET = 'piano-emotion-stress-test-2026';

// Métricas personalizadas
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const latencyTrend = new Trend('custom_latency');

export const options = {
  stages: [
    { duration: '5m', target: 1000 },   // 0 → 1000 en 5 minutos
    { duration: '5m', target: 2000 },   // 1000 → 2000 en 5 minutos
    { duration: '5m', target: 3000 },   // 2000 → 3000 en 5 minutos
    { duration: '5m', target: 4000 },   // 3000 → 4000 en 5 minutos
    { duration: '5m', target: 5000 },   // 4000 → 5000 en 5 minutos
    { duration: '5m', target: 6000 },   // 5000 → 6000 en 5 minutos
    { duration: '5m', target: 6000 },   // Hold: 6000 usuarios por 5 minutos
    { duration: '5m', target: 0 },      // Ramp-down: 6000 → 0 en 5 minutos
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000', 'p(99)<10000'],
    'http_req_failed': ['rate<0.15'],                    // <15% de errores (tolerante)
    'errors': ['rate<0.15'],
    'success': ['rate>0.85'],                            // >85% de éxito
    'checks': ['rate>0.85'],
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
  const currentVUs = __VU;
  const startTime = Date.now();
  
  // 1. Verificar autenticación
  const authResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/auth.me?input={"limit":30}`);
  const authCheck = check(authResponse, {
    'auth.me status 200': (r) => r.status === 200,
    'auth.me response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  latencyTrend.add(authResponse.timings.duration);
  
  if (authCheck) {
    successRate.add(1);
  } else {
    errorRate.add(1);
  }

  sleep(0.5);

  // 2. Listar clientes
  const clientsResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/clients.list?input={"limit":30}`);
  const clientsCheck = check(clientsResponse, {
    'clients.list status 200': (r) => r.status === 200,
    'clients.list response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  latencyTrend.add(clientsResponse.timings.duration);
  
  if (clientsCheck) {
    successRate.add(1);
  } else {
    errorRate.add(1);
  }

  sleep(0.5);

  // 3. Listar pianos
  const pianosResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/pianos.list?input={"limit":30}`);
  const pianosCheck = check(pianosResponse, {
    'pianos.list status 200': (r) => r.status === 200,
    'pianos.list response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  latencyTrend.add(pianosResponse.timings.duration);
  
  if (pianosCheck) {
    successRate.add(1);
  } else {
    errorRate.add(1);
  }

  sleep(0.5);

  // 4. Listar servicios
  const servicesResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/services.list?input={"limit":30}`);
  const servicesCheck = check(servicesResponse, {
    'services.list status 200': (r) => r.status === 200,
    'services.list response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  latencyTrend.add(servicesResponse.timings.duration);
  
  if (servicesCheck) {
    successRate.add(1);
  } else {
    errorRate.add(1);
  }

  sleep(0.5);

  // 5. Listar citas
  const appointmentsResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/appointments.list?input={"limit":30}`);
  const appointmentsCheck = check(appointmentsResponse, {
    'appointments.list status 200': (r) => r.status === 200,
    'appointments.list response time < 3000ms': (r) => r.timings.duration < 3000,
  });
  
  latencyTrend.add(appointmentsResponse.timings.duration);
  
  if (appointmentsCheck) {
    successRate.add(1);
  } else {
    errorRate.add(1);
  }

  // Pausa entre iteraciones
  sleep(1);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return {
    [`ramp-up-test-${timestamp}.json`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  
  let summary = `\n${indent}=== RAMP-UP TEST SUMMARY ===\n\n`;
  
  // Métricas generales
  summary += `${indent}Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += `${indent}Max VUs: ${data.metrics.vus.values.max}\n`;
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
  if (data.metrics.custom_latency) {
    summary += `${indent}Custom Latency Avg: ${data.metrics.custom_latency.values.avg.toFixed(2)}ms\n`;
  }
  
  summary += `\n${indent}=== BREAKING POINT ANALYSIS ===\n`;
  summary += `${indent}El sistema escaló gradualmente de 0 a 6000 usuarios.\n`;
  summary += `${indent}Analiza las métricas por etapa para identificar el punto de quiebre:\n`;
  summary += `${indent}  - Si error rate < 5% en 6000 VUs: Sistema puede manejar >6000\n`;
  summary += `${indent}  - Si error rate > 15% en 6000 VUs: Punto de quiebre alcanzado\n`;
  summary += `${indent}  - Revisa p95 latency: degradación >3s indica saturación\n`;
  
  return summary;
}
