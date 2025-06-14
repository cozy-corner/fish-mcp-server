import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { SearchService } from '../search-service.js';
import { DatabaseManager } from '../../database/db-manager.js';
import { DataImporter } from '../../database/data-importer.js';
import { Fish } from '../../types/fish.js';
import { CommonName } from '../data-loader.js';

describe('SearchService', () => {
  let db: Database.Database;
  let searchService: SearchService;
  let dbManager: DatabaseManager;

  before(() => {
    // In-memory database for testing
    db = new Database(':memory:');
    dbManager = new DatabaseManager(':memory:');
    dbManager.initialize();
    db = dbManager.getDatabase();
    searchService = new SearchService(db);

    // Setup test data
    const dataImporter = new DataImporter(db);

    // Insert test fish data
    const testFish: Fish[] = [
      {
        specCode: 1,
        genus: 'Thunnus',
        species: 'albacares',
        scientificName: 'Thunnus albacares',
        fbName: 'Yellowfin tuna',
        fresh: false,
        brackish: false,
        saltwater: true,
        gamefish: true,
        comments:
          'A large oceanic fish found in tropical and subtropical waters',
        remarks: 'Important commercial fish for tuna industry',
      },
      {
        specCode: 2,
        genus: 'Scomber',
        species: 'japonicus',
        scientificName: 'Scomber japonicus',
        fbName: 'Pacific mackerel',
        fresh: false,
        brackish: false,
        saltwater: true,
        gamefish: false,
        comments: 'Common pelagic fish in the Pacific Ocean',
        remarks: 'Forms large schools',
      },
    ];

    dataImporter.insertFish(testFish);

    // Insert test common names
    const testCommonNames: CommonName[] = [
      // Japanese names for tuna
      { comName: 'マグロ', specCode: 1, language: 'Japanese', preferred: true },
      {
        comName: 'まぐろ',
        specCode: 1,
        language: 'Japanese',
        preferred: false,
      },
      { comName: '鮪', specCode: 1, language: 'Japanese', preferred: false },
      {
        comName: 'キハダマグロ',
        specCode: 1,
        language: 'Japanese',
        preferred: false,
      },
      // Romaji names
      {
        comName: 'Kihada-maguro',
        specCode: 1,
        language: 'Japanese',
        preferred: false,
      },
      // English names
      {
        comName: 'Yellowfin tuna',
        specCode: 1,
        language: 'English',
        preferred: true,
      },
      { comName: 'Ahi', specCode: 1, language: 'English', preferred: false },
      // Names for mackerel
      { comName: 'サバ', specCode: 2, language: 'Japanese', preferred: true },
      { comName: 'さば', specCode: 2, language: 'Japanese', preferred: false },
      { comName: '鯖', specCode: 2, language: 'Japanese', preferred: false },
      { comName: 'Saba', specCode: 2, language: 'Japanese', preferred: false },
      {
        comName: 'Pacific mackerel',
        specCode: 2,
        language: 'English',
        preferred: true,
      },
    ];

    dataImporter.insertCommonNames(testCommonNames);

    // Build FTS5 index
    dataImporter.buildFTSIndex();
  });

  after(() => {
    if (dbManager) {
      dbManager.close();
    }
  });

  describe('searchFishByName', () => {
    it('should find fish by exact Japanese name in katakana', async () => {
      const results = await searchService.searchFishByName('マグロ', 10);
      assert.ok(results.length > 0);
      assert.ok(results.some(r => r.specCode === 1));
      assert.ok(results.some(r => r.matchType === 'japanese_exact'));
      assert.ok(results.some(r => r.matchedName === 'マグロ'));
    });

    it('should find fish by exact Japanese name in hiragana', async () => {
      const results = await searchService.searchFishByName('まぐろ', 10);
      assert.ok(results.length > 0);
      assert.ok(results.some(r => r.specCode === 1));
      assert.ok(results.some(r => r.matchType === 'japanese_exact'));
    });

    it('should find fish by exact Japanese name in kanji', async () => {
      const results = await searchService.searchFishByName('鮪', 10);
      assert.equal(results.length, 1);
      assert.equal(results[0].specCode, 1);
      assert.equal(results[0].matchType, 'japanese_exact');
      assert.equal(results[0].matchedName, '鮪');
    });

    it('should find fish by partial Japanese name match', async () => {
      const results = await searchService.searchFishByName('キハダ', 10);
      assert(results.length >= 1, 'Should find at least one fish');
      const targetFish = results.find(fish => fish.specCode === 1);
      assert(targetFish, 'Should find fish with spec code 1');
      assert.equal(targetFish.matchType, 'japanese_partial');
    });

    it('should find fish by English name', async () => {
      const results = await searchService.searchFishByName('tuna', 10);
      assert.equal(results.length, 1);
      assert.equal(results[0].specCode, 1);
      // Could be description_match or english_partial
      assert.ok(
        ['description_match', 'english_partial', 'fts_search'].includes(
          results[0].matchType
        )
      );
    });

    it('should find fish by scientific name', async () => {
      const results = await searchService.searchFishByName('Thunnus', 10);
      assert.equal(results.length, 1);
      assert.equal(results[0].specCode, 1);
      assert.ok(
        ['fts_search', 'english_partial'].includes(results[0].matchType)
      );
    });

    it('should handle FTS5 search without SQL errors', async () => {
      // This query should trigger FTS5 search path
      const results = await searchService.searchFishByName(
        'oceanic tropical',
        10
      );
      // Should not throw error, even if no results
      assert.ok(Array.isArray(results));
    });

    it('should find multiple fish when query matches multiple species', async () => {
      const results = await searchService.searchFishByName('fish', 20);
      assert.ok(results.length > 0);
      // Both test fish have 'fish' in their comments
    });

    it('should return empty array when no match found', async () => {
      const results = await searchService.searchFishByName('イルカ', 10);
      assert.equal(results.length, 0);
    });

    it('should respect limit parameter', async () => {
      const results = await searchService.searchFishByName('fish', 1);
      assert.equal(results.length, 1);
    });

    it('should handle hiragana to katakana conversion', async () => {
      const results = await searchService.searchFishByName('さば', 10);
      assert.ok(results.length > 0);
      assert.ok(results.some(r => r.specCode === 2));
    });

    it('should handle katakana to hiragana conversion', async () => {
      const results = await searchService.searchFishByName('サバ', 10);
      assert.ok(results.length > 0);
      assert.ok(results.some(r => r.specCode === 2));
    });

    it('should handle romaji Japanese names', async () => {
      const results = await searchService.searchFishByName('Kihada', 10);
      assert.equal(results.length, 1);
      assert.equal(results[0].specCode, 1);
    });

    it('should not include images by default', async () => {
      const results = await searchService.searchFishByName('マグロ', 10);
      assert.ok(results.length > 0);
      assert.ok(!('images' in results[0]));
    });

    it('should handle includeImages parameter', async () => {
      const results = await searchService.searchFishByName('マグロ', 10, true);
      assert.ok(results.length > 0);
      assert.ok('images' in results[0]);
      assert.ok(Array.isArray(results[0].images));
    });
  });

  describe('searchFishByFeatures', () => {
    it('should find saltwater fish', async () => {
      const results = await searchService.searchFishByFeatures(
        {
          environment: 'saltwater',
        },
        10
      );
      assert.equal(results.length, 2);
    });

    it('should handle empty search criteria', async () => {
      const results = await searchService.searchFishByFeatures({}, 10);
      assert.equal(results.length, 2);
    });

    it('should respect limit in feature search', async () => {
      const results = await searchService.searchFishByFeatures({}, 1);
      assert.equal(results.length, 1);
    });
  });

  describe('getCommonNamesForFish', () => {
    it('should return all common names for a fish', () => {
      const names = searchService.getCommonNamesForFish(1);
      assert.equal(names.length, 7); // All names for tuna

      const japaneseNames = names.filter(n => n.language === 'Japanese');
      assert.equal(japaneseNames.length, 5);

      const englishNames = names.filter(n => n.language === 'English');
      assert.equal(englishNames.length, 2);
    });

    it('should return empty array for non-existent fish', () => {
      const names = searchService.getCommonNamesForFish(999);
      assert.equal(names.length, 0);
    });
  });

  describe('getFishBySpecCode', () => {
    it('should return fish by spec code', () => {
      const fish = searchService.getFishBySpecCode(1);
      assert.ok(fish);
      assert.equal(fish.specCode, 1);
      assert.equal(fish.scientificName, 'Thunnus albacares');
    });

    it('should return null for non-existent spec code', () => {
      const fish = searchService.getFishBySpecCode(999);
      assert.equal(fish, null);
    });
  });

  describe('FTS5 SQL error regression test', () => {
    it('should not throw SQL error for queries that trigger FTS5 path', async () => {
      // These queries should go through different search paths
      const testQueries = [
        'わたし', // No exact/partial match, should reach FTS5
        'unknown_fish_name', // English, no match, should reach FTS5
        'deep water habitat', // Multi-word query
        '未知の魚', // Japanese phrase not in data
      ];

      for (const query of testQueries) {
        // Should not throw error
        await assert.doesNotReject(async () => {
          const results = await searchService.searchFishByName(query, 10);
          assert.ok(Array.isArray(results));
        }, `Query "${query}" should not throw SQL error`);
      }
    });
  });
});
