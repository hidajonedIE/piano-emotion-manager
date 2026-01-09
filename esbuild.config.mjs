import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para resolver un path con extensiones
function resolveWithExtensions(basePath, extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json']) {
  // Si ya tiene extensión, verificar si existe
  if (extensions.some(ext => basePath.endsWith(ext))) {
    if (fs.existsSync(basePath)) {
      return basePath;
    }
  }
  
  // Probar cada extensión
  for (const ext of extensions) {
    const fullPath = basePath + ext;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  // Probar como directorio con index
  for (const ext of extensions) {
    const indexPath = path.join(basePath, 'index' + ext);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  return null;
}

// Plugin para resolver aliases @/ y @shared/
const aliasPlugin = {
  name: 'alias-resolver',
  setup(build) {
    // Resolver @/ -> ./
    build.onResolve({ filter: /^@\// }, (args) => {
      const relativePath = args.path.replace(/^@\//, './');
      const basePath = path.resolve(__dirname, relativePath);
      const resolved = resolveWithExtensions(basePath);
      
      if (resolved) {
        return { path: resolved };
      }
      
      // Si no se encuentra, dejar que esbuild maneje el error
      return { path: basePath };
    });

    // Resolver @shared/ -> ./shared/
    build.onResolve({ filter: /^@shared\// }, (args) => {
      const relativePath = args.path.replace(/^@shared\//, './shared/');
      const basePath = path.resolve(__dirname, relativePath);
      const resolved = resolveWithExtensions(basePath);
      
      if (resolved) {
        return { path: resolved };
      }
      
      return { path: basePath };
    });
  },
};

try {
  await esbuild.build({
    entryPoints: ['server/_core/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outdir: 'web-build',
    packages: 'external',
    plugins: [aliasPlugin],
    // Resolver extensiones .ts automáticamente
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
    // Ignorar errores de tipo para el build
    logLevel: 'info',
  });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
