import Database from 'better-sqlite3';
import * as wanakana from 'wanakana';
import {
  Fish,
  HabitatZone,
  DangerLevel,
  CommercialImportance,
  PriceCategory,
  MigrationPattern,
  BodyShape,
  AquariumSuitability,
  AquacultureUse,
  BaitUse,
  ElectricAbility,
} from '../types/fish.js';
import { CommonName } from './data-loader.js';
import { cm, g, m } from '../types/units.js';
import { ImageService } from './image-service.js';
import createDebug from 'debug';

const debug = createDebug('fish-mcp:search-service');

export interface SearchFeatures {
  minLength?: number;
  maxLength?: number;
  dangerous?: boolean;
  habitatZone?: string;
  environment?: 'fresh' | 'brackish' | 'saltwater';
  gamefish?: boolean;
  includeImages?: boolean;
}

export type FishWithMatch = Fish & { matchType: string; matchedName?: string };

/**
 * 検索クエリで受け付け可能な文字種
 * @description 魚名検索で使用できる文字の種類を定義
 */
export type SupportedScript =
  | 'katakana' // カタカナ（例: マグロ、サバ）
  | 'hiragana' // ひらがな（例: まぐろ、さば）
  | 'romaji' // ローマ字（例: maguro、saba）
  | 'english' // 英語（例: tuna、mackerel）
  | 'latin'; // 学名（例: Thunnus、Scomber）

/**
 * 魚名検索の制限事項と対応状況
 * @description 現在の検索機能の制限を明示
 */
export interface SearchLimitations {
  /** 漢字での検索は制限あり（例: 「鮪」「鯖」）- FishBaseデータに漢字が少ないため */
  kanjiSupport: 'limited';
  /** 複合語の検索精度は中程度（Unicode61 tokenizerの制限） */
  compoundWordAccuracy: 'moderate';
  /** 形態素解析は未対応（ICU tokenizerが必要） */
  morphologicalAnalysis: 'unsupported';
}

interface FishDbRow {
  spec_code: number;
  genus: string;
  species: string;
  scientific_name: string;
  author?: string;
  fb_name?: string;
  fam_code?: number;
  family?: string;
  fresh: number;
  brackish: number;
  saltwater: number;
  habitat_zone?: string;
  length_cm?: number;
  common_length_cm?: number;
  weight_g?: number;
  depth_range_shallow_m?: number;
  depth_range_deep_m?: number;
  dangerous?: string;
  gamefish: number;
  aquarium?: string;
  aquaculture_use?: string;
  bait_use?: string;
  importance?: string;
  price_category?: string;
  body_shape?: string;
  migration_pattern?: string;
  electric_ability?: string;
  comments?: string;
  match_type?: string;
  matched_name?: string;
}

interface CommonNameDbRow {
  com_name: string;
  spec_code: number;
  language: string;
  preferred_name: number;
}

export class SearchService {
  private db: Database.Database;
  private imageService: ImageService;

  constructor(db: Database.Database, imageService?: ImageService) {
    this.db = db;
    this.imageService = imageService || new ImageService();
  }

  // カタカナ・ひらがなをローマ字に変換
  private toRomaji(str: string): string {
    const r = wanakana.toRomaji(str, { upcaseKatakana: false }).toLowerCase();
    return r.replace(/ou/g, 'ô').replace(/uu/g, 'û');
  }

