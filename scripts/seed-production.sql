-- ============================================================================
-- Script de Seed - Datos de Prueba para Piano Emotion Manager
-- ============================================================================
-- Este script inserta datos de prueba realistas directamente en la base de datos
-- Ejecutar con: mysql -h host -u user -p database < seed-production.sql
-- ============================================================================

-- Usar el openId del usuario demo existente
SET @OWNER_ID = 'demo-user-piano-emotion-2024';

-- ============================================================================
-- LIMPIAR DATOS EXISTENTES (opcional - comentar si no se desea)
-- ============================================================================
-- DELETE FROM services WHERE odId = @OWNER_ID;
-- DELETE FROM appointments WHERE odId = @OWNER_ID;
-- DELETE FROM invoices WHERE odId = @OWNER_ID;
-- DELETE FROM quotes WHERE odId = @OWNER_ID;
-- DELETE FROM pianos WHERE odId = @OWNER_ID;
-- DELETE FROM clients WHERE odId = @OWNER_ID;
-- DELETE FROM inventory WHERE odId = @OWNER_ID;
-- DELETE FROM serviceRates WHERE odId = @OWNER_ID;

-- ============================================================================
-- INSERTAR CLIENTES (17 clientes variados)
-- ============================================================================
INSERT INTO clients (odId, name, email, phone, address, clientType, city, region, postalCode, notes) VALUES
(@OWNER_ID, 'María García López', 'maria.garcia@email.com', '+34 612 345 678', 'Calle Mayor 15, 3º A', 'particular', 'Madrid', 'Comunidad de Madrid', '28013', 'Cliente desde 2020. Prefiere citas por la tarde.'),
(@OWNER_ID, 'Conservatorio Municipal de Música', 'info@conservatorio-madrid.es', '+34 915 678 901', 'Avenida de la Música 42', 'conservatory', 'Madrid', 'Comunidad de Madrid', '28020', 'Contrato anual de mantenimiento. 12 pianos.'),
(@OWNER_ID, 'Carlos Rodríguez Martín', 'carlos.rodriguez@gmail.com', '+34 623 456 789', 'Plaza del Sol 8, 2º B', 'professional', 'Barcelona', 'Cataluña', '08001', 'Pianista profesional. Requiere afinación frecuente.'),
(@OWNER_ID, 'Academia de Música Allegro', 'contacto@academiaallegro.com', '+34 934 567 890', 'Carrer de Balmes 156', 'music_school', 'Barcelona', 'Cataluña', '08008', '5 pianos verticales y 2 de cola.'),
(@OWNER_ID, 'Ana Fernández Ruiz', 'ana.fernandez@outlook.com', '+34 634 567 890', 'Calle Sierpes 23, 1º', 'student', 'Sevilla', 'Andalucía', '41004', 'Estudiante de piano. Piano heredado de su abuela.'),
(@OWNER_ID, 'Teatro Real de Madrid', 'tecnico@teatroreal.es', '+34 915 160 660', 'Plaza de Isabel II, s/n', 'concert_hall', 'Madrid', 'Comunidad de Madrid', '28013', 'Steinway de concierto. Afinación antes de cada evento.'),
(@OWNER_ID, 'Pedro Sánchez Gómez', 'pedro.sanchez@yahoo.es', '+34 645 678 901', 'Avenida del Puerto 78, 5º C', 'particular', 'Valencia', 'Comunidad Valenciana', '46021', 'Piano Yamaha U3. Afinación semestral.'),
(@OWNER_ID, 'Escuela de Música Sonata', 'info@escuelasonata.es', '+34 963 456 789', 'Calle Colón 45', 'music_school', 'Valencia', 'Comunidad Valenciana', '46004', '8 pianos. Mantenimiento trimestral.'),
(@OWNER_ID, 'Laura Martínez Pérez', 'laura.martinez@gmail.com', '+34 656 789 012', 'Gran Vía 102, 4º D', 'professional', 'Bilbao', 'País Vasco', '48001', 'Profesora de piano. Bechstein de media cola.'),
(@OWNER_ID, 'Auditorio Nacional', 'mantenimiento@auditorionacional.es', '+34 913 370 140', 'Calle Príncipe de Vergara 146', 'concert_hall', 'Madrid', 'Comunidad de Madrid', '28002', 'Dos Steinway D-274. Servicio premium.'),
(@OWNER_ID, 'Miguel Ángel Torres', 'miguelangel.torres@hotmail.com', '+34 667 890 123', 'Paseo de Gracia 88, 6º', 'particular', 'Barcelona', 'Cataluña', '08008', 'Coleccionista. 3 pianos antiguos.'),
(@OWNER_ID, 'Conservatorio Superior de Música', 'secretaria@csm-sevilla.es', '+34 954 567 890', 'Calle Baños 48', 'conservatory', 'Sevilla', 'Andalucía', '41002', '20 pianos. Contrato de mantenimiento anual.'),
(@OWNER_ID, 'Isabel López Navarro', 'isabel.lopez@email.com', '+34 678 901 234', 'Calle Larios 15, 2º A', 'student', 'Málaga', 'Andalucía', '29005', 'Piano Kawai. Primera afinación.'),
(@OWNER_ID, 'Hotel Palace Madrid', 'eventos@hotelpalace.es', '+34 913 608 000', 'Plaza de las Cortes 7', 'concert_hall', 'Madrid', 'Comunidad de Madrid', '28014', 'Piano de cola en el salón principal.'),
(@OWNER_ID, 'Roberto Díaz Fernández', 'roberto.diaz@gmail.com', '+34 689 012 345', 'Calle San Fernando 32', 'particular', 'Zaragoza', 'Aragón', '50001', 'Piano Petrof. Afinación anual.'),
(@OWNER_ID, 'Colegio Alemán de Madrid', 'musica@colegioaleman.es', '+34 917 456 789', 'Calle Concha Espina 32', 'music_school', 'Madrid', 'Comunidad de Madrid', '28016', '4 pianos en el departamento de música.'),
(@OWNER_ID, 'Elena Ruiz García', 'elena.ruiz@outlook.es', '+34 690 123 456', 'Avenida de la Constitución 20, 3º', 'professional', 'Granada', 'Andalucía', '18001', 'Concertista. Steinway B-211.');

-- ============================================================================
-- INSERTAR PIANOS (asociados a los clientes insertados)
-- ============================================================================
-- Necesitamos obtener los IDs de los clientes recién insertados
-- Usaremos subconsultas para obtener los IDs

