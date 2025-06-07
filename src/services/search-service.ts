import Database from 'better-sqlite3';
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

export interface SearchFeatures {
  minLength?: number;
  maxLength?: number;
  dangerous?: boolean;
  habitatZone?: string;
  environment?: 'fresh' | 'brackish' | 'saltwater';
  gamefish?: boolean;
}

export type FishWithMatch = Fish & { matchType: string; matchedName?: string };

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
  remarks?: string;
  match_type?: string;
  matched_name?: string;
}

interface CommonNameDbRow {
  com_name: string;
  spec_code: number;
  language: string;
  preferred: number;
}

export class SearchService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  searchFishByName(query: string, limit: number = 10): FishWithMatch[] {
    // 1. Japanese name exact match
    let results = this.db
      .prepare(
        `
      SELECT f.*, 'japanese_exact' as match_type, cn.com_name as matched_name
      FROM fish f
      JOIN common_names cn ON f.spec_code = cn.spec_code
      WHERE cn.language = 'Japanese' AND cn.com_name = ?
      ORDER BY cn.preferred_name DESC
      LIMIT ?
    `
      )
      .all(query, limit) as FishDbRow[];

    if (results.length > 0) {
      return this.transformDbRowsToFish(results);
    }

    // 2. Japanese name partial match
    results = this.db
      .prepare(
        `
      SELECT f.*, 'japanese_partial' as match_type, cn.com_name as matched_name
      FROM fish f
      JOIN common_names cn ON f.spec_code = cn.spec_code
      WHERE cn.language = 'Japanese' AND cn.com_name LIKE ?
      ORDER BY cn.preferred_name DESC, cn.com_name
      LIMIT ?
    `
      )
      .all(`%${query}%`, limit) as FishDbRow[];

    if (results.length > 0) {
      return this.transformDbRowsToFish(results);
    }

    // 3. FTS5 search
    results = this.db
      .prepare(
        `
      SELECT f.*, 'fts_search' as match_type, NULL as matched_name
      FROM fish f
      JOIN fish_search fs ON f.spec_code = fs.rowid
      WHERE fish_search MATCH ?
      ORDER BY rank
      LIMIT ?
    `
      )
      .all(query, limit) as FishDbRow[];

    if (results.length > 0) {
      return this.transformDbRowsToFish(results);
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

    return this.transformDbRowsToFish(results);
  }

  searchFishByFeatures(features: SearchFeatures, limit: number = 10): Fish[] {
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
          'dangerous IS NOT NULL AND dangerous != "harmless"'
        );
      } else {
        whereConditions.push('(dangerous IS NULL OR dangerous = "harmless")');
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

    return this.transformDbRowsToFish(results);
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
      preferred: Boolean(row.preferred),
    }));
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
      remarks: row.remarks,
      matchType: row.match_type || 'unknown',
      matchedName: row.matched_name,
    }));
  }
}
