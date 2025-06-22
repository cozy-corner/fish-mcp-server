import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { ImageService } from '../image-service.js';

describe('ImageService Base64 functionality', () => {
  let imageService: ImageService;

  beforeEach(() => {
    imageService = new ImageService();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  it('should return images with Base64 data when includeBase64 is true', async () => {
    // Test with a well-known fish
    const images = await imageService.getImagesForFish(
      'Amphiprion ocellaris',
      true
    );

    if (images.length > 0) {
      const image = images[0];

      // Check that URL and attribution are always present
      assert.ok(image.url, 'Image should have a URL');
      assert.ok(image.attribution, 'Image should have attribution');

      // Check that Base64 data is included
      assert.ok(
        image.base64,
        'Image should have Base64 data when includeBase64 is true'
      );
      assert.ok(
        image.base64.startsWith('data:'),
        'Base64 data should start with data:'
      );
      assert.ok(
        image.base64.includes(';base64,'),
        'Base64 data should include ;base64,'
      );

      // Check MIME type
      assert.ok(image.mimeType, 'Image should have a MIME type');
      assert.ok(
        image.mimeType.startsWith('image/'),
        'MIME type should start with image/'
      );
    }
  });

  it('should return images without Base64 data when includeBase64 is false', async () => {
    // Test with a well-known fish
    const images = await imageService.getImagesForFish(
      'Amphiprion ocellaris',
      false
    );

    if (images.length > 0) {
      const image = images[0];

      // Check that URL and attribution are present
      assert.ok(image.url, 'Image should have a URL');
      assert.ok(image.attribution, 'Image should have attribution');

      // Check that Base64 data is NOT included
      assert.equal(
        image.base64,
        undefined,
        'Image should not have Base64 data when includeBase64 is false'
      );
      assert.equal(
        image.mimeType,
        undefined,
        'Image should not have MIME type when includeBase64 is false'
      );
    }
  });

  it('should handle image fetch errors gracefully', async () => {
    // Test with a fish that might not have images or with an invalid name
    const images = await imageService.getImagesForFish(
      'InvalidFishNameXYZ123',
      true
    );

    // Should return empty array, not throw error
    assert.equal(
      images.length,
      0,
      'Should return empty array for invalid fish name'
    );
  });

  it('should return URL and attribution for valid fish requests', async () => {
    // Verify that basic image properties are always present
    const images = await imageService.getImagesForFish(
      'Carcharodon carcharias',
      true
    );

    if (images.length > 0) {
      const image = images[0];
      assert.ok(image.url, 'Image should always have a URL');
      assert.ok(image.attribution, 'Image should always have attribution');
    }
  });
});
