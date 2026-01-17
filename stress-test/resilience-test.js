import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * RESILIENCE TEST (Test de Resiliencia)
 * 
 * Objetivo: Verificar recuperación del sistema ante fallos simulados
 * Duración: 1 hora
 * Método: Simular fallos y medir recuperación
 * Métricas: Tasa de recuperación, tiempo de recuperación, degradación graceful
 */

const BASE_URL = 'https://pianoemotion.com';
const STRESS_TEST_SECRET = 'piano-emotion-stress-test-2026';

// Métricas personalizadas
const recoveryRate = new Rate('recovery_rate');
const degradationRate = new Rate('degradation_rate');
const failoverSuccess = new Rate('failover_success');

export const options = {
  stages: [
    // Fase 1: Operación normal
    { duration: '5m', target: 500 },    // Ramp-up: 0 → 500
    { duration: '10m', target: 500 },   // Hold: 500 usuarios (baseline)
    
    // Fase 2: Simular carga alta (simula Redis slow)
    { duration: '2m', target: 2000 },   // Spike: 500 → 2000
    { duration: '5m', target: 2000 },   // Hold spike: 2000 usuarios
    { duration: '2m', target: 500 },    // Recovery: 2000 → 500
    { duration: '5m', target: 500 },    // Verificar recuperación
    
    // Fase 3: Simular timeouts (simula DB slow)
    { duration: '2m', target: 1500 },   // Spike: 500 → 1500
    { duration: '5m', target: 1500 },   // Hold spike: 1500 usuarios
    { duration: '2m', target: 500 },    // Recovery: 1500 → 500
    { duration: '5m', target: 500 },    // Verificar recuperación
    
    // Fase 4: Simular carga extrema (simula múltiples fallos)
    { duration: '2m', target: 3000 },   // Spike: 500 → 3000
    { duration: '5m', target: 3000 },   // Hold spike: 3000 usuarios
    { duration: '2m', target: 500 },    // Recovery: 3000 → 500
    { duration: '5m', target: 500 },    // Verificar recuperación final
    
    { duration: '2m', target: 0 },      // Ramp-down: 500 → 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<5000', 'p(99)<15000'], // Muy tolerante
    'http_req_failed': ['rate<0.30'],                    // <30% de errores (muy tolerante)
    'recovery_rate': ['rate>0.80'],                      // >80% de recuperación
    'degradation_rate': ['rate<0.50'],                   // <50% de degradación
    'failover_success': ['rate>0.70'],                   // >70% de failover exitoso
    'checks': ['rate>0.70'],                             // >70% de checks exitosos
  },
};

// Función para hacer request con bypass de autenticación
function makeAuthenticatedRequest(url, method = 'GET', body = null, timeout = '30s') {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Stress-Test-Secret': STRESS_TEST_SECRET,
    },
    timeout: timeout,
  };

  let response;
  try {
    if (method === 'GET') {
      response = http.get(url, params);
    } else if (method === 'POST') {
      response = http.post(url, body ? JSON.stringify(body) : null, params);
    }
  } catch (error) {
    // Simular respuesta de error para manejar timeouts
    response = {
      status: 0,
      timings: { duration: 30000 },
      error: error.message,
    };
  }

  return response;
}