INSERT INTO pianos (odId, clientId, brand, model, serialNumber, year, category, pianoType, `condition`, location, notes) VALUES
-- María García (cliente 1)
(@OWNER_ID, (SELECT id FROM clients WHERE email='maria.garcia@email.com' AND odId=@OWNER_ID LIMIT 1), 'Yamaha', 'U3', 'YU3-456789', 2015, 'vertical', 'Vertical Profesional', 'excellent', 'Salón principal', NULL),

-- Conservatorio Municipal (cliente 2) - 3 pianos
(@OWNER_ID, (SELECT id FROM clients WHERE email='info@conservatorio-madrid.es' AND odId=@OWNER_ID LIMIT 1), 'Steinway & Sons', 'D-274', 'STW-123456', 2018, 'grand', 'Gran Cola de Concierto', 'excellent', 'Auditorio principal', NULL),
(@OWNER_ID, (SELECT id FROM clients WHERE email='info@conservatorio-madrid.es' AND odId=@OWNER_ID LIMIT 1), 'Yamaha', 'C7', 'YC7-789012', 2016, 'grand', 'Cola de Concierto', 'good', 'Sala de ensayo 1', NULL),
(@OWNER_ID, (SELECT id FROM clients WHERE email='info@conservatorio-madrid.es' AND odId=@OWNER_ID LIMIT 1), 'Kawai', 'K-500', 'KW-345678', 2019, 'vertical', 'Vertical Profesional', 'excellent', 'Aula 101', NULL),

-- Carlos Rodríguez (cliente 3)
(@OWNER_ID, (SELECT id FROM clients WHERE email='carlos.rodriguez@gmail.com' AND odId=@OWNER_ID LIMIT 1), 'Bösendorfer', '225', 'BOS-567890', 2010, 'grand', 'Media Cola', 'excellent', 'Estudio de grabación', NULL),

-- Academia Allegro (cliente 4) - 2 pianos
(@OWNER_ID, (SELECT id FROM clients WHERE email='contacto@academiaallegro.com' AND odId=@OWNER_ID LIMIT 1), 'Yamaha', 'U1', 'YU1-901234', 2017, 'vertical', 'Vertical Estudio', 'good', 'Aula 1', NULL),
(@OWNER_ID, (SELECT id FROM clients WHERE email='contacto@academiaallegro.com' AND odId=@OWNER_ID LIMIT 1), 'Kawai', 'GL-30', 'KGL-234567', 2020, 'grand', 'Cuarto de Cola', 'excellent', 'Sala de conciertos', NULL),

-- Ana Fernández (cliente 5)
(@OWNER_ID, (SELECT id FROM clients WHERE email='ana.fernandez@outlook.com' AND odId=@OWNER_ID LIMIT 1), 'Pleyel', 'P118', 'PL-678901', 1985, 'vertical', 'Vertical Antiguo', 'fair', 'Habitación de estudio', 'Piano heredado. Necesita restauración de martillos.'),

-- Teatro Real (cliente 6) - 2 pianos
(@OWNER_ID, (SELECT id FROM clients WHERE email='tecnico@teatroreal.es' AND odId=@OWNER_ID LIMIT 1), 'Steinway & Sons', 'D-274', 'STW-111222', 2020, 'grand', 'Gran Cola de Concierto', 'excellent', 'Escenario principal', NULL),
(@OWNER_ID, (SELECT id FROM clients WHERE email='tecnico@teatroreal.es' AND odId=@OWNER_ID LIMIT 1), 'Steinway & Sons', 'B-211', 'STW-333444', 2019, 'grand', 'Media Cola', 'excellent', 'Sala de ensayos', NULL),

-- Pedro Sánchez (cliente 7)
(@OWNER_ID, (SELECT id FROM clients WHERE email='pedro.sanchez@yahoo.es' AND odId=@OWNER_ID LIMIT 1), 'Yamaha', 'U3', 'YU3-555666', 2012, 'vertical', 'Vertical Profesional', 'good', 'Salón', NULL),

-- Escuela Sonata (cliente 8) - 2 pianos
(@OWNER_ID, (SELECT id FROM clients WHERE email='info@escuelasonata.es' AND odId=@OWNER_ID LIMIT 1), 'Kawai', 'K-300', 'KK3-777888', 2018, 'vertical', 'Vertical Estudio', 'good', 'Aula principal', NULL),
(@OWNER_ID, (SELECT id FROM clients WHERE email='info@escuelasonata.es' AND odId=@OWNER_ID LIMIT 1), 'Yamaha', 'GB1K', 'YGB-999000', 2021, 'grand', 'Baby Grand', 'excellent', 'Sala de recitales', NULL),

-- Laura Martínez (cliente 9)
(@OWNER_ID, (SELECT id FROM clients WHERE email='laura.martinez@gmail.com' AND odId=@OWNER_ID LIMIT 1), 'Bechstein', 'M/P 192', 'BCH-112233', 2014, 'grand', 'Media Cola', 'excellent', 'Estudio privado', NULL),

-- Auditorio Nacional (cliente 10) - 2 pianos
(@OWNER_ID, (SELECT id FROM clients WHERE email='mantenimiento@auditorionacional.es' AND odId=@OWNER_ID LIMIT 1), 'Steinway & Sons', 'D-274', 'STW-445566', 2021, 'grand', 'Gran Cola de Concierto', 'excellent', 'Sala Sinfónica', NULL),
(@OWNER_ID, (SELECT id FROM clients WHERE email='mantenimiento@auditorionacional.es' AND odId=@OWNER_ID LIMIT 1), 'Steinway & Sons', 'D-274', 'STW-778899', 2020, 'grand', 'Gran Cola de Concierto', 'excellent', 'Sala de Cámara', NULL),

-- Miguel Ángel Torres (cliente 11) - 3 pianos antiguos
(@OWNER_ID, (SELECT id FROM clients WHERE email='miguelangel.torres@hotmail.com' AND odId=@OWNER_ID LIMIT 1), 'Érard', 'Grand', 'ERA-1890', 1890, 'grand', 'Piano Antiguo', 'fair', 'Salón principal', 'Piano de colección. Valor histórico.'),
(@OWNER_ID, (SELECT id FROM clients WHERE email='miguelangel.torres@hotmail.com' AND odId=@OWNER_ID LIMIT 1), 'Blüthner', 'Model 6', 'BLU-1920', 1920, 'grand', 'Media Cola Antiguo', 'good', 'Biblioteca', 'Restaurado en 2015.'),
(@OWNER_ID, (SELECT id FROM clients WHERE email='miguelangel.torres@hotmail.com' AND odId=@OWNER_ID LIMIT 1), 'Pleyel', 'Grand Modèle', 'PLY-1905', 1905, 'grand', 'Cola Antiguo', 'fair', 'Sala de música', 'Necesita restauración completa.'),

