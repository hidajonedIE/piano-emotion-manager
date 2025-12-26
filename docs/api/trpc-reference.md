# API Reference - tRPC Procedures

Esta documentación describe todos los procedimientos tRPC disponibles en Piano Emotion Manager.

## Índice

1. [Autenticación](#autenticación)
2. [Clientes](#clientes)
3. [Pianos](#pianos)
4. [Servicios](#servicios)
5. [Citas](#citas)
6. [Facturas](#facturas)
7. [Presupuestos](#presupuestos)
8. [Inventario](#inventario)
9. [Equipos](#equipos)
10. [Recordatorios](#recordatorios)
11. [Suscripciones](#suscripciones)
12. [Módulos Avanzados](#módulos-avanzados)

---

## Autenticación

Todos los endpoints requieren autenticación mediante Clerk. El token JWT se envía automáticamente en cada request.

### Contexto de Usuario

```typescript
interface UserContext {
  userId: string;
  email: string;
  organizationId?: string;
}
```

---

## Clientes

Router: `clients`

### clients.list

Lista todos los clientes del usuario autenticado.

**Tipo:** Query

**Input:**
```typescript
{
  page?: number;        // Página actual (default: 1)
  limit?: number;       // Items por página (default: 20)
  search?: string;      // Término de búsqueda
  clientType?: string;  // Filtro por tipo de cliente
}
```

**Output:**
```typescript
{
  clients: Client[];
  total: number;
  page: number;
  totalPages: number;
}
```

### clients.getById

Obtiene un cliente por su ID.

**Tipo:** Query

**Input:**
```typescript
{
  id: number;
}
```

**Output:** `Client`

### clients.create

Crea un nuevo cliente.

**Tipo:** Mutation

**Input:**
```typescript
{
  name: string;                    // Nombre (requerido)
  email?: string;                  // Email
  phone?: string;                  // Teléfono
  address?: string;                // Dirección
  city?: string;                   // Ciudad
  postalCode?: string;             // Código postal
  region?: string;                 // Región/Provincia
  clientType: ClientType;          // Tipo de cliente
  notes?: string;                  // Notas
  taxId?: string;                  // NIF/CIF
}
```

**Output:** `Client`

### clients.update

Actualiza un cliente existente.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
  data: Partial<ClientInput>;
}
```

**Output:** `Client`

### clients.delete

Elimina un cliente.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
}
```

**Output:** `{ success: boolean }`

### clients.search

Busca clientes por término.

**Tipo:** Query

**Input:**
```typescript
{
  term: string;
  limit?: number;
}
```

**Output:** `Client[]`

### clients.getStats

Obtiene estadísticas de clientes.

**Tipo:** Query

**Output:**
```typescript
{
  total: number;
  byType: Record<ClientType, number>;
  newThisMonth: number;
  activeClients: number;
}
```

---

## Pianos

Router: `pianos`

### pianos.list

Lista todos los pianos.

**Tipo:** Query

**Input:**
```typescript
{
  page?: number;
  limit?: number;
  clientId?: number;
  category?: 'vertical' | 'grand';
}
```

**Output:**
```typescript
{
  pianos: Piano[];
  total: number;
}
```

### pianos.getByClient

Obtiene pianos de un cliente específico.

**Tipo:** Query

**Input:**
```typescript
{
  clientId: number;
}
```

**Output:** `Piano[]`

### pianos.create

Crea un nuevo piano.

**Tipo:** Mutation

**Input:**
```typescript
{
  clientId: number;
  brand: string;
  model?: string;
  serialNumber?: string;
  year?: number;
  category: 'vertical' | 'grand';
  pianoType: string;
  condition: PianoCondition;
  location?: string;
  notes?: string;
}
```

**Output:** `Piano`

### pianos.update

Actualiza un piano.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
  data: Partial<PianoInput>;
}
```

**Output:** `Piano`

### pianos.delete

Elimina un piano.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
}
```

**Output:** `{ success: boolean }`

### pianos.getServiceHistory

Obtiene historial de servicios de un piano.

**Tipo:** Query

**Input:**
```typescript
{
  pianoId: number;
}
```

**Output:** `Service[]`

---

## Servicios

Router: `services`

### services.list

Lista todos los servicios.

**Tipo:** Query

**Input:**
```typescript
{
  page?: number;
  limit?: number;
  status?: ServiceStatus;
  serviceType?: ServiceType;
  dateFrom?: Date;
  dateTo?: Date;
}
```

**Output:**
```typescript
{
  services: Service[];
  total: number;
}
```

### services.create

Crea un nuevo servicio.

**Tipo:** Mutation

**Input:**
```typescript
{
  pianoId: number;
  clientId: number;
  serviceType: ServiceType;
  date: Date;
  cost?: number;
  duration?: number;
  notes?: string;
  assignedTo?: number;
}
```

**Output:** `Service`

### services.updateStatus

Actualiza el estado de un servicio.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
  status: ServiceStatus;
  notes?: string;
}
```

**Output:** `Service`

### services.complete

Marca un servicio como completado.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
  completionNotes?: string;
  actualDuration?: number;
  actualCost?: number;
}
```

**Output:** `Service`

### services.getUpcoming

Obtiene servicios próximos.

**Tipo:** Query

**Input:**
```typescript
{
  days?: number;  // Días hacia adelante (default: 7)
}
```

**Output:** `Service[]`

---

## Citas

Router: `appointments`

### appointments.list

Lista todas las citas.

**Tipo:** Query

**Input:**
```typescript
{
  dateFrom?: Date;
  dateTo?: Date;
  status?: AppointmentStatus;
}
```

**Output:** `Appointment[]`

### appointments.create

Crea una nueva cita.

**Tipo:** Mutation

**Input:**
```typescript
{
  clientId: number;
  pianoId?: number;
  title: string;
  date: Date;
  duration?: number;
  serviceType?: string;
  notes?: string;
  address?: string;
}
```

**Output:** `Appointment`

### appointments.update

Actualiza una cita.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
  data: Partial<AppointmentInput>;
}
```

**Output:** `Appointment`

### appointments.cancel

Cancela una cita.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
  reason?: string;
}
```

**Output:** `Appointment`

### appointments.getByDate

Obtiene citas de una fecha específica.

**Tipo:** Query

**Input:**
```typescript
{
  date: Date;
}
```

**Output:** `Appointment[]`

### appointments.getCalendarData

Obtiene datos para el calendario.

**Tipo:** Query

**Input:**
```typescript
{
  month: number;
  year: number;
}
```

**Output:**
```typescript
{
  appointments: Appointment[];
  summary: {
    total: number;
    byStatus: Record<AppointmentStatus, number>;
  };
}
```

---

## Facturas

Router: `invoices`

### invoices.list

Lista todas las facturas.

**Tipo:** Query

**Input:**
```typescript
{
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  clientId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}
```

**Output:**
```typescript
{
  invoices: Invoice[];
  total: number;
}
```

### invoices.create

Crea una nueva factura.

**Tipo:** Mutation

**Input:**
```typescript
{
  clientId: number;
  invoiceNumber?: string;  // Auto-generado si no se proporciona
  date: Date;
  dueDate?: Date;
  items: InvoiceItem[];
  notes?: string;
  paymentMethod?: string;
}
```

**Output:** `Invoice`

### invoices.generatePDF

Genera PDF de una factura.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
}
```

**Output:**
```typescript
{
  url: string;
  filename: string;
}
```

### invoices.sendByEmail

Envía factura por email.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
  email?: string;  // Usa email del cliente si no se proporciona
  message?: string;
}
```

**Output:** `{ success: boolean }`

### invoices.markAsPaid

Marca factura como pagada.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
  paymentDate?: Date;
  paymentMethod?: string;
}
```

**Output:** `Invoice`

### invoices.getNextNumber

Obtiene siguiente número de factura.

**Tipo:** Query

**Output:**
```typescript
{
  nextNumber: string;
  series: string;
}
```

---

## Presupuestos

Router: `quotes`

### quotes.list

Lista todos los presupuestos.

**Tipo:** Query

**Input:**
```typescript
{
  page?: number;
  limit?: number;
  status?: QuoteStatus;
  clientId?: number;
}
```

**Output:**
```typescript
{
  quotes: Quote[];
  total: number;
}
```

### quotes.create

Crea un nuevo presupuesto.

**Tipo:** Mutation

**Input:**
```typescript
{
  clientId: number;
  title: string;
  validUntil?: Date;
  items: QuoteItem[];
  notes?: string;
  terms?: string;
}
```

**Output:** `Quote`

### quotes.convertToInvoice

Convierte presupuesto a factura.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
}
```

**Output:** `Invoice`

### quotes.accept

Marca presupuesto como aceptado.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
}
```

**Output:** `Quote`

### quotes.reject

Marca presupuesto como rechazado.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
  reason?: string;
}
```

**Output:** `Quote`

---

## Inventario

Router: `inventory`

### inventory.list

Lista items de inventario.

**Tipo:** Query

**Input:**
```typescript
{
  category?: InventoryCategory;
  lowStock?: boolean;
}
```

**Output:** `InventoryItem[]`

### inventory.create

Crea item de inventario.

**Tipo:** Mutation

**Input:**
```typescript
{
  name: string;
  category: InventoryCategory;
  description?: string;
  quantity: number;
  unit?: string;
  minStock?: number;
  costPerUnit?: number;
  supplier?: string;
}
```

**Output:** `InventoryItem`

### inventory.updateStock

Actualiza stock de un item.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
  reason?: string;
}
```

**Output:** `InventoryItem`

### inventory.getLowStock

Obtiene items con stock bajo.

**Tipo:** Query

**Output:** `InventoryItem[]`

---

## Equipos

Router: `team`

### team.members.list

Lista miembros del equipo.

**Tipo:** Query

**Output:** `TeamMember[]`

### team.members.create

Añade miembro al equipo.

**Tipo:** Mutation

**Input:**
```typescript
{
  name: string;
  email: string;
  role: TeamRole;
  phone?: string;
  zones?: number[];
}
```

**Output:** `TeamMember`

### team.zones.list

Lista zonas de trabajo.

**Tipo:** Query

**Output:** `Zone[]`

### team.zones.create

Crea zona de trabajo.

**Tipo:** Mutation

**Input:**
```typescript
{
  name: string;
  description?: string;
  postalCodes?: string[];
}
```

**Output:** `Zone`

### team.assignments.assign

Asigna trabajo a técnico.

**Tipo:** Mutation

**Input:**
```typescript
{
  serviceId: number;
  technicianId: number;
}
```

**Output:** `Assignment`

### team.stats.getByMember

Obtiene estadísticas por miembro.

**Tipo:** Query

**Input:**
```typescript
{
  memberId: number;
  dateFrom?: Date;
  dateTo?: Date;
}
```

**Output:**
```typescript
{
  servicesCompleted: number;
  averageRating: number;
  revenue: number;
}
```

---

## Recordatorios

Router: `reminders`

### reminders.list

Lista recordatorios.

**Tipo:** Query

**Input:**
```typescript
{
  status?: ReminderStatus;
  type?: ReminderType;
}
```

**Output:** `Reminder[]`

### reminders.create

Crea recordatorio.

**Tipo:** Mutation

**Input:**
```typescript
{
  clientId: number;
  pianoId?: number;
  type: ReminderType;
  scheduledDate: Date;
  message?: string;
  channel: 'email' | 'whatsapp' | 'both';
}
```

**Output:** `Reminder`

### reminders.send

Envía recordatorio manualmente.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
}
```

**Output:** `{ success: boolean }`

---

## Suscripciones

Router: `subscription`

### subscription.getCurrent

Obtiene suscripción actual.

**Tipo:** Query

**Output:**
```typescript
{
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  features: string[];
}
```

### subscription.createCheckout

Crea sesión de checkout de Stripe.

**Tipo:** Mutation

**Input:**
```typescript
{
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}
```

**Output:**
```typescript
{
  checkoutUrl: string;
}
```

### subscription.createPortalSession

Crea sesión del portal de Stripe.

**Tipo:** Mutation

**Output:**
```typescript
{
  portalUrl: string;
}
```

---

## Módulos Avanzados

Router: `advanced`

### advanced.verifactu.submit

Envía factura a VeriFactu.

**Tipo:** Mutation

**Input:**
```typescript
{
  invoiceId: number;
}
```

**Output:**
```typescript
{
  success: boolean;
  verifactuId?: string;
  error?: string;
}
```

### advanced.peppol.send

Envía factura por PEPPOL.

**Tipo:** Mutation

**Input:**
```typescript
{
  invoiceId: number;
  recipientId: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  messageId?: string;
}
```

### advanced.reports.generate

Genera informe.

**Tipo:** Mutation

**Input:**
```typescript
{
  type: ReportType;
  dateFrom: Date;
  dateTo: Date;
  format: 'pdf' | 'excel';
}
```

**Output:**
```typescript
{
  url: string;
  filename: string;
}
```

---

## Tipos Comunes

### ClientType

```typescript
type ClientType = 
  | 'particular'
  | 'student'
  | 'professional'
  | 'music_school'
  | 'conservatory'
  | 'concert_hall';
```

### ServiceType

```typescript
type ServiceType = 
  | 'tuning'
  | 'repair'
  | 'regulation'
  | 'maintenance_basic'
  | 'maintenance_complete'
  | 'maintenance_premium'
  | 'inspection'
  | 'restoration'
  | 'other';
```

### ServiceStatus

```typescript
type ServiceStatus = 
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
```

### InvoiceStatus

```typescript
type InvoiceStatus = 
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled';
```

### QuoteStatus

```typescript
type QuoteStatus = 
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired';
```

### PianoCondition

```typescript
type PianoCondition = 
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'needs_repair';
```

### InventoryCategory

```typescript
type InventoryCategory = 
  | 'strings'
  | 'hammers'
  | 'dampers'
  | 'keys'
  | 'action_parts'
  | 'pedals'
  | 'tuning_pins'
  | 'felts'
  | 'tools'
  | 'chemicals'
  | 'other';
```

---

## Manejo de Errores

Todos los procedimientos pueden devolver errores con el siguiente formato:

```typescript
{
  code: TRPCErrorCode;
  message: string;
  data?: {
    field?: string;
    details?: string;
  };
}
```

### Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| `UNAUTHORIZED` | No autenticado |
| `FORBIDDEN` | Sin permisos |
| `NOT_FOUND` | Recurso no encontrado |
| `BAD_REQUEST` | Datos inválidos |
| `INTERNAL_SERVER_ERROR` | Error del servidor |
| `TOO_MANY_REQUESTS` | Rate limit excedido |

---

## Ejemplos de Uso

### React Query con tRPC

```typescript
import { trpc } from '@/utils/trpc';

// Query
const { data: clients, isLoading } = trpc.clients.list.useQuery({
  page: 1,
  limit: 20,
});

// Mutation
const createClient = trpc.clients.create.useMutation({
  onSuccess: () => {
    // Invalidar cache
    utils.clients.list.invalidate();
  },
});

// Llamar mutation
createClient.mutate({
  name: 'Juan García',
  email: 'juan@example.com',
  clientType: 'particular',
});
```

### Llamada directa

```typescript
const client = await trpc.clients.getById.query({ id: 1 });
```