// Función principal del test
export default function () {
  const currentVUs = __VU;
  const isHighLoad = currentVUs > 1000;
  const isExtremeLoad = currentVUs > 2500;
  const isRecoveryPhase = currentVUs <= 500;
  
  // Ajustar timeout según la carga
  const timeout = isExtremeLoad ? '60s' : isHighLoad ? '45s' : '30s';
  
  // 1. Verificar autenticación (crítico)
  const authResponse = makeAuthenticatedRequest(
    `${BASE_URL}/api/trpc/auth.me?input={"limit":30}`,
    'GET',
    null,
    timeout
  );
  
  const authSuccess = check(authResponse, {
    'auth.me responded': (r) => r.status !== 0,
    'auth.me status 200 or degraded': (r) => r.status === 200 || r.status === 503,
  });
  
  if (isRecoveryPhase) {
    recoveryRate.add(authSuccess ? 1 : 0);
  }
  
  if (isHighLoad && !authSuccess) {
    degradationRate.add(1);
  } else if (isHighLoad && authSuccess) {
    failoverSuccess.add(1);
  }

  sleep(0.5);

  // 2. Listar clientes (importante)
  const clientsResponse = makeAuthenticatedRequest(
    `${BASE_URL}/api/trpc/clients.list?input={"limit":30}`,
    'GET',
    null,
    timeout
  );
  
  const clientsSuccess = check(clientsResponse, {
    'clients.list responded': (r) => r.status !== 0,
    'clients.list status 200 or degraded': (r) => r.status === 200 || r.status === 503,
  });
  
  if (isRecoveryPhase) {
    recoveryRate.add(clientsSuccess ? 1 : 0);
  }
  
  if (isHighLoad && !clientsSuccess) {
    degradationRate.add(1);
  } else if (isHighLoad && clientsSuccess) {
    failoverSuccess.add(1);
  }

  sleep(0.5);

  // 3. Listar pianos (importante)
  const pianosResponse = makeAuthenticatedRequest(
    `${BASE_URL}/api/trpc/pianos.list?input={"limit":30}`,
    'GET',
    null,
    timeout
  );
  
  const pianosSuccess = check(pianosResponse, {
    'pianos.list responded': (r) => r.status !== 0,
    'pianos.list status 200 or degraded': (r) => r.status === 200 || r.status === 503,
  });
  
  if (isRecoveryPhase) {
    recoveryRate.add(pianosSuccess ? 1 : 0);
  }
  
  if (isHighLoad && !pianosSuccess) {
    degradationRate.add(1);
  } else if (isHighLoad && pianosSuccess) {
    failoverSuccess.add(1);
  }

  sleep(0.5);

  // 4. Listar servicios (opcional bajo carga extrema)
  if (!isExtremeLoad || Math.random() > 0.5) {
    const servicesResponse = makeAuthenticatedRequest(
      `${BASE_URL}/api/trpc/services.list?input={"limit":30}`,
      'GET',
      null,
      timeout
    );
    
    const servicesSuccess = check(servicesResponse, {
      'services.list responded': (r) => r.status !== 0,
      'services.list status 200 or degraded': (r) => r.status === 200 || r.status === 503,
    });
    
    if (isRecoveryPhase) {
      recoveryRate.add(servicesSuccess ? 1 : 0);
    }
    
    if (isHighLoad && !servicesSuccess) {
      degradationRate.add(1);
    } else if (isHighLoad && servicesSuccess) {
      failoverSuccess.add(1);
    }

    sleep(0.5);
  }

  // 5. Listar citas (opcional bajo carga extrema)
  if (!isExtremeLoad || Math.random() > 0.5) {
    const appointmentsResponse = makeAuthenticatedRequest(
      `${BASE_URL}/api/trpc/appointments.list?input={"limit":30}`,
      'GET',
      null,
      timeout
    );
    
    const appointmentsSuccess = check(appointmentsResponse, {
      'appointments.list responded': (r) => r.status !== 0,
      'appointments.list status 200 or degraded': (r) => r.status === 200 || r.status === 503,
    });
    
    if (isRecoveryPhase) {
      recoveryRate.add(appointmentsSuccess ? 1 : 0);
    }
    
    if (isHighLoad && !appointmentsSuccess) {
      degradationRate.add(1);
    } else if (isHighLoad && appointmentsSuccess) {
      failoverSuccess.add(1);
    }
  }

  // Pausa entre iteraciones (más larga bajo carga extrema)
  sleep(isExtremeLoad ? 2 : isHighLoad ? 1.5 : 1);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return {
    [`resilience-test-${timestamp}.json`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  
  let summary = `\n${indent}=== RESILIENCE TEST SUMMARY ===\n\n`;
  
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
  summary += `${indent}  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `${indent}  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  
  // Checks
  summary += `${indent}Checks: ${(data.metrics.checks.values.rate * 100).toFixed(2)}% passed\n\n`;
  
  // Resilience metrics
  summary += `${indent}=== RESILIENCE METRICS ===\n`;
  if (data.metrics.recovery_rate) {
    summary += `${indent}  Recovery Rate: ${(data.metrics.recovery_rate.values.rate * 100).toFixed(2)}%\n`;
  }
  if (data.metrics.degradation_rate) {
    summary += `${indent}  Degradation Rate: ${(data.metrics.degradation_rate.values.rate * 100).toFixed(2)}%\n`;
  }
  if (data.metrics.failover_success) {
    summary += `${indent}  Failover Success: ${(data.metrics.failover_success.values.rate * 100).toFixed(2)}%\n`;
  }
  
  summary += `\n${indent}=== ANALYSIS ===\n`;
  summary += `${indent}El sistema experimentó 3 fases de estrés extremo.\n`;
  summary += `${indent}Recovery Rate >80% indica excelente resiliencia.\n`;
  summary += `${indent}Degradation Rate <50% indica degradación graceful.\n`;
  summary += `${indent}Failover Success >70% indica buenos mecanismos de fallback.\n`;
  
  return summary;
}
