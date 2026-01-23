// Script para debuggear traducciones en consola del navegador
console.log("=== DEBUG TRADUCCIONES ===");

// 1. Verificar qué módulos de traducciones están cargados
const modules = Object.keys(window).filter(k => k.includes('locale') || k.includes('i18n') || k.includes('translation'));
console.log("Módulos relacionados con traducciones:", modules);

// 2. Intentar acceder al objeto de traducciones desde localStorage o sessionStorage
console.log("localStorage keys:", Object.keys(localStorage));
console.log("sessionStorage keys:", Object.keys(sessionStorage));

// 3. Buscar en el objeto window cualquier referencia a traducciones
const searchInWindow = (obj, path = 'window', depth = 0, maxDepth = 3) => {
  if (depth > maxDepth) return;
  
  try {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (key.includes('locale') || key.includes('i18n') || key.includes('translation') || key === 'es' || key === 'en') {
          console.log(`Found at ${path}.${key}:`, obj[key]);
        }
        if (depth < maxDepth) {
          searchInWindow(obj[key], `${path}.${key}`, depth + 1, maxDepth);
        }
      }
    }
  } catch(e) {
    // Ignorar errores de acceso
  }
};

// 4. Inspeccionar el bundle de la aplicación
fetch('/_next/static/chunks/pages/_app.js')
  .then(r => r.text())
  .then(code => {
    const hasReportsTranslations = code.includes('reports.analytics') || code.includes('reports.revenue');
    console.log("Bundle contiene traducciones de reports:", hasReportsTranslations);
    
    // Buscar la estructura de traducciones
    const match = code.match(/reports[:\s]*{[^}]+}/g);
    if (match) {
      console.log("Estructura de reports encontrada en bundle:", match.slice(0, 3));
    }
  })
  .catch(e => console.error("Error al cargar bundle:", e));

console.log("=== FIN DEBUG ===");
