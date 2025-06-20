import { SearchService } from './src/services/search-service.js';
import { DbManager } from './src/database/db-manager.js';

async function debugSearch() {
  const dbManager = new DbManager();
  const searchService = new SearchService(dbManager.getDatabase());

  console.log('Testing natural language search:');
  const results = await searchService.searchFishByNaturalLanguage('small freshwater aquarium fish', 10, -0.25);
  console.log('Results count:', results.length);
  console.log('Results:', results.map(r => ({ specCode: r.specCode, fbName: r.fbName, score: r.score })));

  console.log('\nTesting with higher threshold:');
  const results2 = await searchService.searchFishByNaturalLanguage('small freshwater aquarium fish', 10, 10.0);
  console.log('Results count:', results2.length);
  console.log('Results:', results2.map(r => ({ specCode: r.specCode, fbName: r.fbName, score: r.score })));

  console.log('\nTesting simple freshwater query:');
  const results3 = await searchService.searchFishByNaturalLanguage('freshwater', 10, 10.0);
  console.log('Results count:', results3.length);
  console.log('Results:', results3.map(r => ({ specCode: r.specCode, fbName: r.fbName, score: r.score })));
}

debugSearch().catch(console.error);