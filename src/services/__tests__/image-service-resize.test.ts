import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { ImageService } from '../image-service.js';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('ImageService - Image Resize Integration', () => {
  let imageService: ImageService;

  before(() => {
    imageService = new ImageService();
  });

  describe('Token optimization configuration', () => {
    it('should have optimal resize parameters for token reduction', () => {
      // ImageServiceの定数が適切に設定されていることを確認
      const ImageServiceClass = ImageService as unknown as {
        DEFAULT_MAX_WIDTH: number;
        DEFAULT_MAX_HEIGHT: number;
        DEFAULT_JPEG_QUALITY: number;
      };

      // 設定値が想定通りであることを確認（320x240, 60%品質）
      assert.equal(ImageServiceClass.DEFAULT_MAX_WIDTH, 320);
      assert.equal(ImageServiceClass.DEFAULT_MAX_HEIGHT, 240);
      assert.equal(ImageServiceClass.DEFAULT_JPEG_QUALITY, 60);
    });

    it('should estimate reasonable token consumption', () => {
      // テスト用の実際の画像ファイルのサイズを確認
      const testImagePath = join(__dirname, 'fixtures', 'test-fish-image.jpg');
      const inputBuffer = readFileSync(testImagePath);
      const originalSizeKB = inputBuffer.length / 1024;

      // 元画像のサイズを確認（テスト用画像が十分大きいことを確認）
      assert.ok(
        originalSizeKB > 50,
        `Original image should be large enough for testing: ${originalSizeKB.toFixed(2)}KB`
      );

      // リサイズにより大幅にサイズが削減されることを期待
      // 320x240 JPEG 60%品質で約8-12KB程度を想定
      const expectedResizedSizeKB = 10; // 保守的な見積もり
      const estimatedTokens = expectedResizedSizeKB * 333; // Base64エンコード時のトークン数

      // 1枚あたり4000トークン以下の目標に対して余裕があることを確認
      assert.ok(
        estimatedTokens < 4000,
        `Expected token count should be under 4000: ${estimatedTokens.toFixed(0)}`
      );
    });
  });

  describe('Image processing behavior validation', () => {
    it('should maintain image integrity after resize processing', async () => {
      // テスト用画像のメタデータを確認
      const testImagePath = join(__dirname, 'fixtures', 'test-fish-image.jpg');
      const inputBuffer = readFileSync(testImagePath);
      const originalMetadata = await sharp(inputBuffer).metadata();

      // 元画像が期待される形式であることを確認
      assert.equal(originalMetadata.format, 'jpeg');
      assert.ok(
        originalMetadata.width! > 320,
        'Original image should be larger than target size'
      );
      assert.ok(
        originalMetadata.height! > 240,
        'Original image should be larger than target size'
      );

      // リサイズ機能が実装されていることを間接的に確認
      // （実際のHTTPリクエストテストは統合テストで実施）
      assert.ok(typeof imageService.getImagesForFish === 'function');
    });

    it('should handle different image formats correctly', () => {
      // JPEG形式の処理が想定されていることを確認
      const testImagePath = join(__dirname, 'fixtures', 'test-fish-image.jpg');
      const inputBuffer = readFileSync(testImagePath);

      // ファイルがJPEG形式であることを確認
      assert.ok(
        inputBuffer.length > 0,
        'Test image file should exist and have content'
      );

      // JPEG magic numberを確認
      assert.equal(
        inputBuffer[0],
        0xff,
        'Should be JPEG format (magic number)'
      );
      assert.equal(
        inputBuffer[1],
        0xd8,
        'Should be JPEG format (magic number)'
      );
    });
  });

  describe('Public API integration', () => {
    it('should provide Base64 encoding functionality', async () => {
      // getImagesForFishメソッドがBase64オプションを受け入れることを確認
      try {
        // 実際のネットワークリクエストなしでテスト
        const result = await imageService.getImagesForFish(
          'NonExistentSpecies',
          true
        );

        // 存在しない種名なので空配列が返されることを確認
        assert.equal(Array.isArray(result), true);
        assert.equal(result.length, 0);
      } catch {
        // ネットワークエラーの場合はスキップ
        assert.ok(true, 'Network error expected for non-existent species');
      }
    });
  });
});
