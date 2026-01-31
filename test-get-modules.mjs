import { getModulesForPlan } from './server/data/modules-data.js';

try {
  console.log('Testing getModulesForPlan...\n');
  
  const modules = getModulesForPlan('free');
  
  console.log(`✅ Success! Got ${modules.length} modules`);
  console.log('\nModule types:');
  console.log('- Core:', modules.filter(m => m.type === 'core').length);
  console.log('- Free:', modules.filter(m => m.type === 'free').length);
  console.log('- Professional:', modules.filter(m => m.type === 'professional').length);
  console.log('- Premium:', modules.filter(m => m.type === 'premium').length);
  
  console.log('\nFirst 3 modules:');
  modules.slice(0, 3).forEach(m => {
    console.log(`  - ${m.name} (${m.code}) - type: ${m.type}`);
  });
  
  console.log('\nJSON output (first module):');
  console.log(JSON.stringify(modules[0], null, 2));
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}
