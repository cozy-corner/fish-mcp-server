import { HabitatZone, DangerLevel, CommercialImportance, BodyShape } from './fish.js';
import { Centimeters, Grams, Meters } from './units.js';

// 検索オプション
export interface SearchOptions {
  // 名前検索
  query?: string;
  
  // 特徴検索（型安全な単位）
  minLength?: Centimeters;
  maxLength?: Centimeters;
  minWeight?: Grams;
  maxWeight?: Grams;
  minDepth?: Meters;
  maxDepth?: Meters;
  
  // 環境
  fresh?: boolean;        // 淡水
  saltwater?: boolean;    // 海水
  brackish?: boolean;     // 汽水
  habitatZone?: HabitatZone; // 生息域
  
  // 特性
  dangerous?: boolean;    // 危険な魚のみ
  dangerLevel?: DangerLevel; // 特定の危険レベル
  gamefish?: boolean;     // 釣り対象魚
  aquarium?: boolean;     // 観賞魚向け
  commercial?: boolean;   // 商業価値あり
  importance?: CommercialImportance; // 特定の商業価値
  bodyShape?: BodyShape;  // 体型
  
  // ページング
  limit?: number;         // 取得件数（デフォルト: 10）
  offset?: number;        // オフセット（デフォルト: 0）
}