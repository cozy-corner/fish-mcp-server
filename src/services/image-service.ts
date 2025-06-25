// Using Node.js built-in fetch API (Node 18+)
import type { FishImage } from '../types/fish.js';
import createDebug from 'debug';
import sharp from 'sharp';

const debug = createDebug('fish-mcp:image-service');

interface INaturalistObservation {
  id: number;
  photos: Array<{
    url: string;
    attribution: string;
  }>;
  taxon?: {
    name: string;
    common_name?: {
      name: string;
    };
  };
}

interface INaturalistResponse {
  results: INaturalistObservation[];
  total_results: number;
}

interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export class ImageService {
  private static readonly INATURALIST_API_BASE =
    'https://api.inaturalist.org/v1';
  private static readonly RATE_LIMIT_DELAY_MS = 1000; // 1 request per second
  private static readonly DEFAULT_MAX_WIDTH = 320;
  private static readonly DEFAULT_MAX_HEIGHT = 240;
  private static readonly DEFAULT_JPEG_QUALITY = 60;
  private requestQueue: Promise<unknown> = Promise.resolve();

  /**
   * 魚の学名から画像を取得する（最初の1枚のみ）
   * @param scientificName 魚の学名
   * @param includeBase64 Base64形式で画像を含めるかどうか
   * @returns 画像情報の配列、画像が見つからない場合は空配列
   */
  async getImagesForFish(
    scientificName: string,
    includeBase64: boolean = false
  ): Promise<FishImage[]> {
    debug('Fetching images for scientific name: %s', scientificName);

    // Promise queueを使用して並行リクエストを直列化
    const result = this.requestQueue.then(async (): Promise<FishImage[]> => {
      try {
        // レート制限の実装
        await this.enforceRateLimit();

        // iNaturalist APIで観察記録を検索
        const observations = await this.searchINaturalist(scientificName);

        if (observations.length === 0) {
          debug('No observations found for %s', scientificName);
          return [];
        }

        // 写真がある最初の観察記録から画像を1枚取得
        for (const observation of observations) {
          if (observation.photos && observation.photos.length > 0) {
            const photo = observation.photos[0];
            const imageUrl = this.getHighQualityImageUrl(photo.url);
            debug('Found image for %s: %s', scientificName, imageUrl);

            const fishImage: FishImage = {
              url: imageUrl,
              attribution: photo.attribution || '© Unknown',
            };

            // Base64エンコーディングが必要な場合
            if (includeBase64) {
              try {
                const base64Data = await this.fetchAndEncodeImage(imageUrl);
                if (base64Data) {
                  fishImage.base64 = base64Data.base64;
                  fishImage.mimeType = base64Data.mimeType;
                }
              } catch (error) {
                debug('Failed to encode image to Base64: %O', error);
                // Base64エンコーディングに失敗してもURLは返す
              }
            }

            return [fishImage];
          }
        }

        debug('No photos found in observations for %s', scientificName);
        return [];
      } catch (error) {
        debug('Error fetching images for %s: %O', scientificName, error);
        return [];
      }
    });
    this.requestQueue = result;
    return result;
  }

  /**
   * iNaturalist APIで魚の観察記録を検索
   */
  private async searchINaturalist(
    scientificName: string
  ): Promise<INaturalistObservation[]> {
    const params = new URLSearchParams({
      taxon_name: scientificName,
      photos: 'true', // 写真がある観察記録のみ
      quality_grade: 'research', // 研究品質の観察記録を優先
      per_page: '10', // 最初の10件を取得
      order_by: 'votes', // 評価の高い順
    });

    const url = `${ImageService.INATURALIST_API_BASE}/observations?${params}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `iNaturalist API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as INaturalistResponse;
    return data.results;
  }

  /**
   * iNaturalist画像URLを高品質版に変換
   */
  private getHighQualityImageUrl(url: string): string {
    // より安全なURL変換（サイズ部分を正規表現で置換）
    return url.replace(/(\/)[a-z]+(\.\w+)$/, '$1medium$2');
  }

  /**
   * レート制限を適用（1リクエスト/秒）
   * Promise queueと組み合わせて並行性を制御
   */
  private async enforceRateLimit(): Promise<void> {
    // Promise queueにより既に直列化されているので、固定待機時間を設定
    await new Promise(resolve =>
      setTimeout(resolve, ImageService.RATE_LIMIT_DELAY_MS)
    );
  }

  /**
   * 画像をフェッチしてBase64にエンコード
   * @param imageUrl 画像のURL
   * @param resizeOptions オプショナルなリサイズ設定
   * @returns Base64エンコードされた画像データとMIMEタイプ
   */
  private async fetchAndEncodeImage(
    imageUrl: string,
    resizeOptions?: ImageResizeOptions
  ): Promise<{ base64: string; mimeType: string } | null> {
    try {
      // タイムアウトとサイズ制限の追加
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒のタイムアウト

      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Fish-MCP-Server/1.0' },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      // MIMEタイプの検証
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      // Content-Lengthヘッダーでサイズチェック
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
        // 5MB制限
        throw new Error('Image too large');
      }

      const arrayBuffer = await response.arrayBuffer();
      // ダウンロード後の実際のサイズを再確認
      if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
        throw new Error('Image too large');
      }

      // 画像のリサイズ処理
      const buffer = Buffer.from(arrayBuffer);
      debug('Original image size: %d bytes', buffer.length);
      const resizedBuffer = await this.resizeImage(buffer, resizeOptions);
      debug('Resized image size: %d bytes', resizedBuffer.length);

      const base64 = resizedBuffer.toString('base64');

      return {
        base64: base64,
        mimeType: 'image/jpeg',
      };
    } catch (error) {
      debug('Error fetching/encoding image from %s: %O', imageUrl, error);
      return null;
    }
  }

  /**
   * 画像をリサイズする
   * @param inputBuffer 入力画像のバッファ
   * @param options リサイズオプション
   * @returns リサイズされた画像のバッファ
   */
  private async resizeImage(
    inputBuffer: Buffer,
    options?: ImageResizeOptions
  ): Promise<Buffer> {
    const maxWidth = options?.maxWidth ?? ImageService.DEFAULT_MAX_WIDTH;
    const maxHeight = options?.maxHeight ?? ImageService.DEFAULT_MAX_HEIGHT;
    const quality = options?.quality ?? ImageService.DEFAULT_JPEG_QUALITY;

    try {
      const resizedBuffer = await sharp(inputBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality,
          progressive: false,
          mozjpeg: true,
        })
        .toBuffer();

      debug(
        'Image resized: %dx%d, quality: %d%, size: %d bytes',
        maxWidth,
        maxHeight,
        quality,
        resizedBuffer.length
      );

      return resizedBuffer;
    } catch (error) {
      debug('Error resizing image: %O', error);
      // リサイズに失敗した場合は、JPEGに変換だけ行う
      return sharp(inputBuffer).jpeg({ quality }).toBuffer();
    }
  }
}
