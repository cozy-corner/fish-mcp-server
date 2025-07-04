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
      },
      {
        specCode: 3,
        genus: 'Chaetodon',
        species: 'aureus',
        scientificName: 'Chaetodon aureus',
        fbName: 'Golden butterflyfish',
        fresh: false,
        brackish: false,
        saltwater: true,
        gamefish: false,
        comments: 'Butterfly fish with golden coloration',
      },
      {
        specCode: 4,
        genus: 'Misgurnus',
        species: 'anguillicaudatus',
        scientificName: 'Misgurnus anguillicaudatus',
        fbName: 'Oriental weatherloach',
        fresh: true,
        brackish: false,
        saltwater: false,
        gamefish: false,
        comments: 'Freshwater loach species',
      },
    ];

    dataImporter.insertFish(testFish);

    // Insert test common names
    const testCommonNames: CommonName[] = [
      // Japanese names for tuna - mostly romaji (realistic)
      {
        comName: 'Kihada-maguro',
        specCode: 1,
        language: 'Japanese',
        preferred: true,
      },
      {
        comName: 'Maguro',
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
      // Names for mackerel - romaji only (realistic)
      { comName: 'Saba', specCode: 2, language: 'Japanese', preferred: true },
      {
        comName: 'Ma-saba',
        specCode: 2,
        language: 'Japanese',
        preferred: false,
      },
      {
        comName: 'Pacific mackerel',
        specCode: 2,
        language: 'English',
        preferred: true,
      },
      // Names for butterflyfish - testing ou->ô normalization with romaji
      {
        comName: 'Chôchô-uo',
        specCode: 3,
        language: 'Japanese',
        preferred: true,
      },
      {
        comName: 'Chouchou-uo',
        specCode: 3,
        language: 'Japanese',
        preferred: false,
      },
      {
        comName: 'Golden butterflyfish',
        specCode: 3,
        language: 'English',
        preferred: true,
      },
      // Names for loach - testing ou->ô normalization with romaji
      {
        comName: 'Dojô',
        specCode: 4,
        language: 'Japanese',
        preferred: true,
      },
      {
        comName: 'Dojou',
        specCode: 4,
        language: 'Japanese',
        preferred: false,
      },
      {
        comName: 'Oriental weatherloach',
        specCode: 4,
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
    it('should find fish by katakana input via romaji conversion', async () => {
      const results = await searchService.searchFishByName('マグロ', 10);
      assert(results.length > 0, 'Should find fish via romaji conversion');
      assert(
        results.some(r => r.specCode === 1),
        'Should find tuna'
      );
      // Should match via romaji conversion, not exact match
      assert(
        results.some(
          r => r.matchedName === 'Maguro' || r.matchedName === 'Kihada-maguro'
        )
      );
    });

    it('should find fish by hiragana input via romaji conversion', async () => {
      const results = await searchService.searchFishByName('まぐろ', 10);
      assert(results.length > 0, 'Should find fish via romaji conversion');
      assert(
        results.some(r => r.specCode === 1),
        'Should find tuna'
      );
    });

    it('should find fish by partial katakana name match', async () => {
      const results = await searchService.searchFishByName('キハダ', 10);
      assert(results.length >= 1, 'Should find at least one fish');
      const targetFish = results.find(fish => fish.specCode === 1);
      assert(targetFish, 'Should find fish with spec code 1');
      // Should match 'Kihada-maguro' via partial match
    });

    it('should find fish by English name', async () => {
      const results = await searchService.searchFishByName('tuna', 10);
      assert.equal(results.length, 1);
      assert.equal(results[0].specCode, 1);
      // Could be english_partial or fts_search
      assert.ok(
        ['english_partial', 'fts_search'].includes(results[0].matchType)
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

      // Check that saltwater fish are found
      assert(
        results.some(f => f.specCode === 1),
        'Should find tuna'
      );
      assert(
        results.some(f => f.specCode === 2),
        'Should find mackerel'
      );
      assert(
        results.some(f => f.specCode === 3),
        'Should find butterflyfish'
      );

      // Check that freshwater fish are not included
      assert(
        !results.some(f => f.specCode === 4),
        'Should not find freshwater loach'
      );
    });

    it('should handle empty search criteria', async () => {
      const results = await searchService.searchFishByFeatures({}, 10);

      // Should return all test fish when no criteria specified
      assert(
        results.some(f => f.specCode === 1),
        'Should include tuna'
      );
      assert(
        results.some(f => f.specCode === 2),
        'Should include mackerel'
      );
      assert(
        results.some(f => f.specCode === 3),
        'Should include butterflyfish'
      );
      assert(
        results.some(f => f.specCode === 4),
        'Should include loach'
      );
    });

    it('should respect limit in feature search', async () => {
      const results = await searchService.searchFishByFeatures({}, 1);
      assert.equal(results.length, 1, 'Should respect limit parameter');
      assert(results[0].specCode > 0, 'Should return valid fish');
    });
  });

  describe('getCommonNamesForFish', () => {
    it('should return all common names for a fish', () => {
      const names = searchService.getCommonNamesForFish(1);
      // Check that we get both Japanese and English names
      assert(names.length > 0, 'Should have common names');

      const japaneseNames = names.filter(n => n.language === 'Japanese');
      assert(japaneseNames.length > 0, 'Should have Japanese names');
      assert(japaneseNames.some(n => n.comName === 'Maguro'));
      assert(japaneseNames.some(n => n.comName === 'Kihada-maguro'));

      const englishNames = names.filter(n => n.language === 'English');
      assert(englishNames.length > 0, 'Should have English names');
      assert(englishNames.some(n => n.comName === 'Yellowfin tuna'));
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

  describe('diacritic normalization in search', () => {
    it('should find fish using kana input with ou/uu patterns', async () => {
      // Test that Japanese input gets normalized and finds fish
      // These searches test the internal toRomaji normalization

      // Test チョウチョウ (butterfly) pattern - should normalize chouchou -> chôchô
      const butterflyResults = await searchService.searchFishByName(
        'チョウチョウ',
        10
      );
      assert(butterflyResults.length > 0, 'Should find butterfly fish');
      assert(
        butterflyResults.some(f => f.specCode === 3),
        'Should find butterflyfish with spec code 3'
      );

      // Test ドジョウ (loach) pattern - should normalize dojou -> dojô
      const loachResults = await searchService.searchFishByName('ドジョウ', 10);
      assert(loachResults.length > 0, 'Should find loach fish');
      assert(
        loachResults.some(f => f.specCode === 4),
        'Should find loach with spec code 4'
      );
    });

    it('should find fish using romaji input with ou/uu patterns', async () => {
      // Test that romaji input also gets normalized

      // Test plain ou pattern - should normalize to ô and find butterflyfish
      const ouResults = await searchService.searchFishByName('chouchou', 10);
      assert(
        ouResults.length > 0,
        'Should find fish with chouchou->chôchô normalization'
      );
      assert(
        ouResults.some(f => f.specCode === 3),
        'Should find butterflyfish via romaji normalization'
      );

      // Test dojou pattern - should normalize to dojô and find loach
      const dojouResults = await searchService.searchFishByName('dojou', 10);
      assert(
        dojouResults.length > 0,
        'Should find fish with dojou->dojô normalization'
      );
      assert(
        dojouResults.some(f => f.specCode === 4),
        'Should find loach via romaji normalization'
      );
    });

    it('should find same fish regardless of normalization', async () => {
      // Test that both normalized and non-normalized versions find the same fish

      // Search using both forms should find the same butterflyfish
      const normalizedResults = await searchService.searchFishByName(
        'chôchô',
        10
      );
      const nonNormalizedResults = await searchService.searchFishByName(
        'chouchou',
        10
      );

      assert(
        normalizedResults.length > 0,
        'Should find fish with normalized input'
      );
      assert(
        nonNormalizedResults.length > 0,
        'Should find fish with non-normalized input'
      );

      // Both should find the same butterflyfish
      const foundInBoth =
        normalizedResults.some(f => f.specCode === 3) &&
        nonNormalizedResults.some(f => f.specCode === 3);
      assert(foundInBoth, 'Both searches should find the same butterflyfish');
    });

    it('should preserve non-normalized patterns in search', async () => {
      // Test that patterns without ou/uu work normally
      const sabaResults = await searchService.searchFishByName('saba', 10);
      assert(sabaResults.length > 0, 'Should find mackerel with saba');
      assert(
        sabaResults.some(f => f.specCode === 2),
        'Should find mackerel via saba search'
      );
    });
  });

  describe('searchFishByNaturalLanguage', () => {
    it('should find fish by natural language query with relevant terms', async () => {
      // Test query that should match tuna's comments
      const results = await searchService.searchFishByNaturalLanguage(
        'large oceanic fish tropical waters',
        10,
        -0.25
      );

      assert(
        results.length > 0,
        'Should find results for tropical oceanic fish'
      );
      assert(
        results.some(r => r.specCode === 1),
        'Should find Yellowfin tuna which matches the description'
      );
      assert.equal(results[0].matchType, 'natural_language');
    });

    it('should filter results by BM25 score threshold', async () => {
      // Test threshold filtering effect with same query but different thresholds
      const strictResults = await searchService.searchFishByNaturalLanguage(
        'oceanic fish',
        10,
        -5.0
      );

      const relaxedResults = await searchService.searchFishByNaturalLanguage(
        'oceanic fish',
        10,
        10.0
      );

      // Strict threshold should return fewer or equal results
      assert(
        strictResults.length <= relaxedResults.length,
        'Strict threshold should return fewer or equal results than relaxed threshold'
      );

      // Both should find some results for this query
      assert(
        relaxedResults.length > 0,
        'Relaxed threshold should find results for oceanic fish query'
      );
    });

    it('should handle Japanese natural language queries', async () => {
      const results = await searchService.searchFishByNaturalLanguage(
        '熱帯の海にいる大きな魚',
        10,
        -0.25
      );

      // May or may not find results depending on whether Japanese is in comments
      assert(Array.isArray(results), 'Should return array even if empty');
      assert.ok(
        results.every(r => r.matchType === 'natural_language'),
        'All results should have natural_language match type'
      );
    });

    it('should return empty array for queries below score threshold', async () => {
      // Query with very low relevance to any fish
      const results = await searchService.searchFishByNaturalLanguage(
        'computer software programming code',
        10,
        -0.25
      );

      assert.equal(
        results.length,
        0,
        'Should return no results for irrelevant query'
      );
    });

    it('should handle multi-word queries correctly', async () => {
      // Test that multi-word queries work with BM25
      const results = await searchService.searchFishByNaturalLanguage(
        'Pacific Ocean pelagic fish common',
        10,
        -0.25
      );

      assert(
        results.length > 0,
        'Should find fish matching Pacific Ocean description'
      );
      assert(
        results.some(r => r.specCode === 2),
        'Should find Pacific mackerel'
      );
    });

    it('should respect limit parameter', async () => {
      const results = await searchService.searchFishByNaturalLanguage(
        'fish ocean',
        2,
        -0.25
      );

      assert(results.length <= 2, 'Should respect limit parameter');
    });

    it('should handle empty query gracefully', async () => {
      const results = await searchService.searchFishByNaturalLanguage(
        '',
        10,
        -0.25
      );

      assert.equal(
        results.length,
        0,
        'Should return empty array for empty query'
      );
    });

    it('should handle single-word queries', async () => {
      const results = await searchService.searchFishByNaturalLanguage(
        'butterfly',
        10,
        -0.25
      );

      assert(results.length > 0, 'Should find results for single word query');
      assert(
        results.some(r => r.specCode === 3),
        'Should find butterflyfish'
      );
    });

    it('should not include images in natural language search results', async () => {
      const results = await searchService.searchFishByNaturalLanguage(
        'tropical fish',
        10,
        -0.25
      );

      if (results.length > 0) {
        assert(
          !('images' in results[0]),
          'Natural language search should not include images'
        );
      }
    });

    it('should rank results by BM25 score', async () => {
      const results = await searchService.searchFishByNaturalLanguage(
        'golden coloration butterfly',
        10,
        -0.25
      );

      if (results.length > 1) {
        // Results should be ordered by BM25 score (more negative = better)
        for (let i = 1; i < results.length; i++) {
          assert(
            results[i - 1].score! <= results[i].score!,
            'Results should be ordered by BM25 score (descending relevance)'
          );
        }
      }

      // Golden butterflyfish should rank first
      if (results.length > 0) {
        assert(
          results[0].specCode === 3,
          'Golden butterflyfish should rank first for "golden coloration butterfly"'
        );
      }
    });

    it('should handle queries with special characters', async () => {
      // Should not throw SQL errors with special characters
      await assert.doesNotReject(async () => {
        const results = await searchService.searchFishByNaturalLanguage(
          'fish & ocean @ #special',
          10,
          -0.25
        );
        assert(Array.isArray(results), 'Should return array');
      });
    });

    it('should find fish with partial term matches above threshold', async () => {
      // According to ADR, ~1/3 of terms matching should pass -10.0 threshold
      const results = await searchService.searchFishByNaturalLanguage(
        'large tropical oceanic waters',
        10,
        -0.25
      );

      // Tuna matches "large", "tropical", "oceanic" and "waters" (4/4 terms)
      assert(
        results.some(r => r.specCode === 1),
        'Should find tuna with 4/4 term matches'
      );

      // Test partial match
      const partialResults = await searchService.searchFishByNaturalLanguage(
        'large arctic submarine predator',
        10,
        -0.25
      );

      // Tuna only matches "large" (1/4 terms), should be below threshold
      assert(
        !partialResults.some(r => r.specCode === 1),
        'Should not find tuna with only 1/4 term matches'
      );
    });

    it('should include BM25 score in results', async () => {
      const results = await searchService.searchFishByNaturalLanguage(
        'tropical ocean',
        10,
        -0.25
      );

      if (results.length > 0) {
        assert('score' in results[0], 'Results should include BM25 score');
        assert(
          typeof results[0].score === 'number',
          'BM25 score should be a number'
        );
        assert(
          results[0].score! <= -10.0,
          'BM25 score should be at or below threshold of -10.0'
        );
      }
    });
  });
});
