-- Agregar índices para mejorar el rendimiento de queries bajo carga alta
-- Piano Emotion Manager - Optimización para 2500 usuarios concurrentes

-- Índices para tabla clients
CREATE INDEX IF NOT EXISTS idx_clients_userid ON clients(userId);
CREATE INDEX IF NOT EXISTS idx_clients_partnerid ON clients(partnerId);
CREATE INDEX IF NOT EXISTS idx_clients_odid ON clients(odId);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_updated ON clients(updatedAt);

-- Índices para tabla pianos
CREATE INDEX IF NOT EXISTS idx_pianos_userid ON pianos(userId);
CREATE INDEX IF NOT EXISTS idx_pianos_partnerid ON pianos(partnerId);
CREATE INDEX IF NOT EXISTS idx_pianos_odid ON pianos(odId);
CREATE INDEX IF NOT EXISTS idx_pianos_clientid ON pianos(clientId);
CREATE INDEX IF NOT EXISTS idx_pianos_brand ON pianos(brand);
CREATE INDEX IF NOT EXISTS idx_pianos_category ON pianos(category);
CREATE INDEX IF NOT EXISTS idx_pianos_condition ON pianos(`condition`);
CREATE INDEX IF NOT EXISTS idx_pianos_updated ON pianos(updatedAt);

-- Índices para tabla services
CREATE INDEX IF NOT EXISTS idx_services_userid ON services(userId);
CREATE INDEX IF NOT EXISTS idx_services_partnerid ON services(partnerId);
CREATE INDEX IF NOT EXISTS idx_services_odid ON services(odId);
CREATE INDEX IF NOT EXISTS idx_services_clientid ON services(clientId);
CREATE INDEX IF NOT EXISTS idx_services_pianoid ON services(pianoId);
CREATE INDEX IF NOT EXISTS idx_services_type ON services(serviceType);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_date ON services(date);

-- Índices para tabla appointments
CREATE INDEX IF NOT EXISTS idx_appointments_userid ON appointments(userId);
CREATE INDEX IF NOT EXISTS idx_appointments_partnerid ON appointments(partnerId);
CREATE INDEX IF NOT EXISTS idx_appointments_odid ON appointments(odId);
CREATE INDEX IF NOT EXISTS idx_appointments_clientid ON appointments(clientId);
CREATE INDEX IF NOT EXISTS idx_appointments_pianoid ON appointments(pianoId);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- Índices para tabla users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_clerkid ON users(clerkId);
CREATE INDEX IF NOT EXISTS idx_users_partnerid ON users(partnerId);

-- Índices compuestos para queries comunes
CREATE INDEX IF NOT EXISTS idx_clients_partner_od ON clients(partnerId, odId);
CREATE INDEX IF NOT EXISTS idx_pianos_partner_od ON pianos(partnerId, odId);
CREATE INDEX IF NOT EXISTS idx_services_partner_od ON services(partnerId, odId);
CREATE INDEX IF NOT EXISTS idx_appointments_partner_od ON appointments(partnerId, odId);

-- Índices para búsquedas de texto
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_pianos_serial ON pianos(serialNumber);
CREATE INDEX IF NOT EXISTS idx_pianos_model ON pianos(model);
