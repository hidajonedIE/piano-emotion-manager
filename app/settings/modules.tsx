/**
 * Página de Configuración de Módulos
 * Piano Emotion Manager
 */

import { Stack } from 'expo-router';
import { ModulesSettings } from '@/components/modules';

export default function ModulesSettingsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Módulos',
          headerBackTitle: 'Atrás',
        }}
      />
      <ModulesSettings />
    </>
  );
}