-- Conservatorio Superior Sevilla (cliente 12) - 2 pianos
(@OWNER_ID, (SELECT id FROM clients WHERE email='secretaria@csm-sevilla.es' AND odId=@OWNER_ID LIMIT 1), 'Steinway & Sons', 'B-211', 'STW-SEV001', 2019, 'grand', 'Media Cola', 'excellent', 'Sala de conciertos', NULL),
(@OWNER_ID, (SELECT id FROM clients WHERE email='secretaria@csm-sevilla.es' AND odId=@OWNER_ID LIMIT 1), 'Yamaha', 'C3X', 'YC3X-SEV002', 2020, 'grand', 'Cuarto de Cola', 'excellent', 'Aula magna', NULL),

-- Isabel López (cliente 13)
(@OWNER_ID, (SELECT id FROM clients WHERE email='isabel.lopez@email.com' AND odId=@OWNER_ID LIMIT 1), 'Kawai', 'K-200', 'KK2-MAL001', 2022, 'vertical', 'Vertical Estudio', 'excellent', 'Habitación', 'Piano nuevo. Primera afinación pendiente.'),

-- Hotel Palace (cliente 14)
(@OWNER_ID, (SELECT id FROM clients WHERE email='eventos@hotelpalace.es' AND odId=@OWNER_ID LIMIT 1), 'Steinway & Sons', 'S-155', 'STW-PAL001', 2017, 'grand', 'Baby Grand', 'excellent', 'Lobby principal', 'Afinación mensual requerida.'),

-- Roberto Díaz (cliente 15)
(@OWNER_ID, (SELECT id FROM clients WHERE email='roberto.diaz@gmail.com' AND odId=@OWNER_ID LIMIT 1), 'Petrof', 'P 125 F1', 'PTF-ZGZ001', 2016, 'vertical', 'Vertical Profesional', 'good', 'Salón', NULL),

-- Colegio Alemán (cliente 16) - 2 pianos
(@OWNER_ID, (SELECT id FROM clients WHERE email='musica@colegioaleman.es' AND odId=@OWNER_ID LIMIT 1), 'Yamaha', 'U1', 'YU1-COL001', 2018, 'vertical', 'Vertical Estudio', 'good', 'Aula de música 1', NULL),
(@OWNER_ID, (SELECT id FROM clients WHERE email='musica@colegioaleman.es' AND odId=@OWNER_ID LIMIT 1), 'Kawai', 'K-300', 'KK3-COL002', 2019, 'vertical', 'Vertical Estudio', 'good', 'Aula de música 2', NULL),

-- Elena Ruiz (cliente 17)
(@OWNER_ID, (SELECT id FROM clients WHERE email='elena.ruiz@outlook.es' AND odId=@OWNER_ID LIMIT 1), 'Steinway & Sons', 'B-211', 'STW-GRA001', 2018, 'grand', 'Media Cola', 'excellent', 'Estudio de conciertos', 'Piano de concierto personal.');

-- ============================================================================
-- INSERTAR INVENTARIO
-- ============================================================================
INSERT INTO inventory (odId, name, category, description, quantity, unit, minStock, costPerUnit, supplier) VALUES
(@OWNER_ID, 'Cuerdas graves Steinway', 'strings', 'Juego completo de cuerdas graves para Steinway D-274', 5, 'juego', 2, 450.00, 'Steinway Parts Europe'),
(@OWNER_ID, 'Cuerdas medias universales', 'strings', 'Cuerdas de acero para registro medio', 20, 'unidad', 10, 25.00, 'Pianoparts.es'),
(@OWNER_ID, 'Cuerdas agudas premium', 'strings', 'Cuerdas de acero de alta tensión para agudos', 30, 'unidad', 15, 18.00, 'Pianoparts.es'),
(@OWNER_ID, 'Martillos Renner', 'hammers', 'Martillos de fieltro alemán Renner', 10, 'juego', 3, 280.00, 'Renner GmbH'),
(@OWNER_ID, 'Martillos Abel', 'hammers', 'Martillos de fieltro Abel para pianos verticales', 8, 'juego', 2, 220.00, 'Abel Hammers'),
(@OWNER_ID, 'Apagadores completos', 'dampers', 'Juego de apagadores de fieltro', 6, 'juego', 2, 180.00, 'Pianoparts.es'),
(@OWNER_ID, 'Fieltros de apagador', 'dampers', 'Fieltros de repuesto para apagadores', 50, 'unidad', 20, 3.50, 'Felt Supply Co'),
(@OWNER_ID, 'Teclas de marfil sintético', 'keys', 'Cubiertas de teclas blancas', 15, 'juego', 5, 95.00, 'Tokiwa Piano Supply'),
(@OWNER_ID, 'Teclas negras ébano', 'keys', 'Teclas negras de ébano sintético', 10, 'juego', 3, 75.00, 'Tokiwa Piano Supply'),
(@OWNER_ID, 'Muelles de repetición', 'action_parts', 'Muelles para mecanismo de repetición', 100, 'unidad', 50, 1.20, 'Pianoparts.es'),
(@OWNER_ID, 'Tornillos de regulación', 'action_parts', 'Tornillos de latón para regulación', 200, 'unidad', 100, 0.35, 'Hardware Piano'),
(@OWNER_ID, 'Fieltros de macillo', 'felts', 'Fieltros para regulación de macillos', 40, 'metro', 15, 12.00, 'Felt Supply Co'),
(@OWNER_ID, 'Fieltros de teclado', 'felts', 'Fieltros para guías de teclado', 25, 'metro', 10, 8.50, 'Felt Supply Co'),
(@OWNER_ID, 'Clavijas de afinación', 'tuning_pins', 'Clavijas de acero niquelado 7.0mm', 150, 'unidad', 50, 0.85, 'Pianoparts.es'),
(@OWNER_ID, 'Clavijas de afinación XL', 'tuning_pins', 'Clavijas sobredimensionadas 7.25mm', 80, 'unidad', 30, 1.10, 'Pianoparts.es'),
(@OWNER_ID, 'Llave de afinación profesional', 'tools', 'Llave de afinación con cabeza intercambiable', 3, 'unidad', 1, 185.00, 'Jahn Tools'),
(@OWNER_ID, 'Sordinas de goma', 'tools', 'Sordinas de goma para afinación', 20, 'unidad', 10, 4.50, 'Pianoparts.es'),
(@OWNER_ID, 'Diapasón A440', 'tools', 'Diapasón de precisión La 440Hz', 2, 'unidad', 1, 35.00, 'Wittner'),
(@OWNER_ID, 'Lubricante para clavijas', 'chemicals', 'Lubricante especial para clavijas', 5, 'bote', 2, 22.00, 'Piano Care Products'),
(@OWNER_ID, 'Limpiador de teclas', 'chemicals', 'Limpiador no abrasivo para teclas', 8, 'bote', 3, 15.00, 'Piano Care Products'),
(@OWNER_ID, 'Aceite para mecanismos', 'chemicals', 'Aceite sintético para partes móviles', 6, 'bote', 2, 28.00, 'Piano Care Products'),
(@OWNER_ID, 'Pedal de sostenido', 'pedals', 'Pedal derecho de repuesto universal', 4, 'unidad', 2, 45.00, 'Pianoparts.es'),
(@OWNER_ID, 'Muelles de pedal', 'pedals', 'Muelles de retorno para pedales', 15, 'unidad', 5, 8.00, 'Pianoparts.es');

