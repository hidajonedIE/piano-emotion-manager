/**
 * Layout para módulos avanzados
 * Piano Emotion Manager
 */

import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Atrás',
        headerTitleStyle: {
          fontFamily: 'Arkhip',
        },
      }}
    >
      {/* Gestión de Equipos */}
      <Stack.Screen
        name="team/index"
        options={{ title: 'Gestión de Equipos' }}
      />
      <Stack.Screen
        name="team/members"
        options={{ title: 'Miembros del Equipo' }}
      />
      <Stack.Screen
        name="team/calendar"
        options={{ title: 'Calendario del Equipo' }}
      />
      <Stack.Screen
        name="team/settings"
        options={{ title: 'Configuración de Organización' }}
      />
      <Stack.Screen
        name="team/create-organization"
        options={{ title: 'Crear Organización' }}
      />

      {/* Inventario */}
      <Stack.Screen
        name="inventory/index"
        options={{ title: 'Inventario' }}
      />
      <Stack.Screen
        name="inventory/products"
        options={{ title: 'Productos' }}
      />
      <Stack.Screen
        name="inventory/warehouses"
        options={{ title: 'Almacenes' }}
      />

      {/* Reportes */}
      <Stack.Screen
        name="reports/index"
        options={{ title: 'Reportes y Analytics' }}
      />

      {/* CRM */}
      <Stack.Screen
        name="crm/index"
        options={{ title: 'CRM Avanzado' }}
      />

      {/* Calendario Avanzado */}
      <Stack.Screen
        name="calendar"
        options={{ title: 'Calendario' }}
      />

      {/* Contabilidad */}
      <Stack.Screen
        name="accounting/index"
        options={{ title: 'Contabilidad' }}
      />

      {/* Tienda */}
      <Stack.Screen
        name="shop/index"
        options={{ title: 'Tienda' }}
      />
    </Stack>
  );
}
