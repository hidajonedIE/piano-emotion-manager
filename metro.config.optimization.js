/**
 * Metro Config Optimization
 * 
 * Configuración optimizada para reducir bundle size y mejorar performance
 */

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ============================================================================
// OPTIMIZACIONES DE BUNDLE
// ============================================================================

// 1. Minificación agresiva en producción
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      // Eliminar console.log en producción
      drop_console: process.env.NODE_ENV === 'production',
      // Eliminar debugger statements
      drop_debugger: true,
      // Optimizaciones adicionales
      passes: 3,
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      unsafe_math: true,
      unsafe_proto: true,
    },
    mangle: {
      // Mangling de nombres para reducir tamaño
      toplevel: true,
      keep_classnames: false,
      keep_fnames: false,
    },
    output: {
      // Formato compacto
      comments: false,
      ascii_only: true,
    },
  },
};

// 2. Tree shaking mejorado
config.resolver = {
  ...config.resolver,
  // Extensiones en orden de prioridad
  sourceExts: ['tsx', 'ts', 'jsx', 'js', 'json'],
  // Blacklist de módulos innecesarios
  blockList: [
    /node_modules\/.*\/__(tests?|mocks?)__\/.*/,
    /node_modules\/.*\/.*(spec|test)\.(js|ts|tsx)$/,
  ],
};

// 3. Caché optimizado
config.cacheStores = [
  {
    // Usar caché del sistema de archivos
    type: 'FileStore',
    root: '.metro-cache',
  },
];

// 4. Optimización de assets
config.transformer.assetPlugins = [
  ...(config.transformer.assetPlugins || []),
  // Aquí se pueden agregar plugins de optimización de imágenes
];

// ============================================================================
// CONFIGURACIÓN DE PRODUCCIÓN
// ============================================================================

if (process.env.NODE_ENV === 'production') {
  // Optimizaciones adicionales para producción
  config.transformer.enableBabelRCLookup = false;
  config.transformer.enableBabelRuntime = false;
  
  // Desactivar source maps en producción (reduce tamaño)
  config.serializer = {
    ...config.serializer,
    createModuleIdFactory: () => {
      // IDs numéricos más cortos
      let nextId = 0;
      return () => nextId++;
    },
  };
}

module.exports = config;