-- ============================================================================
-- INSERTAR TARIFAS DE SERVICIO
-- ============================================================================
INSERT INTO serviceRates (odId, name, description, category, basePrice, taxRate, estimatedDuration, isActive) VALUES
(@OWNER_ID, 'Afinación estándar', 'Afinación completa de piano vertical o de cola', 'tuning', 120.00, 21, 90, TRUE),
(@OWNER_ID, 'Afinación de concierto', 'Afinación de precisión para eventos y conciertos', 'tuning', 180.00, 21, 120, TRUE),
(@OWNER_ID, 'Afinación + regulación básica', 'Afinación con ajustes menores de regulación', 'tuning', 160.00, 21, 120, TRUE),
(@OWNER_ID, 'Mantenimiento básico', 'Limpieza, lubricación y ajustes menores', 'maintenance', 85.00, 21, 60, TRUE),
(@OWNER_ID, 'Mantenimiento completo', 'Mantenimiento integral con regulación parcial', 'maintenance', 250.00, 21, 180, TRUE),
(@OWNER_ID, 'Mantenimiento premium', 'Servicio completo con afinación y regulación', 'maintenance', 350.00, 21, 240, TRUE),
(@OWNER_ID, 'Regulación completa', 'Regulación integral del mecanismo', 'regulation', 400.00, 21, 300, TRUE),
(@OWNER_ID, 'Regulación de teclado', 'Ajuste de altura y nivelación de teclas', 'regulation', 180.00, 21, 120, TRUE),
(@OWNER_ID, 'Reparación de tecla', 'Reparación o sustitución de tecla individual', 'repair', 45.00, 21, 30, TRUE),
(@OWNER_ID, 'Reparación de pedal', 'Reparación del sistema de pedales', 'repair', 75.00, 21, 45, TRUE),
(@OWNER_ID, 'Cambio de cuerdas (parcial)', 'Sustitución de cuerdas dañadas', 'repair', 150.00, 21, 90, TRUE),
(@OWNER_ID, 'Cambio de cuerdas (completo)', 'Encordado completo del piano', 'repair', 800.00, 21, 480, TRUE),
(@OWNER_ID, 'Restauración de martillos', 'Lijado y entonación de martillos', 'restoration', 350.00, 21, 240, TRUE),
(@OWNER_ID, 'Restauración completa', 'Restauración integral del instrumento', 'restoration', 3500.00, 21, 2400, TRUE),
(@OWNER_ID, 'Inspección técnica', 'Evaluación del estado del piano con informe', 'inspection', 60.00, 21, 45, TRUE),
(@OWNER_ID, 'Tasación profesional', 'Valoración del instrumento con certificado', 'inspection', 120.00, 21, 60, TRUE),
(@OWNER_ID, 'Desplazamiento urbano', 'Coste de desplazamiento en ciudad', 'other', 25.00, 21, 0, TRUE),
(@OWNER_ID, 'Desplazamiento provincial', 'Coste de desplazamiento fuera de ciudad', 'other', 50.00, 21, 0, TRUE);

-- ============================================================================
-- INSERTAR SERVICIOS REALIZADOS
-- ============================================================================
-- Servicios del último año para varios clientes

INSERT INTO services (odId, pianoId, clientId, serviceType, date, cost, duration, notes, technicianNotes, humidity, temperature) VALUES
-- Servicios para María García
(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='YU3-456789' LIMIT 1),
 (SELECT id FROM clients WHERE email='maria.garcia@email.com' AND odId=@OWNER_ID LIMIT 1),
 'tuning', '2024-03-15 10:00:00', 120.00, 90, 'Afinación de primavera', 'Piano en buen estado. Próxima afinación recomendada en 6 meses.', 55.00, 21.00),

(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='YU3-456789' LIMIT 1),
 (SELECT id FROM clients WHERE email='maria.garcia@email.com' AND odId=@OWNER_ID LIMIT 1),
 'tuning', '2024-09-20 11:00:00', 120.00, 90, 'Afinación de otoño', 'Afinación estable. Cliente satisfecha.', 48.00, 22.00),

-- Servicios para Conservatorio
(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='STW-123456' LIMIT 1),
 (SELECT id FROM clients WHERE email='info@conservatorio-madrid.es' AND odId=@OWNER_ID LIMIT 1),
 'tuning', '2024-01-10 09:00:00', 180.00, 120, 'Afinación de concierto - Recital de Navidad', 'Steinway en perfecto estado.', 50.00, 20.00),

(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='YC7-789012' LIMIT 1),
 (SELECT id FROM clients WHERE email='info@conservatorio-madrid.es' AND odId=@OWNER_ID LIMIT 1),
 'maintenance_complete', '2024-02-15 10:00:00', 250.00, 180, 'Mantenimiento trimestral', 'Regulación de escape ajustada. Limpieza completa realizada.', 52.00, 21.00),

