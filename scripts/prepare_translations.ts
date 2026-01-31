
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

const allMissingKeys: { [lang: string]: string[] } = {};

languages.forEach(lang => {
  if (lang === baseLanguage) return;

  const langPath = path.join(localesDir, lang, 'translations.json');
  if (!fs.existsSync(langPath)) {
    allMissingKeys[lang] = baseKeys;
    return;
  }

  const langTranslations = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
  const langKeys = getKeys(langTranslations);

  const missingKeys = baseKeys.filter(key => !langKeys.includes(key));
  if (missingKeys.length > 0) {
    allMissingKeys[lang] = missingKeys;
  }
});

fs.writeFileSync(path.join(__dirname, 'missing_keys.json'), JSON.stringify(allMissingKeys, null, 2));

console.log('Missing keys report generated.');
