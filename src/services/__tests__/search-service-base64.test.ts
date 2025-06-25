import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { SearchService } from '../search-service.js';
import { DatabaseManager } from '../../database/db-manager.js';
import { getDbPath } from '../../utils/paths.js';

describe('SearchService Base64 functionality', () => {
  let db: Database.Database;
  let searchService: SearchService;

  before(() => {
    const dbPath = getDbPath(import.meta.url);
    const dbManager = new DatabaseManager(dbPath);
    dbManager.initialize();
    db = dbManager.getDatabase();
    searchService = new SearchService(db);
  });

  after(() => {
    db.close();
  });

  it('should include Base64 images when includeImageContent is true', async () => {
    const results = await searchService.searchFishByName(
      'tuna',
      3,
      false,
      true
    );

    if (
      results.length > 0 &&
      results[0].images &&
      results[0].images.length > 0
    ) {
      const image = results[0].images[0];

      // Check that Base64 data is included
      assert.ok(
        image.base64,
        'Image should have Base64 data when includeImageContent is true'
      );
      assert.ok(
        !image.base64.startsWith('data:'),
        'Base64 data should not include data: prefix'
      );
      assert.ok(image.mimeType, 'Image should have MIME type');

      // URL should still be present
      assert.ok(image.url, 'Image should still have URL');
    }
  });

  it('should include URL images when only includeImages is true', async () => {
    const results = await searchService.searchFishByName(
      'salmon',
      3,
      true,
      false
    );

    if (
      results.length > 0 &&
      results[0].images &&
      results[0].images.length > 0
    ) {
      const image = results[0].images[0];

      // Check that Base64 data is NOT included
      assert.equal(
        image.base64,
        undefined,
        'Image should not have Base64 data when includeImageContent is false'
      );
      assert.equal(
        image.mimeType,
        undefined,
        'Image should not have MIME type when includeImageContent is false'
      );

      // URL should be present
      assert.ok(image.url, 'Image should have URL');
      assert.ok(image.attribution, 'Image should have attribution');
    }
  });

  it('should include both URL and Base64 when both flags are true', async () => {
    const results = await searchService.searchFishByName(
      'shark',
      3,
      true,
      true
    );

    if (
      results.length > 0 &&
      results[0].images &&
      results[0].images.length > 0
    ) {
      const image = results[0].images[0];

      // Check that both URL and Base64 are included
      assert.ok(image.url, 'Image should have URL');
      assert.ok(image.base64, 'Image should have Base64 data');
      assert.ok(image.mimeType, 'Image should have MIME type');
      assert.ok(image.attribution, 'Image should have attribution');
    }
  });

  it('should not include images when both flags are false', async () => {
    const results = await searchService.searchFishByName(
      'bass',
      3,
      false,
      false
    );

    if (results.length > 0) {
      // Images should not be included
      assert.equal(
        results[0].images,
        undefined,
        'Images should not be included when both flags are false'
      );
    }
  });

  it('should handle Base64 in searchFishByFeatures', async () => {
    const results = await searchService.searchFishByFeatures(
      {
        minLength: 50,
        maxLength: 100,
        includeImages: false,
        includeImageContent: true,
      },
      3
    );

    if (
      results.length > 0 &&
      results[0].images &&
      results[0].images.length > 0
    ) {
      const image = results[0].images[0];

      // Check that Base64 data is included
      assert.ok(
        image.base64,
        'Image should have Base64 data when includeImageContent is true'
      );
      assert.ok(image.url, 'Image should still have URL');
    }
  });
});