(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='KW-345678' LIMIT 1),
 (SELECT id FROM clients WHERE email='info@conservatorio-madrid.es' AND odId=@OWNER_ID LIMIT 1),
 'tuning', '2024-04-05 14:00:00', 120.00, 90, 'Afinación rutinaria', 'Piano de aula en buen estado.', 54.00, 22.00),

-- Servicios para Carlos Rodríguez
(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='BOS-567890' LIMIT 1),
 (SELECT id FROM clients WHERE email='carlos.rodriguez@gmail.com' AND odId=@OWNER_ID LIMIT 1),
 'tuning', '2024-02-01 16:00:00', 180.00, 120, 'Afinación pre-grabación', 'Afinación de precisión para sesión de grabación.', 45.00, 21.00),

(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='BOS-567890' LIMIT 1),
 (SELECT id FROM clients WHERE email='carlos.rodriguez@gmail.com' AND odId=@OWNER_ID LIMIT 1),
 'regulation', '2024-06-15 10:00:00', 400.00, 300, 'Regulación completa', 'Ajuste fino del mecanismo. Cliente muy exigente pero satisfecho.', 48.00, 23.00),

-- Servicios para Teatro Real
(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='STW-111222' LIMIT 1),
 (SELECT id FROM clients WHERE email='tecnico@teatroreal.es' AND odId=@OWNER_ID LIMIT 1),
 'tuning', '2024-03-01 08:00:00', 180.00, 120, 'Afinación - Ópera de temporada', 'Afinación antes del ensayo general.', 50.00, 20.00),

(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='STW-111222' LIMIT 1),
 (SELECT id FROM clients WHERE email='tecnico@teatroreal.es' AND odId=@OWNER_ID LIMIT 1),
 'tuning', '2024-05-20 08:00:00', 180.00, 120, 'Afinación - Concierto sinfónico', 'Piano en excelente estado.', 48.00, 21.00),

(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='STW-333444' LIMIT 1),
 (SELECT id FROM clients WHERE email='tecnico@teatroreal.es' AND odId=@OWNER_ID LIMIT 1),
 'maintenance_basic', '2024-04-10 14:00:00', 85.00, 60, 'Mantenimiento de sala de ensayos', 'Limpieza y ajustes menores.', 52.00, 22.00),

-- Servicios para Ana Fernández (piano antiguo)
(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='PL-678901' LIMIT 1),
 (SELECT id FROM clients WHERE email='ana.fernandez@outlook.com' AND odId=@OWNER_ID LIMIT 1),
 'inspection', '2024-01-20 11:00:00', 60.00, 45, 'Inspección inicial', 'Piano necesita restauración de martillos. Presupuesto enviado.', 58.00, 19.00),

(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='PL-678901' LIMIT 1),
 (SELECT id FROM clients WHERE email='ana.fernandez@outlook.com' AND odId=@OWNER_ID LIMIT 1),
 'tuning', '2024-05-10 10:00:00', 120.00, 90, 'Afinación después de restauración parcial', 'Martillos restaurados. Piano suena mucho mejor.', 55.00, 22.00),

-- Servicios para Auditorio Nacional
(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='STW-445566' LIMIT 1),
 (SELECT id FROM clients WHERE email='mantenimiento@auditorionacional.es' AND odId=@OWNER_ID LIMIT 1),
 'tuning', '2024-04-01 07:00:00', 180.00, 120, 'Afinación - Temporada de primavera', 'Steinway principal en perfecto estado.', 48.00, 20.00),

(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='STW-778899' LIMIT 1),
 (SELECT id FROM clients WHERE email='mantenimiento@auditorionacional.es' AND odId=@OWNER_ID LIMIT 1),
 'tuning', '2024-04-01 10:00:00', 180.00, 120, 'Afinación - Temporada de primavera', 'Segundo Steinway también en excelente estado.', 48.00, 20.00),

-- Servicios para Laura Martínez
(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='BCH-112233' LIMIT 1),
 (SELECT id FROM clients WHERE email='laura.martinez@gmail.com' AND odId=@OWNER_ID LIMIT 1),
 'tuning', '2024-02-28 15:00:00', 120.00, 90, 'Afinación trimestral', 'Bechstein en excelente estado. Cliente muy cuidadosa.', 50.00, 21.00),

(@OWNER_ID, 
 (SELECT id FROM pianos WHERE serialNumber='BCH-112233' LIMIT 1),
 (SELECT id FROM clients WHERE email='laura.martinez@gmail.com' AND odId=@OWNER_ID LIMIT 1),
 'maintenance_basic', '2024-08-15 16:00:00', 85.00, 60, 'Mantenimiento de verano', 'Limpieza y lubricación. Todo en orden.', 45.00, 24.00);

-- ============================================================================
-- INSERTAR CITAS PROGRAMADAS (futuras)
-- ============================================================================
INSERT INTO appointments (odId, clientId, pianoId, title, date, duration, serviceType, status, notes, address) VALUES
-- Citas para enero 2025
(@OWNER_ID,
 (SELECT id FROM clients WHERE email='maria.garcia@email.com' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='YU3-456789' LIMIT 1),
 'Afinación de invierno - María García', '2025-01-15 10:00:00', 90, 'tuning', 'scheduled', 'Afinación semestral programada', 'Calle Mayor 15, 3º A, Madrid'),

(@OWNER_ID,
 (SELECT id FROM clients WHERE email='info@conservatorio-madrid.es' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='STW-123456' LIMIT 1),
 'Afinación Steinway - Conservatorio', '2025-01-08 09:00:00', 120, 'tuning', 'confirmed', 'Preparación para concierto de Año Nuevo', 'Avenida de la Música 42, Madrid'),

(@OWNER_ID,
 (SELECT id FROM clients WHERE email='carlos.rodriguez@gmail.com' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='BOS-567890' LIMIT 1),
 'Afinación pre-grabación - Carlos', '2025-01-20 16:00:00', 120, 'tuning', 'scheduled', 'Sesión de grabación programada para el 22', 'Plaza del Sol 8, 2º B, Barcelona'),

(@OWNER_ID,
 (SELECT id FROM clients WHERE email='tecnico@teatroreal.es' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='STW-111222' LIMIT 1),
 'Afinación - Ópera enero', '2025-01-25 08:00:00', 120, 'tuning', 'confirmed', 'Estreno de temporada', 'Plaza de Isabel II, s/n, Madrid'),

