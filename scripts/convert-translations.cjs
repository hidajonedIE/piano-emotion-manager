const fs = require('fs');
const path = require('path');

// Function to convert flat keys to nested object
function flatToNested(flat) {
  const nested = {};
  
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = nested;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  return nested;
}

// Process all translation files
const localesDir = path.join(__dirname, '..', 'locales');
const languages = ['es', 'pt', 'it', 'fr', 'de', 'da', 'en', 'no', 'sv'];

for (const lang of languages) {
  const filePath = path.join(localesDir, lang, 'translations.json');
  
  try {
    const flatTranslations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const nestedTranslations = flatToNested(flatTranslations);
    
    fs.writeFileSync(
      filePath,
      JSON.stringify(nestedTranslations, null, 2) + '\n',
      'utf8'
    );
    
    console.log(`✅ Converted ${lang}/translations.json`);
  } catch (error) {
    console.error(`❌ Error processing ${lang}/translations.json:`, error.message);
  }
}

console.log('\n✅ All translation files converted to nested structure');
