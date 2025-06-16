/* eslint-disable no-unused-vars */
import { Centimeters, Grams, Meters } from './units.js';

// 魚の生息域（底生性/遊泳性）
export enum HabitatZone {
  DEMERSAL = 'demersal',
  BENTHOPELAGIC = 'benthopelagic',
  REEF_ASSOCIATED = 'reef-associated',
  BATHYDEMERSAL = 'bathydemersal',
  BATHYPELAGIC = 'bathypelagic',
  PELAGIC = 'pelagic',
  PELAGIC_NERITIC = 'pelagic-neritic',
  PELAGIC_OCEANIC = 'pelagic-oceanic',
  UNKNOWN = 'unknown',
}

// 危険性（注意: 生データには大文字小文字の不整合があるため、変換時に正規化する）
export enum DangerLevel {
  HARMLESS = 'harmless',
  VENOMOUS = 'venomous',
  TRAUMATOGENIC = 'traumatogenic',
  CIGUATERA = 'reports of ciguatera poisoning',
  POTENTIAL_PEST = 'potential pest',
  POISONOUS_TO_EAT = 'poisonous to eat',
  OTHER = 'other',
}

// 商業的価値
export enum CommercialImportance {
  HIGHLY_COMMERCIAL = 'highly commercial',
  COMMERCIAL = 'commercial',
  MINOR_COMMERCIAL = 'minor commercial',
  SUBSISTENCE = 'subsistence fisheries',
  POTENTIAL_INTEREST = 'of potential interest',
  NO_INTEREST = 'of no interest',
  BYCATCH = 'bycatch',
}

// 価格カテゴリ
export enum PriceCategory {
  VERY_HIGH = 'very high',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  UNKNOWN = 'unknown',
}

// 回遊パターン
export enum MigrationPattern {
  NON_MIGRATORY = 'non-migratory',
  OCEANODROMOUS = 'oceanodromous',
  POTAMODROMOUS = 'potamodromous',
  AMPHIDROMOUS = 'amphidromous',
  ANADROMOUS = 'anadromous',
  CATADROMOUS = 'catadromous',
  OCEANO_ESTUARINE = 'oceano-estuarine',
  DIADROMOUS = 'diadromous',
}

// 体型
export enum BodyShape {
  ELONGATED = 'elongated',
  FUSIFORM_NORMAL = 'fusiform / normal',
  SHORT_DEEP = 'short and / or deep',
  EEL_LIKE = 'eel-like',
  OTHER = 'other',
}

// 水族館での扱い
export enum AquariumSuitability {
  NEVER_RARELY = 'never/rarely',
  COMMERCIAL = 'commercial',
  PUBLIC_AQUARIUMS = 'public aquariums',
  HIGHLY_COMMERCIAL = 'highly commercial',
  POTENTIAL = 'potential',
  SHOW_AQUARIUM = 'show aquarium',
}

// 養殖での利用
export enum AquacultureUse {
  NEVER_RARELY = 'never/rarely',
  COMMERCIAL = 'commercial',
  EXPERIMENTAL = 'experimental',
  LIKELY_FUTURE = 'likely future use',
}

// 餌としての利用
export enum BaitUse {
  NEVER_RARELY = 'never/rarely',
  USUALLY = 'usually',
  OCCASIONALLY = 'occasionally',
}

// 電気的能力
export enum ElectricAbility {
  NO_SPECIAL = 'no special ability',
  ELECTROSENSING_ONLY = 'electrosensing only',
  WEAKLY_DISCHARGING = 'weakly discharging',
  STRONGLY_DISCHARGING = 'strongly discharging',
}

// 魚の画像情報
export interface FishImage {
  url: string; // 画像URL
  attribution: string; // 著作権表示
}

export interface Fish {
  specCode: number;
  genus: string;
  species: string;
  scientificName: string; // genus + species
  author?: string;
  fbName?: string; // FishBase英語名
  famCode?: number;
  family?: string;

  // 生息環境
  fresh: boolean; // 淡水
  brackish: boolean; // 汽水
  saltwater: boolean; // 海水
  habitatZone?: HabitatZone; // 主要生息域（底生性/遊泳性）

  // サイズ・重量（実際の範囲: 0.8-1700cm, 0.05g-34000kg）
  length?: Centimeters; // 最大体長
  commonLength?: Centimeters; // 一般的なサイズ
  weight?: Grams; // 最大重量

  // 深度（実際の範囲: 0-8336m）
  depthRangeShallow?: Meters;
  depthRangeDeep?: Meters;

  // 特性
  dangerous?: DangerLevel;
  gamefish: boolean;
  aquarium?: AquariumSuitability;
  aquacultureUse?: AquacultureUse;
  baitUse?: BaitUse;
  importance?: CommercialImportance;
  priceCategory?: PriceCategory;

  // 生物学的特性
  bodyShape?: BodyShape;
  migrationPattern?: MigrationPattern;
  electricAbility?: ElectricAbility;

  // 説明
  comments?: string; // 詳細な説明

  // 画像情報
  images?: FishImage[]; // 画像情報配列（外部API経由で取得）
}