-- Citas para febrero 2025
(@OWNER_ID,
 (SELECT id FROM clients WHERE email='info@escuelasonata.es' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='KK3-777888' LIMIT 1),
 'Mantenimiento trimestral - Escuela Sonata', '2025-02-05 10:00:00', 180, 'maintenance_complete', 'scheduled', 'Mantenimiento de todos los pianos', 'Calle Colón 45, Valencia'),

(@OWNER_ID,
 (SELECT id FROM clients WHERE email='mantenimiento@auditorionacional.es' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='STW-445566' LIMIT 1),
 'Afinación - Temporada invierno', '2025-02-10 07:00:00', 120, 'tuning', 'scheduled', 'Ciclo de conciertos de febrero', 'Calle Príncipe de Vergara 146, Madrid'),

(@OWNER_ID,
 (SELECT id FROM clients WHERE email='laura.martinez@gmail.com' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='BCH-112233' LIMIT 1),
 'Afinación trimestral - Laura', '2025-02-20 15:00:00', 90, 'tuning', 'scheduled', 'Afinación regular', 'Gran Vía 102, 4º D, Bilbao'),

-- Citas para marzo 2025
(@OWNER_ID,
 (SELECT id FROM clients WHERE email='secretaria@csm-sevilla.es' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='STW-SEV001' LIMIT 1),
 'Mantenimiento anual - Conservatorio Sevilla', '2025-03-01 09:00:00', 240, 'maintenance_premium', 'scheduled', 'Revisión completa de todos los pianos', 'Calle Baños 48, Sevilla'),

(@OWNER_ID,
 (SELECT id FROM clients WHERE email='elena.ruiz@outlook.es' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='STW-GRA001' LIMIT 1),
 'Afinación de concierto - Elena Ruiz', '2025-03-15 10:00:00', 120, 'tuning', 'scheduled', 'Preparación para recital', 'Avenida de la Constitución 20, 3º, Granada');

-- ============================================================================
-- INSERTAR FACTURAS
-- ============================================================================
INSERT INTO invoices (odId, invoiceNumber, clientId, clientName, clientEmail, clientAddress, date, dueDate, status, items, subtotal, taxAmount, total, notes, businessInfo) VALUES
(@OWNER_ID, 'FAC-2024-001',
 (SELECT id FROM clients WHERE email='maria.garcia@email.com' AND odId=@OWNER_ID LIMIT 1),
 'María García López', 'maria.garcia@email.com', 'Calle Mayor 15, 3º A, 28013 Madrid',
 '2024-03-15 10:00:00', '2024-04-15 10:00:00', 'paid',
 '[{"description":"Afinación estándar","quantity":1,"unitPrice":120,"taxRate":21,"total":145.20}]',
 120.00, 25.20, 145.20, 'Afinación de primavera',
 '{"name":"Piano Emotion Services","taxId":"B12345678","address":"Calle Ejemplo 123","city":"Madrid","postalCode":"28001","phone":"+34 600 000 000","email":"info@piano-emotion.es","bankAccount":"ES12 1234 5678 9012 3456 7890"}'),

(@OWNER_ID, 'FAC-2024-002',
 (SELECT id FROM clients WHERE email='info@conservatorio-madrid.es' AND odId=@OWNER_ID LIMIT 1),
 'Conservatorio Municipal de Música', 'info@conservatorio-madrid.es', 'Avenida de la Música 42, 28020 Madrid',
 '2024-01-10 09:00:00', '2024-02-10 09:00:00', 'paid',
 '[{"description":"Afinación de concierto - Steinway D-274","quantity":1,"unitPrice":180,"taxRate":21,"total":217.80}]',
 180.00, 37.80, 217.80, 'Afinación para Recital de Navidad',
 '{"name":"Piano Emotion Services","taxId":"B12345678","address":"Calle Ejemplo 123","city":"Madrid","postalCode":"28001","phone":"+34 600 000 000","email":"info@piano-emotion.es","bankAccount":"ES12 1234 5678 9012 3456 7890"}'),

(@OWNER_ID, 'FAC-2024-003',
 (SELECT id FROM clients WHERE email='carlos.rodriguez@gmail.com' AND odId=@OWNER_ID LIMIT 1),
 'Carlos Rodríguez Martín', 'carlos.rodriguez@gmail.com', 'Plaza del Sol 8, 2º B, 08001 Barcelona',
 '2024-06-15 10:00:00', '2024-07-15 10:00:00', 'paid',
 '[{"description":"Regulación completa","quantity":1,"unitPrice":400,"taxRate":21,"total":484.00},{"description":"Afinación de precisión","quantity":1,"unitPrice":180,"taxRate":21,"total":217.80}]',
 580.00, 121.80, 701.80, 'Regulación y afinación completa',
 '{"name":"Piano Emotion Services","taxId":"B12345678","address":"Calle Ejemplo 123","city":"Madrid","postalCode":"28001","phone":"+34 600 000 000","email":"info@piano-emotion.es","bankAccount":"ES12 1234 5678 9012 3456 7890"}'),

(@OWNER_ID, 'FAC-2024-004',
 (SELECT id FROM clients WHERE email='tecnico@teatroreal.es' AND odId=@OWNER_ID LIMIT 1),
 'Teatro Real de Madrid', 'tecnico@teatroreal.es', 'Plaza de Isabel II, s/n, 28013 Madrid',
 '2024-05-20 08:00:00', '2024-06-20 08:00:00', 'paid',
 '[{"description":"Afinación de concierto - Steinway D-274","quantity":2,"unitPrice":180,"taxRate":21,"total":435.60},{"description":"Mantenimiento básico","quantity":1,"unitPrice":85,"taxRate":21,"total":102.85}]',
 445.00, 93.45, 538.45, 'Servicios de mayo - Concierto sinfónico',
 '{"name":"Piano Emotion Services","taxId":"B12345678","address":"Calle Ejemplo 123","city":"Madrid","postalCode":"28001","phone":"+34 600 000 000","email":"info@piano-emotion.es","bankAccount":"ES12 1234 5678 9012 3456 7890"}'),

