import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * SPIKE TEST (Test de Picos)
 * 
 * Objetivo: Verificar recuperación del sistema ante picos súbitos de carga
 * Duración: 15 minutos
 * Patrón: 100 → 5,000 → 100 usuarios en ciclos rápidos
 * Detecta: Problemas de escalado, rate limiting, timeouts, recuperación
 */

const BASE_URL = 'https://pianoemotion.com';
const STRESS_TEST_SECRET = 'piano-emotion-stress-test-2026';

// Métricas personalizadas
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const recoveryRate = new Rate('recovery'); // Mide recuperación después del pico

export const options = {
  stages: [
    // Carga base
    { duration: '1m', target: 100 },    // Warm-up: 0 → 100
    { duration: '1m', target: 100 },    // Baseline: 100 usuarios
    
    // PICO 1
    { duration: '30s', target: 5000 },  // Spike: 100 → 5000 en 30s
    { duration: '1m', target: 5000 },   // Hold spike: 5000 usuarios por 1m
    { duration: '30s', target: 100 },   // Recovery: 5000 → 100 en 30s
    { duration: '1m', target: 100 },    // Baseline: 100 usuarios
    
    // PICO 2
    { duration: '30s', target: 5000 },  // Spike: 100 → 5000 en 30s
    { duration: '1m', target: 5000 },   // Hold spike: 5000 usuarios por 1m
    { duration: '30s', target: 100 },   // Recovery: 5000 → 100 en 30s
    { duration: '1m', target: 100 },    // Baseline: 100 usuarios
    
    // PICO 3
    { duration: '30s', target: 5000 },  // Spike: 100 → 5000 en 30s
    { duration: '1m', target: 5000 },   // Hold spike: 5000 usuarios por 1m
    { duration: '30s', target: 100 },   // Recovery: 5000 → 100 en 30s
    { duration: '1m', target: 100 },    // Cool-down: 100 usuarios
    
    { duration: '1m', target: 0 },      // Ramp-down: 100 → 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000', 'p(99)<10000'], // Más tolerante durante picos
    'http_req_failed': ['rate<0.10'],                    // <10% de errores (más tolerante)
    'errors': ['rate<0.10'],
    'success': ['rate>0.90'],                            // >90% de éxito
    'recovery': ['rate>0.95'],                           // >95% de recuperación post-pico
    'checks': ['rate>0.90'],
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
  const isRecoveryPhase = currentVUs < 500; // Detectar fase de recuperación
  
  // 1. Verificar autenticación
  const authResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/auth.me?input={"limit":30}`);
  const authCheck = check(authResponse, {
    'auth.me status 200': (r) => r.status === 200,
    'auth.me response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  if (authCheck) {
    successRate.add(1);
    if (isRecoveryPhase) recoveryRate.add(1);
  } else {
    errorRate.add(1);
    if (isRecoveryPhase) recoveryRate.add(0);
  }

  sleep(0.5);

  // 2. Listar clientes
  const clientsResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/clients.list?input={"limit":30}`);
  const clientsCheck = check(clientsResponse, {
    'clients.list status 200': (r) => r.status === 200,
    'clients.list response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  if (clientsCheck) {
    successRate.add(1);
    if (isRecoveryPhase) recoveryRate.add(1);
  } else {
    errorRate.add(1);
    if (isRecoveryPhase) recoveryRate.add(0);
  }

  sleep(0.5);

  // 3. Listar pianos
  const pianosResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/pianos.list?input={"limit":30}`);
  const pianosCheck = check(pianosResponse, {
    'pianos.list status 200': (r) => r.status === 200,
    'pianos.list response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  if (pianosCheck) {
    successRate.add(1);
    if (isRecoveryPhase) recoveryRate.add(1);
  } else {
    errorRate.add(1);
    if (isRecoveryPhase) recoveryRate.add(0);
  }

  sleep(0.5);

  // 4. Listar servicios
  const servicesResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/services.list?input={"limit":30}`);
  const servicesCheck = check(servicesResponse, {
    'services.list status 200': (r) => r.status === 200,
    'services.list response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  if (servicesCheck) {
    successRate.add(1);
    if (isRecoveryPhase) recoveryRate.add(1);
  } else {
    errorRate.add(1);
    if (isRecoveryPhase) recoveryRate.add(0);
  }

  sleep(0.5);

  // 5. Listar citas
  const appointmentsResponse = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/appointments.list?input={"limit":30}`);
  const appointmentsCheck = check(appointmentsResponse, {
    'appointments.list status 200': (r) => r.status === 200,
    'appointments.list response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  if (appointmentsCheck) {
    successRate.add(1);
    if (isRecoveryPhase) recoveryRate.add(1);
  } else {
    errorRate.add(1);
    if (isRecoveryPhase) recoveryRate.add(0);
  }

  // Pausa entre iteraciones
  sleep(1);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return {
    [`spike-test-${timestamp}.json`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  
  let summary = `\n${indent}=== SPIKE TEST SUMMARY ===\n\n`;
  
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
  if (data.metrics.recovery) {
    summary += `${indent}Recovery Rate: ${(data.metrics.recovery.values.rate * 100).toFixed(2)}%\n`;
  }
  
  summary += `\n${indent}=== SPIKE ANALYSIS ===\n`;
  summary += `${indent}El sistema experimentó 3 picos de 100 → 5000 usuarios.\n`;
  summary += `${indent}Recovery Rate indica qué tan bien se recuperó el sistema después de cada pico.\n`;
  summary += `${indent}Un Recovery Rate >95% indica excelente resiliencia.\n`;
  
  return summary;
}
