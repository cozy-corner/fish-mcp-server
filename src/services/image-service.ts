// Using Node.js built-in fetch API (Node 18+)
import type { FishImage } from '../types/fish.js';

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

export class ImageService {
  private static readonly INATURALIST_API_BASE =
    'https://api.inaturalist.org/v1';
  private static readonly RATE_LIMIT_DELAY_MS = 1000; // 1 request per second
  private lastRequestTime = 0;

  /**
   * 魚の学名から画像を取得する（最初の1枚のみ）
   * @param scientificName 魚の学名
   * @returns 画像情報の配列、画像が見つからない場合は空配列
   */
  async getImagesForFish(scientificName: string): Promise<FishImage[]> {
    try {
      // レート制限の実装
      await this.enforceRateLimit();

      // iNaturalist APIで観察記録を検索
      const observations = await this.searchINaturalist(scientificName);

      if (observations.length === 0) {
        console.log(`No observations found for ${scientificName}`);
        return [];
      }

      // 写真がある最初の観察記録から画像を1枚取得
      for (const observation of observations) {
        if (observation.photos && observation.photos.length > 0) {
          const photo = observation.photos[0];
          return [
            {
              url: this.getHighQualityImageUrl(photo.url),
              attribution: photo.attribution || '© Unknown',
            },
          ];
        }
      }

      console.log(`No photos found in observations for ${scientificName}`);
      return [];
    } catch (error) {
      console.error(`Error fetching image for ${scientificName}:`, error);
      return [];
    }
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
    console.log(`Fetching from iNaturalist: ${url}`);

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
    // iNaturalistのURLパターン: square.jpg → medium.jpg or large.jpg
    return url.replace('/square.', '/medium.');
  }

  /**
   * レート制限を適用（1リクエスト/秒）
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < ImageService.RATE_LIMIT_DELAY_MS) {
      const waitTime = ImageService.RATE_LIMIT_DELAY_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }
}