(@OWNER_ID, 'FAC-2024-005',
 (SELECT id FROM clients WHERE email='mantenimiento@auditorionacional.es' AND odId=@OWNER_ID LIMIT 1),
 'Auditorio Nacional', 'mantenimiento@auditorionacional.es', 'Calle Príncipe de Vergara 146, 28002 Madrid',
 '2024-04-01 07:00:00', '2024-05-01 07:00:00', 'paid',
 '[{"description":"Afinación de concierto - Steinway D-274","quantity":2,"unitPrice":180,"taxRate":21,"total":435.60}]',
 360.00, 75.60, 435.60, 'Afinación de temporada de primavera',
 '{"name":"Piano Emotion Services","taxId":"B12345678","address":"Calle Ejemplo 123","city":"Madrid","postalCode":"28001","phone":"+34 600 000 000","email":"info@piano-emotion.es","bankAccount":"ES12 1234 5678 9012 3456 7890"}'),

(@OWNER_ID, 'FAC-2024-006',
 (SELECT id FROM clients WHERE email='maria.garcia@email.com' AND odId=@OWNER_ID LIMIT 1),
 'María García López', 'maria.garcia@email.com', 'Calle Mayor 15, 3º A, 28013 Madrid',
 '2024-09-20 11:00:00', '2024-10-20 11:00:00', 'paid',
 '[{"description":"Afinación estándar","quantity":1,"unitPrice":120,"taxRate":21,"total":145.20}]',
 120.00, 25.20, 145.20, 'Afinación de otoño',
 '{"name":"Piano Emotion Services","taxId":"B12345678","address":"Calle Ejemplo 123","city":"Madrid","postalCode":"28001","phone":"+34 600 000 000","email":"info@piano-emotion.es","bankAccount":"ES12 1234 5678 9012 3456 7890"}'),

(@OWNER_ID, 'FAC-2024-007',
 (SELECT id FROM clients WHERE email='laura.martinez@gmail.com' AND odId=@OWNER_ID LIMIT 1),
 'Laura Martínez Pérez', 'laura.martinez@gmail.com', 'Gran Vía 102, 4º D, 48001 Bilbao',
 '2024-08-15 16:00:00', '2024-09-15 16:00:00', 'sent',
 '[{"description":"Afinación estándar","quantity":1,"unitPrice":120,"taxRate":21,"total":145.20},{"description":"Mantenimiento básico","quantity":1,"unitPrice":85,"taxRate":21,"total":102.85}]',
 205.00, 43.05, 248.05, 'Afinación y mantenimiento de verano',
 '{"name":"Piano Emotion Services","taxId":"B12345678","address":"Calle Ejemplo 123","city":"Madrid","postalCode":"28001","phone":"+34 600 000 000","email":"info@piano-emotion.es","bankAccount":"ES12 1234 5678 9012 3456 7890"}'),

(@OWNER_ID, 'FAC-2024-008',
 (SELECT id FROM clients WHERE email='ana.fernandez@outlook.com' AND odId=@OWNER_ID LIMIT 1),
 'Ana Fernández Ruiz', 'ana.fernandez@outlook.com', 'Calle Sierpes 23, 1º, 41004 Sevilla',
 '2024-05-10 10:00:00', '2024-06-10 10:00:00', 'paid',
 '[{"description":"Inspección técnica","quantity":1,"unitPrice":60,"taxRate":21,"total":72.60},{"description":"Afinación estándar","quantity":1,"unitPrice":120,"taxRate":21,"total":145.20}]',
 180.00, 37.80, 217.80, 'Inspección y afinación post-restauración',
 '{"name":"Piano Emotion Services","taxId":"B12345678","address":"Calle Ejemplo 123","city":"Madrid","postalCode":"28001","phone":"+34 600 000 000","email":"info@piano-emotion.es","bankAccount":"ES12 1234 5678 9012 3456 7890"}');

-- ============================================================================
-- INSERTAR PRESUPUESTOS
-- ============================================================================
INSERT INTO quotes (odId, quoteNumber, clientId, clientName, clientEmail, clientAddress, pianoId, pianoDescription, title, description, date, validUntil, status, items, subtotal, totalDiscount, taxAmount, total, currency, notes, termsAndConditions, businessInfo) VALUES
(@OWNER_ID, 'PRES-2024-001',
 (SELECT id FROM clients WHERE email='ana.fernandez@outlook.com' AND odId=@OWNER_ID LIMIT 1),
 'Ana Fernández Ruiz', 'ana.fernandez@outlook.com', 'Calle Sierpes 23, 1º, 41004 Sevilla',
 (SELECT id FROM pianos WHERE serialNumber='PL-678901' LIMIT 1),
 'Pleyel P118 (1985)',
 'Restauración de martillos - Pleyel P118',
 'Presupuesto para restauración completa de los martillos del piano Pleyel heredado.',
 '2024-01-20 11:00:00', '2024-02-20 11:00:00', 'accepted',
 '[{"id":"1","type":"service","name":"Restauración de martillos","description":"Lijado, entonación y ajuste de 88 martillos","quantity":1,"unitPrice":350,"discount":0,"taxRate":21,"subtotal":350,"total":423.50},{"id":"2","type":"part","name":"Fieltros de repuesto","description":"Fieltros de calidad para martillos dañados","quantity":5,"unitPrice":12,"discount":0,"taxRate":21,"subtotal":60,"total":72.60}]',
 410.00, 0.00, 86.10, 496.10, 'EUR',
 'Trabajo estimado en 2 días. Incluye transporte de martillos al taller.',
 'Presupuesto válido por 30 días. El trabajo se realizará en el taller. Garantía de 1 año.',
 '{"name":"Piano Emotion Services","taxId":"B12345678","address":"Calle Ejemplo 123","city":"Madrid","postalCode":"28001","phone":"+34 600 000 000","email":"info@piano-emotion.es","bankAccount":"ES12 1234 5678 9012 3456 7890"}'),

