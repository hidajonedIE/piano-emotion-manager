#!/usr/bin/env node
import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

const drizzleDir = 'drizzle';
const files = readdirSync(drizzleDir).filter(f => f.endsWith('.ts') && f !== 'db.ts');

console.log(`📦 Compilando ${files.length} archivos drizzle...`);

for (const file of files) {
  const filePath = join(drizzleDir, file);
  try {
    execSync(
      `pnpm exec tsc ${filePath} --outDir ${drizzleDir} --module esnext --target es2020 --moduleResolution bundler --skipLibCheck --declaration false --isolatedModules`,
      { stdio: 'pipe' }
    );
    console.log(`  ✅ ${file}`);
  } catch (error) {
    console.error(`  ❌ ${file}: ${error.message}`);
    process.exit(1);
  }
}

console.log(`✅ Compilación completada`);
