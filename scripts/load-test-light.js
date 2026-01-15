/**
 * Prueba de Estrés Ligera - Piano Emotion Manager
 * 
 * Prueba inicial para validar optimizaciones sin saturar el servidor
 * Escala: 0 → 100 → 500 usuarios en 10 minutos
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Warm-up: 0 → 50
    { duration: '3m', target: 100 },  // Ramp-up: 50 → 100
    { duration: '3m', target: 100 },  // Plateau: 100 constante
    { duration: '2m', target: 500 },  // Peak: 100 → 500
    { duration: '3m', target: 500 },  // Stress: 500 constante
    { duration: '2m', target: 0 },    // Ramp-down: 500 → 0
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<3000', 'p(99)<5000'],
    'errors': ['rate<0.05'],
    'http_req_failed': ['rate<0.10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://pianoemotion.com';

export function setup() {
  console.log(`🚀 Prueba ligera en: ${BASE_URL}`);
  console.log(`📊 Objetivo: 500 usuarios máximo`);
  console.log(`⏱️  Duración: 15 minutos`);
  return { baseUrl: BASE_URL };
}

export default function (data) {
  // Test 1: Homepage
  const homeRes = http.get(`${data.baseUrl}/`);
  const homeOk = check(homeRes, {
    'home status ok': (r) => r.status === 200,
    'home fast': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!homeOk);
  apiDuration.add(homeRes.timings.duration);
  
  sleep(1);
  
  // Test 2: Clientes page (puede requerir auth)
  const clientsRes = http.get(`${data.baseUrl}/clientes`);
  const clientsOk = check(clientsRes, {
    'clients status ok': (r) => r.status === 200 || r.status === 401,
    'clients fast': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!clientsOk);
  apiDuration.add(clientsRes.timings.duration);
  
  sleep(2);
  
  // Test 3: Pianos page
  const pianosRes = http.get(`${data.baseUrl}/pianos`);
  const pianosOk = check(pianosRes, {
    'pianos status ok': (r) => r.status === 200 || r.status === 401,
    'pianos fast': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!pianosOk);
  apiDuration.add(pianosRes.timings.duration);
  
  sleep(2);
}

export function teardown(data) {
  console.log(`\n✅ Prueba ligera completada`);
}
