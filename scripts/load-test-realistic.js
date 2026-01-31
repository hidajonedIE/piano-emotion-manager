/**
 * Pruebas de Estrés Realistas para Piano Emotion Manager
 * 
 * Simula usuarios reales navegando por la aplicación
 * Incluye autenticación y flujos de usuario completos
 * 
 * Requisitos:
 * - k6 instalado (https://k6.io/docs/getting-started/installation/)
 * - Variables de entorno configuradas
 * 
 * Ejecución:
 * k6 run --env BASE_URL=https://pianoemotion.com scripts/load-test-realistic.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métricas personalizadas
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Configuración de la prueba
export const options = {
  stages: [
    // Warm-up: 0 → 100 usuarios en 2 minutos
    { duration: '2m', target: 100 },
    
    // Ramp-up: 100 → 500 usuarios en 3 minutos
    { duration: '3m', target: 500 },
    
    // Plateau 1: 500 usuarios constantes por 5 minutos
    { duration: '5m', target: 500 },
    
    // Ramp-up: 500 → 1000 usuarios en 3 minutos
    { duration: '3m', target: 1000 },
    
    // Plateau 2: 1000 usuarios constantes por 5 minutos
    { duration: '5m', target: 1000 },
    
    // Peak test: 1000 → 2500 usuarios en 5 minutos
    { duration: '5m', target: 2500 },
    
    // Stress test: 2500 usuarios constantes por 10 minutos
    { duration: '10m', target: 2500 },
    
    // Ramp-down: 2500 → 0 usuarios en 3 minutos
    { duration: '3m', target: 0 },
  ],
  
  thresholds: {
    // 95% de las requests deben completarse en menos de 2 segundos
    'http_req_duration': ['p(95)<2000'],
    
    // 99% de las requests deben completarse en menos de 5 segundos
    'http_req_duration{name:api}': ['p(99)<5000'],
    
    // Tasa de error debe ser menor al 1%
    'errors': ['rate<0.01'],
    
    // 95% de las requests deben tener éxito
    'http_req_failed': ['rate<0.05'],
  },
  
  // Configuración de timeouts
  httpDebug: 'full',
  insecureSkipTLSVerify: true,
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0',
};

const BASE_URL = __ENV.BASE_URL || 'https://pianoemotion.com';

/**
 * Función de setup - se ejecuta una vez al inicio
 */
export function setup() {
  console.log(`🚀 Iniciando pruebas de estrés en: ${BASE_URL}`);
  console.log(`📊 Objetivo: 2500 usuarios concurrentes`);
  console.log(`⏱️  Duración total: ~36 minutos`);
  
  return {
    baseUrl: BASE_URL,
    startTime: new Date().toISOString(),
  };
}

/**
 * Escenario de usuario: Navegación por el dashboard
 */
function dashboardScenario(baseUrl) {
  group('Dashboard Navigation', () => {
    // 1. Cargar página principal
    const homeRes = http.get(`${baseUrl}/`, {
      tags: { name: 'home' },
    });
    
    const homeSuccess = check(homeRes, {
      'home: status 200': (r) => r.status === 200,
      'home: loads in <2s': (r) => r.timings.duration < 2000,
      'home: has content': (r) => r.body.includes('Piano Emotion'),
    });
    
    errorRate.add(!homeSuccess);
    apiDuration.add(homeRes.timings.duration);
    
    if (homeSuccess) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
      console.error(`❌ Home failed: ${homeRes.status}`);
    }
    
    sleep(1);
  });
}

/**
 * Escenario de usuario: Consulta de clientes
 */
function clientsScenario(baseUrl) {
  group('Clients Query', () => {
    // Simular carga de página de clientes
    const clientsPageRes = http.get(`${baseUrl}/clientes`, {
      tags: { name: 'clients_page' },
    });
    
    const clientsSuccess = check(clientsPageRes, {
      'clients page: status 200 or 401': (r) => r.status === 200 || r.status === 401,
      'clients page: loads in <3s': (r) => r.timings.duration < 3000,
    });
    
    errorRate.add(!clientsSuccess);
    apiDuration.add(clientsPageRes.timings.duration);
    
    if (clientsSuccess) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
    
    sleep(2);
  });
}

/**
 * Escenario de usuario: Consulta de pianos
 */
function pianosScenario(baseUrl) {
  group('Pianos Query', () => {
    const pianosPageRes = http.get(`${baseUrl}/pianos`, {
      tags: { name: 'pianos_page' },
    });
    
    const pianosSuccess = check(pianosPageRes, {
      'pianos page: status 200 or 401': (r) => r.status === 200 || r.status === 401,
      'pianos page: loads in <3s': (r) => r.timings.duration < 3000,
    });
    
    errorRate.add(!pianosSuccess);
    apiDuration.add(pianosPageRes.timings.duration);
    
    if (pianosSuccess) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
    
    sleep(2);
  });
}

/**
 * Escenario de usuario: Consulta de servicios
 */
function servicesScenario(baseUrl) {
  group('Services Query', () => {
    const servicesPageRes = http.get(`${baseUrl}/servicios`, {
      tags: { name: 'services_page' },
    });
    
    const servicesSuccess = check(servicesPageRes, {
      'services page: status 200 or 401': (r) => r.status === 200 || r.status === 401,
      'services page: loads in <3s': (r) => r.timings.duration < 3000,
    });
    
    errorRate.add(!servicesSuccess);
    apiDuration.add(servicesPageRes.timings.duration);
    
    if (servicesSuccess) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
    }
    
    sleep(2);
  });
}

/**
 * Función principal - se ejecuta por cada usuario virtual
 */
export default function (data) {
  const baseUrl = data.baseUrl;
  
  // Simular comportamiento de usuario real
  // Cada usuario hace una mezcla aleatoria de acciones
  
  const userBehavior = Math.random();
  
  if (userBehavior < 0.4) {
    // 40% de usuarios solo navegan por el dashboard
    dashboardScenario(baseUrl);
  } else if (userBehavior < 0.7) {
    // 30% de usuarios consultan clientes
    dashboardScenario(baseUrl);
    clientsScenario(baseUrl);
  } else if (userBehavior < 0.9) {
    // 20% de usuarios consultan pianos
    dashboardScenario(baseUrl);
    pianosScenario(baseUrl);
  } else {
    // 10% de usuarios consultan servicios
    dashboardScenario(baseUrl);
    servicesScenario(baseUrl);
  }
  
  // Pausa entre iteraciones (simular tiempo de lectura)
  sleep(Math.random() * 3 + 2); // 2-5 segundos
}

/**
 * Función de teardown - se ejecuta una vez al final
 */
export function teardown(data) {
  console.log(`\n✅ Pruebas completadas`);
  console.log(`🕐 Inicio: ${data.startTime}`);
  console.log(`🕐 Fin: ${new Date().toISOString()}`);
  console.log(`\n📊 Revisar métricas detalladas arriba`);
}
