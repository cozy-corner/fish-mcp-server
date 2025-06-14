import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseManager } from '../../database/db-manager.js';
import { SearchService } from '../search-service.js';
import { getDbPath } from '../../utils/paths.js';

describe('SearchService - dangerous parameter bug fix', () => {
  let dbManager: DatabaseManager;
  let searchService: SearchService;

  before(() => {
    const dbPath = getDbPath(import.meta.url);
    dbManager = new DatabaseManager(dbPath);
    dbManager.initialize();
    searchService = new SearchService(dbManager.getDatabase());
  });

  after(() => {
    dbManager.close();
  });

  describe('dangerous parameter search', () => {
    it('should search for dangerous fish without SQL syntax error', async () => {
      // Act
      const results = await searchService.searchFishByFeatures(
        {
          dangerous: true,
        },
        5
      );

      // Assert
      assert(Array.isArray(results), 'Results should be an array');
      assert(results.length <= 5, 'Should respect limit parameter');

      // Verify that returned fish are actually dangerous (not harmless)
      const dangerousFish = results.filter(
        fish => fish.dangerous && fish.dangerous !== 'harmless'
      );
      assert(
        dangerousFish.length > 0,
        'Should return fish with dangerous status'
      );
    });

    it('should search for safe fish without SQL syntax error', async () => {
      // Act
      const results = await searchService.searchFishByFeatures(
        {
          dangerous: false,
        },
        5
      );

      // Assert
      assert(Array.isArray(results), 'Results should be an array');
      assert(results.length <= 5, 'Should respect limit parameter');

      // Verify that returned fish are safe (harmless or no danger info)
      const unsafeFish = results.filter(
        fish => fish.dangerous && fish.dangerous !== 'harmless'
      );
      assert.equal(unsafeFish.length, 0, 'Should not return dangerous fish');
    });

    it('should handle combined search with dangerous and size parameters', async () => {
      // Act
      const results = await searchService.searchFishByFeatures(
        {
          dangerous: true,
          minLength: 100,
        },
        5
      );

      // Assert
      assert(Array.isArray(results), 'Results should be an array');

      // Verify all fish meet both criteria
      results.forEach(fish => {
        assert(
          fish.dangerous && fish.dangerous !== 'harmless',
          'Fish should be dangerous'
        );
        assert(
          fish.length && fish.length >= 100,
          'Fish should be at least 100cm'
        );
      });
    });
  });

  describe('SQL query validation', () => {
    it('should execute dangerous fish count query with correct syntax', () => {
      const db = dbManager.getDatabase();

      // This query previously failed with: no such column: "harmless"
      const query =
        "SELECT COUNT(*) as count FROM fish WHERE dangerous IS NOT NULL AND dangerous != 'harmless'";

      // Act & Assert - should not throw
      assert.doesNotThrow(() => {
        const result = db.prepare(query).get() as { count: number };
        assert(
          typeof result.count === 'number',
          'Should return a numeric count'
        );
        assert(result.count >= 0, 'Count should be non-negative');
      }, 'Query should execute without syntax error');
    });

    it('should execute safe fish count query with correct syntax', () => {
      const db = dbManager.getDatabase();

      // This query previously failed with: no such column: "harmless"
      const query =
        "SELECT COUNT(*) as count FROM fish WHERE (dangerous IS NULL OR dangerous = 'harmless')";

      // Act & Assert - should not throw
      assert.doesNotThrow(() => {
        const result = db.prepare(query).get() as { count: number };
        assert(
          typeof result.count === 'number',
          'Should return a numeric count'
        );
        assert(result.count >= 0, 'Count should be non-negative');
      }, 'Query should execute without syntax error');
    });

    it('should maintain data integrity between dangerous and safe fish counts', () => {
      const db = dbManager.getDatabase();

      // Get counts
      const dangerousCount = db
        .prepare(
          "SELECT COUNT(*) as count FROM fish WHERE dangerous IS NOT NULL AND dangerous != 'harmless'"
        )
        .get() as { count: number };

      const safeCount = db
        .prepare(
          "SELECT COUNT(*) as count FROM fish WHERE (dangerous IS NULL OR dangerous = 'harmless')"
        )
        .get() as { count: number };

      const totalCount = db
        .prepare('SELECT COUNT(*) as count FROM fish')
        .get() as { count: number };

      // Assert
      assert.equal(
        dangerousCount.count + safeCount.count,
        totalCount.count,
        'Sum of dangerous and safe fish should equal total fish count'
      );
    });
  });

  describe('dangerous value validation', () => {
    it('should only return valid dangerous values from database', () => {
      const db = dbManager.getDatabase();

      const validDangerousValues = [
        'harmless',
        'venomous',
        'traumatogenic',
        'reports of ciguatera poisoning',
        'potential pest',
        'poisonous to eat',
        'other',
      ];

      const dangerousValues = db
        .prepare(
          'SELECT DISTINCT dangerous FROM fish WHERE dangerous IS NOT NULL'
        )
        .all() as { dangerous: string }[];

      dangerousValues.forEach(row => {
        assert(
          validDangerousValues.includes(row.dangerous),
          `Invalid dangerous value found: ${row.dangerous}`
        );
      });
    });
  });
});
