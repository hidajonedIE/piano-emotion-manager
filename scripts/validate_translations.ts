
import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.join(__dirname, '../locales');
const languages = fs.readdirSync(localesDir).filter(file => fs.statSync(path.join(localesDir, file)).isDirectory());

const baseLanguage = 'es';
const baseTranslations = JSON.parse(fs.readFileSync(path.join(localesDir, baseLanguage, 'translations.json'), 'utf-8'));

function getKeys(obj: any, prefix = ''): string[] {
  return Object.keys(obj).reduce((res, el) => {
    if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getKeys(obj[el], prefix + el + '.')];
    } else {
      return [...res, prefix + el];
    }
  }, [] as string[]);
}

const baseKeys = getKeys(baseTranslations);

console.log('Validating translations...');

languages.forEach(lang => {
  if (lang === baseLanguage) return;

  const langPath = path.join(localesDir, lang, 'translations.json');
  if (!fs.existsSync(langPath)) {
    console.warn(`[WARN] ${lang} is missing translations.json`);
    return;
  }

  const langTranslations = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
  const langKeys = getKeys(langTranslations);

  const missingKeys = baseKeys.filter(key => !langKeys.includes(key));
  const extraKeys = langKeys.filter(key => !baseKeys.includes(key));

  if (missingKeys.length > 0) {
    console.error(`[ERROR] ${lang} is missing keys:`);
    missingKeys.forEach(key => console.log(`  - ${key}`));
  }

  if (extraKeys.length > 0) {
    console.warn(`[WARN] ${lang} has extra keys:`);
    extraKeys.forEach(key => console.log(`  - ${key}`));
  }
});

console.log('Validation complete.');
