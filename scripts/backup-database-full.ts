import { db } from "../server/_core/db.js";
import { 
  users, 
  clients, 
  pianos, 
  services, 
  invoices, 
  quotes, 
  appointments 
} from "../drizzle/schema.js";
import * as fs from "fs";
import * as path from "path";

async function backupDatabase() {
  console.log("🔄 Iniciando backup completo de la base de datos...");
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");
  
  // Crear directorio de backups si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
  
  try {
    // Obtener todos los datos
    const [
      usersData,
      clientsData,
      pianosData,
      servicesData,
      invoicesData,
      quotesData,
      appointmentsData
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(clients),
      db.select().from(pianos),
      db.select().from(services),
      db.select().from(invoices),
      db.select().from(quotes),
      db.select().from(appointments)
    ]);
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      database: "piano_emotion_db",
      data: {
        users: usersData,
        clients: clientsData,
        pianos: pianosData,
        services: servicesData,
        invoices: invoicesData,
        quotes: quotesData,
        appointments: appointmentsData
      },
      stats: {
        users: usersData.length,
        clients: clientsData.length,
        pianos: pianosData.length,
        services: servicesData.length,
        invoices: invoicesData.length,
        quotes: quotesData.length,
        appointments: appointmentsData.length
      }
    };
    
    // Guardar backup
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log("✅ Backup completado exitosamente!");
    console.log(`📁 Archivo: ${backupFile}`);
    console.log("\n📊 Estadísticas:");
    console.log(`   - Usuarios: ${backup.stats.users}`);
    console.log(`   - Clientes: ${backup.stats.clients}`);
    console.log(`   - Pianos: ${backup.stats.pianos}`);
    console.log(`   - Servicios: ${backup.stats.services}`);
    console.log(`   - Facturas: ${backup.stats.invoices}`);
    console.log(`   - Presupuestos: ${backup.stats.quotes}`);
    console.log(`   - Citas: ${backup.stats.appointments}`);
    
    return backupFile;
  } catch (error) {
    console.error("❌ Error durante el backup:", error);
    throw error;
  }
}

backupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
