/**
 * Vitest Setup File
 * Piano Emotion Manager
 * 
 * Este archivo se ejecuta antes de cada archivo de test.
 */

import { vi } from 'vitest';

// Mock de variables de entorno
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';
process.env.NODE_ENV = 'test';

// Mock global de AsyncStorage para tests de React Native
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    getAllKeys: vi.fn(() => Promise.resolve([])),
    multiGet: vi.fn(() => Promise.resolve([])),
    multiSet: vi.fn(() => Promise.resolve()),
  },
}));

// Mock de expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock de expo-router
vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
}));

// Limpiar mocks después de cada test
afterEach(() => {
  vi.clearAllMocks();
});
