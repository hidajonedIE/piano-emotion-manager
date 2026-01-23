// Verificar qué archivo de traducciones se está cargando
fetch('/locales/es/translations.json')
  .then(r => r.json())
  .then(data => {
    console.log("=== TRADUCCIONES DESDE /locales/es/translations.json ===");
    console.log("Tiene reports?", 'reports' in data);
    if ('reports' in data) {
      console.log("reports.analytics:", data.reports.analytics);
      console.log("reports.revenue:", data.reports.revenue);
      console.log("Todas las claves de reports:", Object.keys(data.reports));
    } else {
      console.log("NO TIENE LA CLAVE 'reports'");
      console.log("Claves disponibles:", Object.keys(data).slice(0, 20));
    }
  })
  .catch(e => console.error("Error cargando traducciones:", e));