  /**
   * 魚名による検索を実行
   *
   * @param query - 検索クエリ（対応文字種: カタカナ、ひらがな、ローマ字、英語、学名）
   * @param limit - 検索結果の最大件数（デフォルト: 10）
   * @param includeImages - 画像情報を含めるかどうか（デフォルト: false）
   * @returns 検索結果の魚の配列
   *
   * @example
   * ```typescript
   * // カタカナ検索
   * const results1 = await searchService.searchFishByName('マグロ');
   *
   * // ひらがな検索
   * const results2 = await searchService.searchFishByName('まぐろ');
   *
   * // ローマ字検索
   * const results3 = await searchService.searchFishByName('maguro');
   *
   * // 英語検索
   * const results4 = await searchService.searchFishByName('tuna');
   *
   * // 画像付き検索
   * const results5 = await searchService.searchFishByName('マグロ', 5, true);
   * ```
   *
   * @remarks
   * ## 対応文字種
   * - **カタカナ**: マグロ、サバ、アジ等
   * - **ひらがな**: まぐろ、さば、あじ等
   * - **ローマ字**: maguro、saba、aji等
   * - **英語**: tuna、mackerel、horse mackerel等
   * - **学名**: Thunnus、Scomber、Trachurus等
   *
   * ## 制限事項
   * - **漢字検索**: 制限あり（鮪、鯖等）- FishBaseデータに漢字表記が少ないため
   * - **複合語**: 検索精度は中程度（Unicode61 tokenizerの制限）
   * - **形態素解析**: 未対応（将来的にICU tokenizerで改善予定）
   *
   * ## 検索戦略
   * 1. 日本語名完全一致（原文＋ローマ字変換）
   * 2. 日本語名部分一致
   * 3. FTS5全文検索
   * 4. 英語名部分一致
   */
  async searchFishByName(
    query: string,
    limit: number = 10,
    includeImages: boolean = false
  ): Promise<FishWithMatch[]> {
    // クエリの前処理
    const romajiQuery = this.toRomaji(query);

    // 1. Japanese name exact match (original and romaji)
    let results = this.db
      .prepare(
        `
      SELECT f.*, 'japanese_exact' as match_type, cn.com_name as matched_name
      FROM fish f
      JOIN common_names cn ON f.spec_code = cn.spec_code
      WHERE cn.language = 'Japanese' AND cn.com_name IN (?, ?)
      ORDER BY cn.preferred_name DESC
      LIMIT ?
    `
      )
      .all(query, romajiQuery, limit) as FishDbRow[];

    if (results.length > 0) {
      return includeImages
        ? this.transformDbRowsToFishWithImages(results)
        : this.transformDbRowsToFish(results);
    }

    // 2. Japanese name partial match (including romaji)
    results = this.db
      .prepare(
        `
      SELECT f.*, 'japanese_partial' as match_type, cn.com_name as matched_name
      FROM fish f
      JOIN common_names cn ON f.spec_code = cn.spec_code
      WHERE cn.language = 'Japanese' AND (
        cn.com_name LIKE ? OR cn.com_name LIKE ?
      )
      ORDER BY cn.preferred_name DESC, cn.com_name
      LIMIT ?
    `
      )
      .all(`%${query}%`, `%${romajiQuery}%`, limit) as FishDbRow[];

    if (results.length > 0) {
      return includeImages
        ? this.transformDbRowsToFishWithImages(results)
        : this.transformDbRowsToFish(results);
    }

    // 3. FTS5 search (try both original and romaji for better results)
    // First try romaji version (for Japanese input)
    results = this.db
      .prepare(
        `
      SELECT f.*, 'fts_search' as match_type, NULL as matched_name
      FROM fish f
      JOIN fish_search fs ON f.spec_code = fs.rowid
      WHERE fish_search MATCH ? -- Note: FTS5 requires table name, not alias 'fs'
      ORDER BY rank
      LIMIT ?
    `
      )
      .all(romajiQuery, limit) as FishDbRow[];

    if (results.length > 0) {
      return includeImages
        ? this.transformDbRowsToFishWithImages(results)
        : this.transformDbRowsToFish(results);
    }

    // Then try original query (for English or already romaji)
    if (query !== romajiQuery) {
      results = this.db
        .prepare(
          `
        SELECT f.*, 'fts_search' as match_type, NULL as matched_name
        FROM fish f
        JOIN fish_search fs ON f.spec_code = fs.rowid
        WHERE fish_search MATCH ? -- Note: FTS5 requires table name, not alias 'fs'
        ORDER BY rank
        LIMIT ?
      `
        )
        .all(query, limit) as FishDbRow[];

      if (results.length > 0) {
        return includeImages
          ? this.transformDbRowsToFishWithImages(results)
          : this.transformDbRowsToFish(results);
      }
    }

    // 4. English name fallback
    results = this.db
      .prepare(
        `
      SELECT f.*, 'english_partial' as match_type, cn.com_name as matched_name
      FROM fish f
      JOIN common_names cn ON f.spec_code = cn.spec_code
      WHERE cn.language = 'English' AND cn.com_name LIKE ?
      ORDER BY cn.preferred_name DESC, cn.com_name
      LIMIT ?
    `
      )
      .all(`%${query}%`, limit) as FishDbRow[];

    return includeImages
      ? this.transformDbRowsToFishWithImages(results)
      : this.transformDbRowsToFish(results);
  }

