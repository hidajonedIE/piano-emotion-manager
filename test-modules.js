import { getModulesForPlan } from './server/data/modules-data.js';

const modules = getModulesForPlan('free');

console.log('Total modules:', modules.length);
console.log('\nModules by type:');
console.log('- Core:', modules.filter(m => m.type === 'core').length);
console.log('- Free:', modules.filter(m => m.type === 'free').length);
console.log('- Professional:', modules.filter(m => m.type === 'professional').length);
console.log('- Premium:', modules.filter(m => m.type === 'premium').length);

console.log('\nProfessional modules:');
modules.filter(m => m.type === 'professional').forEach(m => {
  console.log(`  - ${m.name} (${m.code})`);
});

console.log('\nPremium modules:');
modules.filter(m => m.type === 'premium').forEach(m => {
  console.log(`  - ${m.name} (${m.code})`);
});
