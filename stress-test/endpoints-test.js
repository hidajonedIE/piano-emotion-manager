import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * ENDPOINTS TEST (Test de API Endpoints Individuales)
 * 
 * Objetivo: Identificar endpoints problemáticos específicos
 * Duración: 20 minutos
 * Método: Test aislado de cada endpoint con métricas detalladas
 * Métricas: Latencia p50/p95/p99, tasa de error, throughput por endpoint
 */

const BASE_URL = 'https://pianoemotion.com';
const STRESS_TEST_SECRET = 'piano-emotion-stress-test-2026';

// Métricas personalizadas por endpoint
const authMeLatency = new Trend('auth_me_latency');
const authMeErrors = new Rate('auth_me_errors');

const clientsListLatency = new Trend('clients_list_latency');
const clientsListErrors = new Rate('clients_list_errors');

const pianosListLatency = new Trend('pianos_list_latency');
const pianosListErrors = new Rate('pianos_list_errors');

const servicesListLatency = new Trend('services_list_latency');
const servicesListErrors = new Rate('services_list_errors');

const appointmentsListLatency = new Trend('appointments_list_latency');
const appointmentsListErrors = new Rate('appointments_list_errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Ramp-up: 0 → 100
    { duration: '15m', target: 100 },   // Hold: 100 usuarios por 15 minutos
    { duration: '3m', target: 0 },      // Ramp-down: 100 → 0
  ],
  thresholds: {
    // Thresholds globales
    'http_req_duration': ['p(95)<1000', 'p(99)<3000'],
    'http_req_failed': ['rate<0.05'],
    
    // Thresholds por endpoint
    'auth_me_latency': ['p(95)<500', 'p(99)<1000'],
    'auth_me_errors': ['rate<0.05'],
    
    'clients_list_latency': ['p(95)<1000', 'p(99)<2000'],
    'clients_list_errors': ['rate<0.05'],
    
    'pianos_list_latency': ['p(95)<1000', 'p(99)<2000'],
    'pianos_list_errors': ['rate<0.05'],
    
    'services_list_latency': ['p(95)<1000', 'p(99)<2000'],
    'services_list_errors': ['rate<0.05'],
    
    'appointments_list_latency': ['p(95)<1000', 'p(99)<2000'],
    'appointments_list_errors': ['rate<0.05'],
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
  // Rotar entre endpoints para distribuir la carga
  const iteration = __ITER % 5;
  
  if (iteration === 0) {
    // Test auth.me
    const response = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/auth.me?input={"limit":30}`);
    
    authMeLatency.add(response.timings.duration);
    
    const success = check(response, {
      'auth.me status 200': (r) => r.status === 200,
      'auth.me response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    
    authMeErrors.add(!success ? 1 : 0);
    
  } else if (iteration === 1) {
    // Test clients.list
    const response = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/clients.list?input={"limit":30}`);
    
    clientsListLatency.add(response.timings.duration);
    
    const success = check(response, {
      'clients.list status 200': (r) => r.status === 200,
      'clients.list response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    
    clientsListErrors.add(!success ? 1 : 0);
    
  } else if (iteration === 2) {
    // Test pianos.list
    const response = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/pianos.list?input={"limit":30}`);
    
    pianosListLatency.add(response.timings.duration);
    
    const success = check(response, {
      'pianos.list status 200': (r) => r.status === 200,
      'pianos.list response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    
    pianosListErrors.add(!success ? 1 : 0);
    
  } else if (iteration === 3) {
    // Test services.list
    const response = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/services.list?input={"limit":30}`);
    
    servicesListLatency.add(response.timings.duration);
    
    const success = check(response, {
      'services.list status 200': (r) => r.status === 200,
      'services.list response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    
    servicesListErrors.add(!success ? 1 : 0);
    
  } else if (iteration === 4) {
    // Test appointments.list
    const response = makeAuthenticatedRequest(`${BASE_URL}/api/trpc/appointments.list?input={"limit":30}`);
    
    appointmentsListLatency.add(response.timings.duration);
    
    const success = check(response, {
      'appointments.list status 200': (r) => r.status === 200,
      'appointments.list response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    
    appointmentsListErrors.add(!success ? 1 : 0);
  }
  
  // Pausa entre requests
  sleep(1);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return {
    [`endpoints-test-${timestamp}.json`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  
  let summary = `\n${indent}=== ENDPOINTS TEST SUMMARY ===\n\n`;
  
  // Métricas generales
  summary += `${indent}Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += `${indent}VUs: ${data.metrics.vus.values.max}\n`;
  summary += `${indent}Iterations: ${data.metrics.iterations.values.count}\n`;
  summary += `${indent}Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}Throughput: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  
  // Métricas por endpoint
  summary += `${indent}=== ENDPOINT METRICS ===\n\n`;
  
  // auth.me
  if (data.metrics.auth_me_latency) {
    const errorRate = data.metrics.auth_me_errors ? data.metrics.auth_me_errors.values.rate : 0;
    summary += `${indent}auth.me:\n`;
    summary += `${indent}  Latency p50: ${data.metrics.auth_me_latency.values['p(50)'].toFixed(2)}ms\n`;
    summary += `${indent}  Latency p95: ${data.metrics.auth_me_latency.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  Latency p99: ${data.metrics.auth_me_latency.values['p(99)'].toFixed(2)}ms\n`;
    summary += `${indent}  Error rate: ${(errorRate * 100).toFixed(2)}%\n`;
    summary += `${indent}  Status: ${errorRate < 0.05 ? '✅ OK' : '❌ FAIL'}\n\n`;
  }
  
  // clients.list
  if (data.metrics.clients_list_latency) {
    const errorRate = data.metrics.clients_list_errors ? data.metrics.clients_list_errors.values.rate : 0;
    summary += `${indent}clients.list:\n`;
    summary += `${indent}  Latency p50: ${data.metrics.clients_list_latency.values['p(50)'].toFixed(2)}ms\n`;
    summary += `${indent}  Latency p95: ${data.metrics.clients_list_latency.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  Latency p99: ${data.metrics.clients_list_latency.values['p(99)'].toFixed(2)}ms\n`;
    summary += `${indent}  Error rate: ${(errorRate * 100).toFixed(2)}%\n`;
    summary += `${indent}  Status: ${errorRate < 0.05 ? '✅ OK' : '❌ FAIL'}\n\n`;
  }
  
  // pianos.list
  if (data.metrics.pianos_list_latency) {
    const errorRate = data.metrics.pianos_list_errors ? data.metrics.pianos_list_errors.values.rate : 0;
    summary += `${indent}pianos.list:\n`;
    summary += `${indent}  Latency p50: ${data.metrics.pianos_list_latency.values['p(50)'].toFixed(2)}ms\n`;
    summary += `${indent}  Latency p95: ${data.metrics.pianos_list_latency.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  Latency p99: ${data.metrics.pianos_list_latency.values['p(99)'].toFixed(2)}ms\n`;
    summary += `${indent}  Error rate: ${(errorRate * 100).toFixed(2)}%\n`;
    summary += `${indent}  Status: ${errorRate < 0.05 ? '✅ OK' : '❌ FAIL'}\n\n`;
  }
  
  // services.list
  if (data.metrics.services_list_latency) {
    const errorRate = data.metrics.services_list_errors ? data.metrics.services_list_errors.values.rate : 0;
    summary += `${indent}services.list:\n`;
    summary += `${indent}  Latency p50: ${data.metrics.services_list_latency.values['p(50)'].toFixed(2)}ms\n`;
    summary += `${indent}  Latency p95: ${data.metrics.services_list_latency.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  Latency p99: ${data.metrics.services_list_latency.values['p(99)'].toFixed(2)}ms\n`;
    summary += `${indent}  Error rate: ${(errorRate * 100).toFixed(2)}%\n`;
    summary += `${indent}  Status: ${errorRate < 0.05 ? '✅ OK' : '❌ FAIL'}\n\n`;
  }
  
  // appointments.list
  if (data.metrics.appointments_list_latency) {
    const errorRate = data.metrics.appointments_list_errors ? data.metrics.appointments_list_errors.values.rate : 0;
    summary += `${indent}appointments.list:\n`;
    summary += `${indent}  Latency p50: ${data.metrics.appointments_list_latency.values['p(50)'].toFixed(2)}ms\n`;
    summary += `${indent}  Latency p95: ${data.metrics.appointments_list_latency.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  Latency p99: ${data.metrics.appointments_list_latency.values['p(99)'].toFixed(2)}ms\n`;
    summary += `${indent}  Error rate: ${(errorRate * 100).toFixed(2)}%\n`;
    summary += `${indent}  Status: ${errorRate < 0.05 ? '✅ OK' : '❌ FAIL'}\n\n`;
  }
  
  summary += `${indent}=== ANALYSIS ===\n`;
  summary += `${indent}Este test identifica endpoints problemáticos específicos.\n`;
  summary += `${indent}Endpoints con error rate >5% o p95 >2000ms necesitan optimización.\n`;
  summary += `${indent}Prioriza la optimización de endpoints con mayor error rate.\n`;
  
  return summary;
}
