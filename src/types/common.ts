import { Fish } from './fish.js';

// 対応言語（MVPでは英語と日本語のみ）
export enum Language {
  ENGLISH = 'English',
  JAPANESE = 'Japanese'
}

// 1つの魚に対する1つの言語での1つの一般名
export interface CommonName {
  autoctr: number;        // ユニークID
  comName: string;        // 一般名（例: "Kuromaguro", "Atlantic bluefin tuna"）
  specCode: number;       // 魚のID
  language: Language;     // 言語（英語または日本語のみ）
  preferredName: boolean; // この言語での推奨名かどうか
}

// 1つの魚の英語名と日本語名をまとめたもの
export interface FishWithNames {
  fish: Fish;
  englishNames: CommonName[]; // 英語名（複数の場合あり）
  japaneseNames: CommonName[]; // 日本語名（複数の場合あり）
}

// 検索結果
export interface SearchResult {
  fish: Fish;
  englishNames: CommonName[];
  japaneseNames: CommonName[];
  score?: number;         // 検索スコア（FTS5のrank）
  highlighted?: string;   // ハイライト表示用
}