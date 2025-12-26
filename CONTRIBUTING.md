# Guía de Contribución

Gracias por tu interés en contribuir a Piano Emotion Manager. Esta guía te ayudará a entender cómo puedes colaborar en el proyecto.

## Índice

1. [Código de Conducta](#código-de-conducta)
2. [Cómo Empezar](#cómo-empezar)
3. [Proceso de Desarrollo](#proceso-de-desarrollo)
4. [Estándares de Código](#estándares-de-código)
5. [Commits y Pull Requests](#commits-y-pull-requests)
6. [Testing](#testing)
7. [Documentación](#documentación)

---

## Código de Conducta

Este proyecto sigue un código de conducta que todos los contribuidores deben respetar:

- Ser respetuoso y constructivo en las comunicaciones
- Aceptar críticas constructivas de manera profesional
- Enfocarse en lo mejor para la comunidad y el proyecto
- Mostrar empatía hacia otros miembros de la comunidad

---

## Cómo Empezar

### Requisitos Previos

- Node.js 18 o superior
- pnpm (recomendado) o npm
- Git
- Editor de código (VS Code recomendado)

### Configuración del Entorno

1. **Fork del repositorio**
   ```bash
   # En GitHub, haz click en "Fork"
   ```

2. **Clonar tu fork**
   ```bash
   git clone https://github.com/TU_USUARIO/piano-emotion-manager.git
   cd piano-emotion-manager
   ```

3. **Añadir upstream**
   ```bash
   git remote add upstream https://github.com/ORIGINAL/piano-emotion-manager.git
   ```

4. **Instalar dependencias**
   ```bash
   pnpm install
   ```

5. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   # Editar .env.local con tus credenciales
   ```

6. **Iniciar servidor de desarrollo**
   ```bash
   pnpm dev
   ```

### Extensiones de VS Code Recomendadas

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- Prisma (para Drizzle)

---

## Proceso de Desarrollo

### Flujo de Trabajo

1. **Sincronizar con upstream**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Crear rama de feature**
   ```bash
   git checkout -b feature/nombre-descriptivo
   # o para bugs:
   git checkout -b fix/descripcion-del-bug
   ```

3. **Desarrollar y hacer commits**
   ```bash
   # Hacer cambios...
   git add .
   git commit -m "feat: descripción del cambio"
   ```

4. **Ejecutar tests**
   ```bash
   pnpm test
   ```

5. **Push y crear PR**
   ```bash
   git push origin feature/nombre-descriptivo
   # Crear Pull Request en GitHub
   ```

### Tipos de Contribuciones

| Tipo | Descripción | Rama |
|------|-------------|------|
| Feature | Nueva funcionalidad | `feature/nombre` |
| Bug Fix | Corrección de errores | `fix/descripcion` |
| Docs | Documentación | `docs/tema` |
| Refactor | Mejora de código | `refactor/area` |
| Test | Nuevos tests | `test/area` |
| Chore | Mantenimiento | `chore/tarea` |

---

## Estándares de Código

### TypeScript

- **Strict mode**: No usar `any` bajo ninguna circunstancia
- **Tipos explícitos**: Definir tipos para parámetros y retornos de funciones
- **Interfaces**: Preferir interfaces sobre types para objetos

```typescript
// ✅ Correcto
interface ClientData {
  name: string;
  email: string;
}

function createClient(data: ClientData): Promise<Client> {
  // ...
}

// ❌ Incorrecto
function createClient(data: any) {
  // ...
}
```

### React/React Native

- **Functional Components**: Usar siempre componentes funcionales
- **Hooks**: Seguir las reglas de hooks
- **Memoization**: Usar `React.memo` para componentes que reciben props estables

```typescript
// ✅ Correcto
export const ClientCard = memo(function ClientCard({ client }: ClientCardProps) {
  return (
    <View>
      <ThemedText>{client.name}</ThemedText>
    </View>
  );
});

// ❌ Incorrecto
export class ClientCard extends React.Component {
  // ...
}
```

### Estilos

- **StyleSheet**: Usar `StyleSheet.create()` para estilos
- **Constantes de tema**: Usar constantes de `@/constants/theme`
- **No inline styles**: Evitar estilos inline cuando sea posible

```typescript
// ✅ Correcto
const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});

// ❌ Incorrecto
<View style={{ padding: 16, borderRadius: 8 }}>
```

### Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos de componentes | kebab-case | `client-card.tsx` |
| Componentes | PascalCase | `ClientCard` |
| Funciones | camelCase | `createClient` |
| Constantes | UPPER_SNAKE_CASE | `MAX_CLIENTS` |
| Tipos/Interfaces | PascalCase | `ClientData` |
| Hooks | camelCase con "use" | `useClientData` |

### Estructura de Archivos

```
component-name/
├── index.ts           # Exportaciones
├── component-name.tsx # Componente principal
├── component-name.test.tsx # Tests
├── types.ts           # Tipos específicos
└── styles.ts          # Estilos (si son extensos)
```

---

## Commits y Pull Requests

### Conventional Commits

Seguimos la especificación de [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[alcance opcional]: <descripción>

[cuerpo opcional]

[notas de pie opcionales]
```

#### Tipos de Commit

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `style` | Formato (no afecta código) |
| `refactor` | Refactorización |
| `test` | Añadir o modificar tests |
| `chore` | Tareas de mantenimiento |
| `perf` | Mejoras de rendimiento |

#### Ejemplos

```bash
feat(clients): add search functionality
fix(invoices): correct tax calculation
docs(readme): update installation instructions
refactor(services): extract workflow logic to service
test(auth): add login flow tests
```

### Pull Requests

#### Título

Seguir el mismo formato que los commits:
```
feat(area): descripción breve del cambio
```

#### Descripción

Usar la plantilla proporcionada:

```markdown
## Descripción
Breve descripción del cambio realizado.

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## Checklist
- [ ] He ejecutado los tests localmente
- [ ] He añadido tests para los cambios
- [ ] He actualizado la documentación
- [ ] El código sigue los estándares del proyecto

## Screenshots (si aplica)
[Capturas de pantalla]

## Notas Adicionales
[Cualquier información adicional]
```

---

## Testing

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Tests con watch mode
pnpm test -- --watch

# Tests con cobertura
pnpm test -- --coverage

# Tests específicos
pnpm test -- --grep "clients"
```

### Escribir Tests

#### Tests de Servicios

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowService } from '@/server/services/workflow.service';

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(() => {
    service = new WorkflowService();
  });

  describe('transitionState', () => {
    it('should transition from pending to scheduled', () => {
      const result = service.transitionState('pending', 'scheduled');
      expect(result.success).toBe(true);
    });

    it('should not allow invalid transitions', () => {
      const result = service.transitionState('completed', 'pending');
      expect(result.success).toBe(false);
    });
  });
});
```

#### Tests de Componentes

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ClientCard } from '@/components/client-card';

describe('ClientCard', () => {
  const mockClient = {
    id: 1,
    name: 'Test Client',
    email: 'test@example.com',
  };

  it('renders client name', () => {
    render(<ClientCard client={mockClient} />);
    expect(screen.getByText('Test Client')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPress = vi.fn();
    render(<ClientCard client={mockClient} onPress={onPress} />);
    fireEvent.press(screen.getByText('Test Client'));
    expect(onPress).toHaveBeenCalledWith(mockClient);
  });
});
```

### Cobertura Mínima

- **Servicios**: 80% de cobertura
- **Routers**: 70% de cobertura
- **Componentes críticos**: 60% de cobertura

---

## Documentación

### Documentar Código

#### Funciones y Métodos

```typescript
/**
 * Crea un nuevo cliente en el sistema.
 * 
 * @param data - Datos del cliente a crear
 * @returns El cliente creado con su ID asignado
 * @throws {ValidationError} Si los datos son inválidos
 * @throws {DuplicateError} Si ya existe un cliente con el mismo email
 * 
 * @example
 * const client = await createClient({
 *   name: 'Juan García',
 *   email: 'juan@example.com',
 *   clientType: 'particular',
 * });
 */
async function createClient(data: CreateClientInput): Promise<Client> {
  // ...
}
```

#### Componentes

```typescript
/**
 * Tarjeta de cliente que muestra información resumida.
 * 
 * @component
 * @example
 * <ClientCard
 *   client={client}
 *   onPress={handlePress}
 *   showActions
 * />
 */
export const ClientCard = memo(function ClientCard({
  client,
  onPress,
  showActions = false,
}: ClientCardProps) {
  // ...
});
```

### Actualizar Documentación

Cuando hagas cambios que afecten a:

- **API**: Actualizar `docs/api/trpc-reference.md`
- **Arquitectura**: Actualizar `docs/architecture/system-architecture.md`
- **Configuración**: Actualizar `README.md`
- **Nuevas features**: Añadir sección en documentación relevante

---

## Preguntas Frecuentes

### ¿Cómo reporto un bug?

1. Busca si ya existe un issue similar
2. Si no existe, crea uno nuevo usando la plantilla de bug
3. Incluye pasos para reproducir, comportamiento esperado y actual

### ¿Cómo propongo una nueva feature?

1. Abre un issue de tipo "Feature Request"
2. Describe el problema que resuelve
3. Propón una solución si la tienes
4. Espera feedback antes de implementar

### ¿Qué hago si mi PR tiene conflictos?

```bash
git fetch upstream
git checkout tu-rama
git rebase upstream/main
# Resolver conflictos
git push --force-with-lease
```

### ¿Cuánto tarda en revisarse un PR?

Intentamos revisar PRs en un plazo de 3-5 días laborables. PRs más pequeños y bien documentados se revisan más rápido.

---

## Contacto

Si tienes dudas sobre cómo contribuir:

- Abre un issue con la etiqueta "question"
- Contacta a los maintainers

¡Gracias por contribuir a Piano Emotion Manager!
