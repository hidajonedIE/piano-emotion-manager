# Prueba de Estrés - Piano Emotion Manager

Prueba de estrés para 2500 usuarios concurrentes usando k6.

## Requisitos Previos

### 1. Instalar k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```powershell
choco install k6
```

### 2. Verificar Instalación

```bash
k6 version
```

## Configuración de la Prueba

### Escenarios de Prueba

La prueba simula 5 escenarios de usuario:

1. **view_clients** - Ver lista de clientes
2. **view_pianos** - Ver lista de pianos
3. **view_appointments** - Ver lista de citas
4. **view_services** - Ver lista de servicios
5. **view_dashboard** - Ver dashboard (múltiples requests)

### Fases de la Prueba

| Fase | Duración | Usuarios | Descripción |
|------|----------|----------|-------------|
| 1 | 2 min | 0 → 100 | Ramp-up inicial |
| 2 | 2 min | 100 → 500 | Ramp-up moderado |
| 3 | 2 min | 500 → 1000 | Ramp-up acelerado |
| 4 | 2 min | 1000 → 1500 | Ramp-up intenso |
| 5 | 2 min | 1500 → 2500 | Ramp-up máximo |
| 6 | 10 min | 2500 | **Sostenido** |
| 7 | 2 min | 2500 → 0 | Ramp-down |

**Duración total:** 22 minutos

### Umbrales de Éxito

| Métrica | Umbral | Descripción |
|---------|--------|-------------|
| `http_req_duration` (p95) | < 1000ms | 95% de requests en < 1s |
| `http_req_duration` (p99) | < 2000ms | 99% de requests en < 2s |
| `errors` | < 1% | Tasa de error < 1% |
| `http_req_failed` | < 5% | Tasa de fallo < 5% |

## Ejecución de la Prueba

### Prueba Completa (2500 usuarios)

```bash
k6 run stress-test.js
```

### Prueba Piloto (100 usuarios)

Para hacer una prueba piloto antes de la prueba completa:

```bash
k6 run --vus 100 --duration 5m stress-test.js
```

### Prueba con Resultados en la Nube

Para ver resultados en tiempo real en k6 Cloud:

```bash
k6 cloud stress-test.js
```

**Nota:** Requiere cuenta en k6 Cloud (gratis para 50 VUs)

### Prueba con Salida JSON

Para analizar resultados después:

```bash
k6 run --out json=results.json stress-test.js
```

## Monitoreo Durante la Prueba

### 1. Vercel Dashboard
https://vercel.com/jordi-navarretes-projects/piano-emotion-manager

**Métricas a observar:**
- Function Invocations
- Function Duration
- Error Rate
- Bandwidth

### 2. Upstash Dashboard
https://console.upstash.com/redis/55762194-23fb-422f-80b8-36805a0b01d1

**Métricas a observar:**
- Commands/s
- Hit Rate
- Storage
- Latency

### 3. TiDB Cloud Dashboard
https://tidbcloud.com/

**Métricas a observar:**
- RU/s (Request Units per second)
- Connection Count
- Query Duration
- Storage

### 4. Logs de Vercel
https://vercel.com/jordi-navarretes-projects/piano-emotion-manager/logs

**Buscar:**
- Errores de rate limiting
- Errores de Redis
- Errores de base de datos
- Timeouts

## Interpretación de Resultados

### Métricas de k6

Al finalizar la prueba, k6 mostrará un resumen:

```
     ✓ status is 200
     ✓ response time < 1000ms

     checks.........................: 98.50% ✓ 123456 ✗ 1234
     data_received..................: 1.2 GB 54 MB/s
     data_sent......................: 234 MB 11 MB/s
     http_req_blocked...............: avg=1.2ms    min=0s    med=0s    max=123ms   p(90)=0s    p(95)=0s   
     http_req_connecting............: avg=0.5ms    min=0s    med=0s    max=45ms    p(90)=0s    p(95)=0s   
     http_req_duration..............: avg=234ms    min=45ms  med=189ms max=2.1s    p(90)=456ms p(95)=678ms
     http_req_failed................: 1.50%  ✓ 1234  ✗ 81234
     http_req_receiving.............: avg=0.3ms    min=0s    med=0s    max=34ms    p(90)=1ms   p(95)=2ms  
     http_req_sending...............: avg=0.1ms    min=0s    med=0s    max=12ms    p(90)=0s    p(95)=1ms  
     http_req_tls_handshaking.......: avg=0.8ms    min=0s    med=0s    max=78ms    p(90)=0s    p(95)=0s   
     http_req_waiting...............: avg=233ms    min=44ms  med=188ms max=2.1s    p(90)=455ms p(95)=677ms
     http_reqs......................: 82468  3748/s
     iteration_duration.............: avg=3.2s     min=2.1s  med=3.1s  max=8.9s    p(90)=4.2s  p(95)=5.1s 
     iterations.....................: 82468  3748/s
     vus............................: 2500   min=0   max=2500
     vus_max........................: 2500   min=2500 max=2500
```

### Criterios de Éxito

✅ **ÉXITO** si:
- `http_req_duration` (p95) < 1000ms
- `http_req_duration` (p99) < 2000ms
- `http_req_failed` < 5%
- `checks` > 95%

⚠️ **ADVERTENCIA** si:
- `http_req_duration` (p95) entre 1000-1500ms
- `http_req_failed` entre 5-10%
- `checks` entre 90-95%

❌ **FALLO** si:
- `http_req_duration` (p95) > 1500ms
- `http_req_failed` > 10%
- `checks` < 90%

## Troubleshooting

### Error: "Too many requests"

**Causa:** Rate limiting activado

**Solución:**
1. Verificar logs de Vercel para confirmar
2. Ajustar límites en `server/_core/trpc.ts` si es necesario
3. Considerar aumentar límites temporalmente para la prueba

### Error: "Connection timeout"

**Causa:** Pool de conexiones agotado o TiDB sobrecargado

**Solución:**
1. Verificar dashboard de TiDB
2. Aumentar `connectionLimit` en `server/db.ts` si es necesario
3. Verificar que TiDB tenga suficientes RU/s

### Error: "Redis connection failed"

**Causa:** Upstash alcanzó el límite de comandos/s

**Solución:**
1. Verificar dashboard de Upstash
2. Upgrade a Pay as You Go si se alcanza el límite de 10,000 cmd/s
3. Verificar que las variables de entorno estén configuradas

### Error: "Function timeout"

**Causa:** Vercel serverless function timeout (60s en Pro)

**Solución:**
1. Verificar logs de Vercel
2. Optimizar queries lentas en la base de datos
3. Verificar índices en TiDB

## Próximos Pasos

Después de la prueba:

1. ✅ Analizar resultados y métricas
2. ✅ Identificar cuellos de botella
3. ✅ Optimizar queries lentas
4. ✅ Ajustar configuración de caché
5. ✅ Ajustar rate limiting si es necesario
6. ✅ Documentar hallazgos y recomendaciones

## Contacto

Para preguntas o problemas, contactar al equipo de desarrollo.
