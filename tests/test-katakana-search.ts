import { describe, it, after } from 'node:test';
import { strict as assert } from 'node:assert';
import Database from 'better-sqlite3';
import { SearchService } from '../src/services/search-service.js';
import { ImageService } from '../src/services/image-service.js';
import { getDbPath } from '../src/utils/paths.js';

describe('Katakana Search', () => {
  const dbPath = getDbPath(import.meta.url);
  const db = new Database(dbPath, { readonly: true });
  const imageService = new ImageService();
  const searchService = new SearchService(db, imageService);

  after(() => db.close());

  it('should find fish with katakana input "サバ"', async () => {
    const results = await searchService.searchFishByName('サバ', 10);
    assert(results.length > 0, 'No results found for "サバ"');
    
    const hasExpectedMatch = results.some(fish => 
      (fish.matchedName || fish.fbName || '').toLowerCase().includes('saba')
    );
    assert(hasExpectedMatch, 'No fish name contains "saba"');
  });

  it('should find fish with katakana input "イワシ"', async () => {
    const results = await searchService.searchFishByName('イワシ', 10);
    assert(results.length > 0, 'No results found for "イワシ"');
    
    const hasExpectedMatch = results.some(fish => 
      (fish.matchedName || fish.fbName || '').toLowerCase().includes('iwashi')
    );
    assert(hasExpectedMatch, 'No fish name contains "iwashi"');
  });

  it('should find fish with hiragana input "あじ"', async () => {
    const results = await searchService.searchFishByName('あじ', 10);
    assert(results.length > 0, 'No results found for "あじ"');
    
    const hasExpectedMatch = results.some(fish => 
      (fish.matchedName || fish.fbName || '').toLowerCase().includes('aji')
    );
    assert(hasExpectedMatch, 'No fish name contains "aji"');
  });
});