// Script de diagnóstico para verificar la suscripción
// Ejecutar en la consola del navegador (F12) en https://www.pianoemotion.com

console.log('=== DIAGNÓSTICO DE SUSCRIPCIÓN ===');

// 1. Verificar usuario de Clerk
if (window.Clerk) {
  const user = window.Clerk.user;
  console.log('1. Usuario de Clerk:', {
    id: user?.id,
    email: user?.primaryEmailAddress?.emailAddress,
    publicMetadata: user?.publicMetadata
  });
} else {
  console.log('1. Clerk no está disponible en window');
}

// 2. Hacer una petición directa al endpoint de módulos
fetch('/api/trpc/modules.getModulesWithStatus', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('2. Respuesta de modules.getModulesWithStatus:', data);
  
  if (data.result?.data) {
    const modules = data.result.data;
    const premiumModules = modules.filter(m => m.type === 'premium');
    const proModules = modules.filter(m => m.type === 'pro');
    
    console.log('   - Módulos Premium disponibles:', premiumModules.length);
    console.log('   - Módulos Pro disponibles:', proModules.length);
    console.log('   - Módulos Premium habilitados:', premiumModules.filter(m => m.isEnabled).length);
    console.log('   - Módulos Pro habilitados:', proModules.filter(m => m.isEnabled).length);
  }
})
.catch(err => console.error('Error al consultar módulos:', err));

// 3. Verificar el plan actual
fetch('/api/trpc/modules.getCurrentPlan', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('3. Plan actual:', data);
})
.catch(err => console.error('Error al consultar plan:', err));

// 4. Verificar la suscripción actual
fetch('/api/trpc/modules.getCurrentSubscription', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('4. Suscripción actual:', data);
})
.catch(err => console.error('Error al consultar suscripción:', err));

console.log('=== FIN DEL DIAGNÓSTICO ===');
console.log('Por favor, copia toda esta salida y envíala al desarrollador.');
