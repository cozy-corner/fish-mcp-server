-- Fish MCP Server Database Schema
-- SQLite with FTS5 Virtual Tables for full-text search

-- メインの魚テーブル
CREATE TABLE IF NOT EXISTS fish (
  spec_code INTEGER PRIMARY KEY,
  genus TEXT NOT NULL,
  species TEXT NOT NULL,
  scientific_name TEXT NOT NULL, -- genus + species
  author TEXT,
  fb_name TEXT, -- FishBase英語名
  fam_code INTEGER,
  family TEXT,
  
  -- 生息環境（boolean: 1=true, 0=false）
  fresh INTEGER NOT NULL DEFAULT 0,
  brackish INTEGER NOT NULL DEFAULT 0,
  saltwater INTEGER NOT NULL DEFAULT 0,
  habitat_zone TEXT CHECK (habitat_zone IN (
    'demersal', 'benthopelagic', 'reef-associated', 'bathydemersal',
    'bathypelagic', 'pelagic', 'pelagic-neritic', 'pelagic-oceanic', 'unknown'
  )),
  
  -- サイズ・重量
  length_cm REAL, -- 最大体長(cm)
  common_length_cm REAL, -- 一般的なサイズ(cm)
  weight_g REAL, -- 最大重量(g)
  
  -- 深度
  depth_range_shallow_m REAL,
  depth_range_deep_m REAL,
  
  -- 特性
  dangerous TEXT CHECK (dangerous IN (
    'harmless', 'venomous', 'traumatogenic', 
    'reports of ciguatera poisoning', 'potential pest', 
    'poisonous to eat', 'other'
  )),
  gamefish INTEGER NOT NULL DEFAULT 0,
  aquarium TEXT CHECK (aquarium IN (
    'never/rarely', 'commercial', 'public aquariums', 
    'highly commercial', 'potential', 'show aquarium'
  )),
  aquaculture_use TEXT CHECK (aquaculture_use IN (
    'never/rarely', 'commercial', 'experimental', 'likely future use'
  )),
  bait_use TEXT CHECK (bait_use IN (
    'never/rarely', 'usually', 'occasionally'
  )),
  importance TEXT CHECK (importance IN (
    'highly commercial', 'commercial', 'minor commercial',
    'subsistence fisheries', 'of potential interest', 
    'of no interest', 'bycatch'
  )),
  price_category TEXT CHECK (price_category IN (
    'very high', 'high', 'medium', 'low', 'unknown'
  )),
  
  -- 生物学的特性
  body_shape TEXT CHECK (body_shape IN (
    'elongated', 'fusiform / normal', 'short and / or deep', 
    'eel-like', 'other'
  )),
  migration_pattern TEXT CHECK (migration_pattern IN (
    'non-migratory', 'oceanodromous', 'potamodromous', 
    'amphidromous', 'anadromous', 'catadromous', 
    'oceano-estuarine', 'diadromous'
  )),
  electric_ability TEXT CHECK (electric_ability IN (
    'no special ability', 'electrosensing only', 
    'weakly discharging', 'strongly discharging'
  )),
  
  -- 説明文
  comments TEXT,
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- fishテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_fish_genus_species ON fish(genus, species);
CREATE INDEX IF NOT EXISTS idx_fish_habitat ON fish(habitat_zone);
CREATE INDEX IF NOT EXISTS idx_fish_environment ON fish(fresh, brackish, saltwater);
CREATE INDEX IF NOT EXISTS idx_fish_size ON fish(length_cm, weight_g);
CREATE INDEX IF NOT EXISTS idx_fish_depth ON fish(depth_range_shallow_m, depth_range_deep_m);
CREATE INDEX IF NOT EXISTS idx_fish_dangerous ON fish(dangerous);

-- 一般名テーブル（日本語・英語のみ）
CREATE TABLE IF NOT EXISTS common_names (
  id INTEGER PRIMARY KEY,
  com_name TEXT NOT NULL,
  spec_code INTEGER NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('English', 'Japanese')),
  preferred_name INTEGER NOT NULL DEFAULT 0, -- boolean
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (spec_code) REFERENCES fish(spec_code),
  UNIQUE(com_name, spec_code, language) -- 重複防止用の一意制約
);

-- common_namesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_common_names_spec_code ON common_names(spec_code);
CREATE INDEX IF NOT EXISTS idx_common_names_language ON common_names(language);
CREATE INDEX IF NOT EXISTS idx_common_names_name ON common_names(com_name);

-- FTS5 Virtual Table: 魚の全文検索（contentless）
-- 日本語と英語での検索を高速化
-- contentlessのため手動でデータ投入が必要
CREATE VIRTUAL TABLE IF NOT EXISTS fish_search USING fts5(
  scientific_name,
  fb_name,
  comments,
  japanese_names,  -- common_namesテーブルから集約
  english_names,   -- common_namesテーブルから集約
  tokenize='unicode61 remove_diacritics 1'  -- 日本語対応tokenizer（SQLite標準）
);

-- FTS5 Virtual Table: 一般名での検索
CREATE VIRTUAL TABLE IF NOT EXISTS name_search USING fts5(
  com_name,
  language,
  content='common_names', 
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 1'  -- 日本語対応tokenizer（SQLite標準）
);