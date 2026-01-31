/**
 * Script de Pruebas de Estrés
 * Piano Emotion Manager
 * 
 * Simula carga alta en el sistema para identificar cuellos de botella
 */

import { performance } from 'perf_hooks';

const API_BASE_URL = 'https://www.pianoemotion.com/api/trpc';

interface TestResult {
  name: string;
  endpoint: string;
  duration: number;
  success: boolean;
  error?: string;
  dataSize?: number;
}

const results: TestResult[] = [];

// Función para medir tiempo de respuesta
async function measureEndpoint(name: string, endpoint: string, token?: string): Promise<TestResult> {
  const start = performance.now();
  
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    
    const data = await response.json();
    const end = performance.now();
    const duration = end - start;
    
    return {
      name,
      endpoint,
      duration,
      success: response.ok,
      dataSize: JSON.stringify(data).length,
    };
  } catch (error) {
    const end = performance.now();
    return {
      name,
      endpoint,
      duration: end - start,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Función para ejecutar múltiples requests en paralelo
async function stressTest(name: string, endpoint: string, concurrency: number): Promise<void> {
  console.log(`\n🔥 Prueba de estrés: ${name} (${concurrency} requests concurrentes)`);
  
  const promises = Array.from({ length: concurrency }, () => 
    measureEndpoint(name, endpoint)
  );
  
  const testResults = await Promise.all(promises);
  results.push(...testResults);
  
  // Calcular estadísticas
  const successful = testResults.filter(r => r.success).length;
  const failed = testResults.filter(r => !r.success).length;
  const avgDuration = testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length;
  const minDuration = Math.min(...testResults.map(r => r.duration));
  const maxDuration = Math.max(...testResults.map(r => r.duration));
  
  console.log(`  ✅ Exitosos: ${successful}/${concurrency}`);
  console.log(`  ❌ Fallidos: ${failed}/${concurrency}`);
  console.log(`  ⏱️  Tiempo promedio: ${avgDuration.toFixed(2)}ms`);
  console.log(`  ⚡ Tiempo mínimo: ${minDuration.toFixed(2)}ms`);
  console.log(`  🐌 Tiempo máximo: ${maxDuration.toFixed(2)}ms`);
}

async function main() {
  console.log('🚀 Iniciando pruebas de estrés de Piano Emotion Manager\n');
  console.log('=' .repeat(60));
  
  // NOTA: Estas pruebas son sin autenticación
  // Para pruebas completas, necesitarías un token válido
  
  // Prueba 1: Carga baja (5 requests)
  await stressTest('Carga baja - Alertas', 'alerts.getAll', 5);
  
  // Esperar 2 segundos entre pruebas
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Prueba 2: Carga media (20 requests)
  await stressTest('Carga media - Alertas', 'alerts.getAll', 20);
  
  // Esperar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Prueba 3: Carga alta (50 requests)
  await stressTest('Carga alta - Alertas', 'alerts.getAll', 50);
  
  // Esperar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Prueba 4: Carga extrema (100 requests)
  await stressTest('Carga extrema - Alertas', 'alerts.getAll', 100);
  
  // Generar reporte final
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE FINAL DE PRUEBAS DE ESTRÉS\n');
  
  const totalTests = results.length;
  const totalSuccess = results.filter(r => r.success).length;
  const totalFailed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const successRate = (totalSuccess / totalTests) * 100;
  
  console.log(`Total de requests: ${totalTests}`);
  console.log(`Exitosos: ${totalSuccess} (${successRate.toFixed(2)}%)`);
  console.log(`Fallidos: ${totalFailed} (${(100 - successRate).toFixed(2)}%)`);
  console.log(`Tiempo promedio global: ${avgDuration.toFixed(2)}ms`);
  
  // Análisis de rendimiento
  console.log('\n📈 ANÁLISIS DE RENDIMIENTO:\n');
  
  if (avgDuration < 500) {
    console.log('  ✅ EXCELENTE: Tiempo de respuesta < 500ms');
  } else if (avgDuration < 1000) {
    console.log('  ⚠️  BUENO: Tiempo de respuesta < 1s');
  } else if (avgDuration < 2000) {
    console.log('  ⚠️  ACEPTABLE: Tiempo de respuesta < 2s');
  } else {
    console.log('  ❌ LENTO: Tiempo de respuesta > 2s - Requiere optimización');
  }
  
  if (successRate >= 99) {
    console.log('  ✅ EXCELENTE: Tasa de éxito >= 99%');
  } else if (successRate >= 95) {
    console.log('  ⚠️  BUENO: Tasa de éxito >= 95%');
  } else if (successRate >= 90) {
    console.log('  ⚠️  ACEPTABLE: Tasa de éxito >= 90%');
  } else {
    console.log('  ❌ CRÍTICO: Tasa de éxito < 90% - Requiere atención inmediata');
  }
  
  // Guardar resultados en archivo JSON
  const fs = await import('fs/promises');
  await fs.writeFile(
    '/home/ubuntu/stress-test-results.json',
    JSON.stringify({ results, summary: { totalTests, totalSuccess, totalFailed, avgDuration, successRate } }, null, 2)
  );
  
  console.log('\n✅ Resultados guardados en /home/ubuntu/stress-test-results.json');
  console.log('=' .repeat(60));
}

main().catch(console.error);
