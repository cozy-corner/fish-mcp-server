import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { SearchService } from '../search-service.js';
import { DatabaseManager } from '../../database/db-manager.js';
import { DataImporter } from '../../database/data-importer.js';
import { Fish } from '../../types/fish.js';

describe('SearchService - Natural Language Search', () => {
  let db: Database.Database;
  let searchService: SearchService;
  let dbManager: DatabaseManager;

  before(() => {
    // In-memory database for testing
    dbManager = new DatabaseManager(':memory:');
    dbManager.initialize();
    db = dbManager.getDatabase();
    searchService = new SearchService(db);

    // Setup test data
    const dataImporter = new DataImporter(db);

    // Insert test fish data with comments
    const testFish: Fish[] = [
      {
        specCode: 1,
        genus: 'Carcharodon',
        species: 'carcharias',
        scientificName: 'Carcharodon carcharias',
        fbName: 'Great white shark',
        fresh: false,
        brackish: false,
        saltwater: true,
        gamefish: true,
        comments: 'A large predatory shark found in coastal waters. Known for its size and power. Dangerous to humans.',
      },
      {
        specCode: 2,
        genus: 'Amphiprion',
        species: 'ocellaris',
        scientificName: 'Amphiprion ocellaris',
        fbName: 'False clownfish',
        fresh: false,
        brackish: false,
        saltwater: true,
        gamefish: false,
        comments: 'Popular aquarium fish living in coral reefs with sea anemones. Bright orange color with white stripes.',
      },
      {
        specCode: 3,
        genus: 'Melanocetus',
        species: 'johnsonii',
        scientificName: 'Melanocetus johnsonii',
        fbName: 'Humpback anglerfish',
        fresh: false,
        brackish: false,
        saltwater: true,
        gamefish: false,
        comments: 'Deep sea fish with bioluminescent lure. Lives in complete darkness at depths over 1000 meters.',
      },
      {
        specCode: 4,
        genus: 'Thunnus',
        species: 'thynnus',
        scientificName: 'Thunnus thynnus',
        fbName: 'Atlantic bluefin tuna',
        fresh: false,
        brackish: false,
        saltwater: true,
        gamefish: true,
        comments: 'Highly prized commercial fish. Fast swimming pelagic species. Important for sushi and sashimi.',
      },
      {
        specCode: 5,
        genus: 'Salmo',
        species: 'salar',
        scientificName: 'Salmo salar',
        fbName: 'Atlantic salmon',
        fresh: true,
        brackish: true,
        saltwater: true,
        gamefish: true,
        comments: 'Anadromous fish migrating between fresh and salt water. Important commercial aquaculture species.',
      },
    ];

    // Import the test data
    dataImporter.insertFish(testFish);

    // Build FTS index using DataImporter
    dataImporter.buildFTSIndex();
  });

  after(() => {
    dbManager.close();
  });

  describe('searchFishByNaturalLanguage', () => {
    it('should find fish by habitat description', async () => {
      const results = await searchService.searchFishByNaturalLanguage('deep sea');
      assert.equal(results.length, 1);
      assert.equal(results[0].scientificName, 'Melanocetus johnsonii');
    });

    it('should find dangerous fish', async () => {
      const results = await searchService.searchFishByNaturalLanguage('dangerous');
      assert.equal(results.length, 1);
      assert.equal(results[0].scientificName, 'Carcharodon carcharias');
    });

    it('should find fish by use case', async () => {
      const results = await searchService.searchFishByNaturalLanguage('commercial aquaculture');
      assert.equal(results.length, 1);
      assert.equal(results[0].scientificName, 'Salmo salar');
    });

    it('should find fish by color description', async () => {
      const results = await searchService.searchFishByNaturalLanguage('orange color');
      assert.equal(results.length, 1);
      assert.equal(results[0].scientificName, 'Amphiprion ocellaris');
    });

    it('should find fish by food use', async () => {
      const results = await searchService.searchFishByNaturalLanguage('sushi sashimi');
      assert.equal(results.length, 1);
      assert.equal(results[0].scientificName, 'Thunnus thynnus');
    });

    it('should support AND queries', async () => {
      const results = await searchService.searchFishByNaturalLanguage('coral reefs');
      assert.equal(results.length, 1);
      assert.equal(results[0].scientificName, 'Amphiprion ocellaris');
    });

    it('should support OR queries', async () => {
      const results = await searchService.searchFishByNaturalLanguage('shark OR tuna');
      assert.equal(results.length, 2);
      const species = results.map(f => f.scientificName).sort();
      assert.deepEqual(species, ['Carcharodon carcharias', 'Thunnus thynnus']);
    });

    it('should handle complex queries', async () => {
      const results = await searchService.searchFishByNaturalLanguage('predatory coastal waters');
      assert.equal(results.length, 1);
      assert.equal(results[0].scientificName, 'Carcharodon carcharias');
    });

    it('should return empty array for no matches', async () => {
      const results = await searchService.searchFishByNaturalLanguage('tropical freshwater cichlid');
      assert.equal(results.length, 0);
    });

    it('should handle empty query', async () => {
      const results = await searchService.searchFishByNaturalLanguage('');
      assert.equal(results.length, 0);
    });

    it('should respect limit parameter', async () => {
      const results = await searchService.searchFishByNaturalLanguage('fish', 2);
      assert.equal(results.length, 2);
    });

    it('should include snippet in matchedName', async () => {
      const results = await searchService.searchFishByNaturalLanguage('bioluminescent');
      assert.equal(results.length, 1);
      assert(results[0].matchedName?.includes('bioluminescent'));
    });
  });
});