(@OWNER_ID, 'PRES-2024-002',
 (SELECT id FROM clients WHERE email='miguelangel.torres@hotmail.com' AND odId=@OWNER_ID LIMIT 1),
 'Miguel Ángel Torres', 'miguelangel.torres@hotmail.com', 'Paseo de Gracia 88, 6º, 08008 Barcelona',
 (SELECT id FROM pianos WHERE serialNumber='PLY-1905' LIMIT 1),
 'Pleyel Grand Modèle (1905)',
 'Restauración completa - Pleyel 1905',
 'Presupuesto para restauración integral del piano de cola Pleyel de 1905.',
 '2024-11-01 10:00:00', '2024-12-01 10:00:00', 'sent',
 '[{"id":"1","type":"service","name":"Restauración completa","description":"Restauración integral del instrumento incluyendo caja, mecanismo y cuerdas","quantity":1,"unitPrice":3500,"discount":10,"taxRate":21,"subtotal":3150,"total":3811.50},{"id":"2","type":"part","name":"Cuerdas completas","description":"Encordado completo con cuerdas de época","quantity":1,"unitPrice":800,"discount":0,"taxRate":21,"subtotal":800,"total":968.00},{"id":"3","type":"service","name":"Transporte especializado","description":"Transporte ida y vuelta al taller","quantity":2,"unitPrice":150,"discount":0,"taxRate":21,"subtotal":300,"total":363.00}]',
 4250.00, 350.00, 819.00, 4719.00, 'EUR',
 'Restauración de museo. Trabajo estimado en 3-4 meses. Se mantendrá informado al cliente del progreso.',
 'Presupuesto válido por 30 días. Pago: 50% al inicio, 50% al finalizar. Garantía de 2 años.',
 '{"name":"Piano Emotion Services","taxId":"B12345678","address":"Calle Ejemplo 123","city":"Madrid","postalCode":"28001","phone":"+34 600 000 000","email":"info@piano-emotion.es","bankAccount":"ES12 1234 5678 9012 3456 7890"}'),

(@OWNER_ID, 'PRES-2024-003',
 (SELECT id FROM clients WHERE email='info@escuelasonata.es' AND odId=@OWNER_ID LIMIT 1),
 'Escuela de Música Sonata', 'info@escuelasonata.es', 'Calle Colón 45, 46004 Valencia',
 NULL, NULL,
 'Contrato de mantenimiento anual 2025',
 'Propuesta de contrato de mantenimiento anual para los 8 pianos de la escuela.',
 '2024-12-01 10:00:00', '2025-01-15 10:00:00', 'draft',
 '[{"id":"1","type":"service","name":"Afinaciones trimestrales","description":"4 afinaciones por piano al año (8 pianos x 4 = 32 afinaciones)","quantity":32,"unitPrice":100,"discount":15,"taxRate":21,"subtotal":2720,"total":3291.20},{"id":"2","type":"service","name":"Mantenimiento semestral","description":"2 mantenimientos completos por piano (8 pianos x 2 = 16 servicios)","quantity":16,"unitPrice":200,"discount":15,"taxRate":21,"subtotal":2720,"total":3291.20},{"id":"3","type":"service","name":"Servicio de emergencia","description":"Hasta 4 visitas de emergencia incluidas","quantity":4,"unitPrice":0,"discount":0,"taxRate":21,"subtotal":0,"total":0}]',
 5440.00, 960.00, 940.80, 5420.80, 'EUR',
 'Contrato anual con descuento del 15% sobre tarifas estándar. Incluye servicio de emergencia.',
 'Contrato válido del 1 de enero al 31 de diciembre de 2025. Pago trimestral. Cancelación con 30 días de aviso.',
 '{"name":"Piano Emotion Services","taxId":"B12345678","address":"Calle Ejemplo 123","city":"Madrid","postalCode":"28001","phone":"+34 600 000 000","email":"info@piano-emotion.es","bankAccount":"ES12 1234 5678 9012 3456 7890"}');

-- ============================================================================
-- INSERTAR RECORDATORIOS
-- ============================================================================
INSERT INTO reminders (odId, clientId, pianoId, reminderType, dueDate, title, notes, isCompleted) VALUES
(@OWNER_ID,
 (SELECT id FROM clients WHERE email='pedro.sanchez@yahoo.es' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='YU3-555666' LIMIT 1),
 'call', '2025-01-10 10:00:00', 'Llamar para programar afinación semestral', 'Última afinación hace 5 meses. Contactar para programar siguiente.', FALSE),

(@OWNER_ID,
 (SELECT id FROM clients WHERE email='isabel.lopez@email.com' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='KK2-MAL001' LIMIT 1),
 'visit', '2025-01-20 11:00:00', 'Primera afinación - Piano nuevo', 'Piano nuevo Kawai. Programar primera afinación después de período de asentamiento.', FALSE),

(@OWNER_ID,
 (SELECT id FROM clients WHERE email='roberto.diaz@gmail.com' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='PTF-ZGZ001' LIMIT 1),
 'email', '2025-02-01 09:00:00', 'Enviar recordatorio afinación anual', 'Afinación anual programada. Enviar email de confirmación.', FALSE),

(@OWNER_ID,
 (SELECT id FROM clients WHERE email='eventos@hotelpalace.es' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='STW-PAL001' LIMIT 1),
 'follow_up', '2025-01-05 10:00:00', 'Seguimiento contrato de mantenimiento', 'Proponer renovación de contrato de mantenimiento mensual para 2025.', FALSE),

(@OWNER_ID,
 (SELECT id FROM clients WHERE email='miguelangel.torres@hotmail.com' AND odId=@OWNER_ID LIMIT 1),
 (SELECT id FROM pianos WHERE serialNumber='PLY-1905' LIMIT 1),
 'call', '2025-01-08 11:00:00', 'Seguimiento presupuesto restauración', 'Llamar para conocer decisión sobre presupuesto de restauración del Pleyel 1905.', FALSE);

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
SELECT 'Datos de prueba insertados correctamente' AS resultado;
SELECT CONCAT('Clientes: ', COUNT(*)) AS total FROM clients WHERE odId = @OWNER_ID;
SELECT CONCAT('Pianos: ', COUNT(*)) AS total FROM pianos WHERE odId = @OWNER_ID;
SELECT CONCAT('Servicios: ', COUNT(*)) AS total FROM services WHERE odId = @OWNER_ID;
SELECT CONCAT('Citas: ', COUNT(*)) AS total FROM appointments WHERE odId = @OWNER_ID;
SELECT CONCAT('Facturas: ', COUNT(*)) AS total FROM invoices WHERE odId = @OWNER_ID;
SELECT CONCAT('Presupuestos: ', COUNT(*)) AS total FROM quotes WHERE odId = @OWNER_ID;
SELECT CONCAT('Inventario: ', COUNT(*)) AS total FROM inventory WHERE odId = @OWNER_ID;
SELECT CONCAT('Tarifas: ', COUNT(*)) AS total FROM serviceRates WHERE odId = @OWNER_ID;
SELECT CONCAT('Recordatorios: ', COUNT(*)) AS total FROM reminders WHERE odId = @OWNER_ID;