  async searchFishByFeatures(
    features: SearchFeatures,
    limit: number = 10
  ): Promise<Fish[]> {
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

    if (features.minLength !== undefined) {
      whereConditions.push('length_cm >= ?');
      params.push(features.minLength);
    }

    if (features.maxLength !== undefined) {
      whereConditions.push('length_cm <= ?');
      params.push(features.maxLength);
    }

    if (features.dangerous !== undefined) {
      if (features.dangerous) {
        whereConditions.push(
          "dangerous IS NOT NULL AND dangerous != 'harmless'"
        );
      } else {
        whereConditions.push("(dangerous IS NULL OR dangerous = 'harmless')");
      }
    }

    if (features.habitatZone) {
      whereConditions.push('habitat_zone = ?');
      params.push(features.habitatZone);
    }

    if (features.environment) {
      whereConditions.push(`${features.environment} = 1`);
    }

    if (features.gamefish !== undefined) {
      whereConditions.push('gamefish = ?');
      params.push(features.gamefish ? 1 : 0);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    const results = this.db
      .prepare(
        `
      SELECT * FROM fish ${whereClause}
      ORDER BY length_cm DESC
      LIMIT ?
    `
      )
      .all(...params, limit) as FishDbRow[];

    return features.includeImages
      ? this.transformDbRowsToFishWithImages(results)
      : this.transformDbRowsToFish(results);
  }

  getFishBySpecCode(specCode: number): Fish | null {
    const result = this.db
      .prepare('SELECT * FROM fish WHERE spec_code = ?')
      .get(specCode) as FishDbRow | undefined;
    return result ? this.transformDbRowsToFish([result])[0] : null;
  }

  getCommonNamesForFish(specCode: number): CommonName[] {
    const results = this.db
      .prepare(
        `
      SELECT com_name, spec_code, language, preferred_name as preferred
      FROM common_names 
      WHERE spec_code = ?
      ORDER BY language, preferred_name DESC, com_name
    `
      )
      .all(specCode) as CommonNameDbRow[];

    return results.map(row => ({
      comName: row.com_name,
      specCode: row.spec_code,
      language: row.language,
      preferred: Boolean(row.preferred_name),
    }));
  }

  private async transformDbRowsToFishWithImages(
    rows: FishDbRow[]
  ): Promise<FishWithMatch[]> {
    const fishList = this.transformDbRowsToFish(rows);

    // 各魚の画像を並行して取得
    const fishWithImages = await Promise.all(
      fishList.map(async fish => {
        try {
          const images = await this.imageService.getImagesForFish(
            fish.scientificName
          );
          return { ...fish, images };
        } catch (error) {
          debug(
            'Failed to fetch images for %s: %O',
            fish.scientificName,
            error
          );
          return { ...fish, images: [] };
        }
      })
    );

    return fishWithImages;
  }

  private transformDbRowsToFish(rows: FishDbRow[]): FishWithMatch[] {
    return rows.map(row => ({
      specCode: row.spec_code,
      genus: row.genus,
      species: row.species,
      scientificName: row.scientific_name,
      author: row.author,
      fbName: row.fb_name,
      famCode: row.fam_code,
      family: row.family,
      fresh: Boolean(row.fresh),
      brackish: Boolean(row.brackish),
      saltwater: Boolean(row.saltwater),
      habitatZone: row.habitat_zone as HabitatZone | undefined,
      length: row.length_cm ? cm(row.length_cm) : undefined,
      commonLength: row.common_length_cm ? cm(row.common_length_cm) : undefined,
      weight: row.weight_g ? g(row.weight_g) : undefined,
      depthRangeShallow: row.depth_range_shallow_m
        ? m(row.depth_range_shallow_m)
        : undefined,
      depthRangeDeep: row.depth_range_deep_m
        ? m(row.depth_range_deep_m)
        : undefined,
      dangerous: row.dangerous as DangerLevel | undefined,
      gamefish: Boolean(row.gamefish),
      aquarium: row.aquarium as AquariumSuitability | undefined,
      aquacultureUse: row.aquaculture_use as AquacultureUse | undefined,
      baitUse: row.bait_use as BaitUse | undefined,
      importance: row.importance as CommercialImportance | undefined,
      priceCategory: row.price_category as PriceCategory | undefined,
      bodyShape: row.body_shape as BodyShape | undefined,
      migrationPattern: row.migration_pattern as MigrationPattern | undefined,
      electricAbility: row.electric_ability as ElectricAbility | undefined,
      comments: row.comments,
      matchType: row.match_type || 'unknown',
      matchedName: row.matched_name,
    }));
  }
}
