#!/usr/bin/env tsx

import { DatabaseManager } from '../src/database/db-manager.js';
import { DataImporter } from '../src/database/data-importer.js';
import { Fish } from '../src/types/fish.js';
import { CommonName, Language } from '../src/types/common.js';
import { cm, g, m } from '../src/types/units.js';
import { 
  DangerLevel, 
  HabitatZone, 
  CommercialImportance,
  AquariumSuitability,
  BodyShape
} from '../src/types/fish.js';

async function loadSampleData() {
  console.log('🐟 Loading Sample Data for Testing');
  console.log('==================================\n');

  const dbManager = new DatabaseManager('fish.db');
  const dataImporter = new DataImporter(dbManager.getDatabase());

  try {
    // データベース初期化
    console.log('📊 Initializing database...');
    dbManager.initialize();

    // サンプル魚データ
    const sampleFish: Fish[] = [
      {
        specCode: 1,
        genus: 'Thunnus',
        species: 'thynnus',
        scientificName: 'Thunnus thynnus',
        author: 'Linnaeus, 1758',
        fbName: 'Atlantic bluefin tuna',
        family: 'Scombridae',
        fresh: false,
        brackish: false,
        saltwater: true,
        habitatZone: HabitatZone.PELAGIC_OCEANIC,
        length: cm(300),
        commonLength: cm(200),
        weight: g(680000),
        depthRangeShallow: m(0),
        depthRangeDeep: m(1000),
        dangerous: DangerLevel.HARMLESS,
        gamefish: true,
        aquarium: AquariumSuitability.NEVER,
        importance: CommercialImportance.HIGHLY_COMMERCIAL,
        bodyShape: BodyShape.FUSIFORM,
        comments: '大型の回遊魚で、高速で泳ぐ。商業的に重要な魚種。',
        remarks: '危険性は低いが、大きな個体は注意が必要。',
      },
      {
        specCode: 2,
        genus: 'Carcharodon',
        species: 'carcharias',
        scientificName: 'Carcharodon carcharias',
        author: 'Linnaeus, 1758',
        fbName: 'Great white shark',
        family: 'Lamnidae',
        fresh: false,
        brackish: false,
        saltwater: true,
        habitatZone: HabitatZone.PELAGIC_OCEANIC,
        length: cm(600),
        commonLength: cm(400),
        weight: g(2000000),
        depthRangeShallow: m(0),
        depthRangeDeep: m(1200),
        dangerous: DangerLevel.TRAUMATOGENIC,
        gamefish: true,
        aquarium: AquariumSuitability.NEVER,
        importance: CommercialImportance.MINOR_COMMERCIAL,
        bodyShape: BodyShape.FUSIFORM,
        comments: '大型の肉食性サメ。非常に危険。',
        remarks: '深海から浅海まで広く分布。攻撃的で危険な魚。',
      },
      {
        specCode: 3,
        genus: 'Sebastes',
        species: 'marinus',
        scientificName: 'Sebastes marinus',
        author: 'Linnaeus, 1758',
        fbName: 'Golden redfish',
        family: 'Sebastidae',
        fresh: false,
        brackish: false,
        saltwater: true,
        habitatZone: HabitatZone.BATHYDEMERSAL,
        length: cm(100),
        commonLength: cm(45),
        weight: g(15000),
        depthRangeShallow: m(100),
        depthRangeDeep: m(1000),
        dangerous: DangerLevel.TRAUMATOGENIC,
        gamefish: true,
        aquarium: AquariumSuitability.NO,
        importance: CommercialImportance.COMMERCIAL,
        comments: '深海魚の一種。美しい赤色。',
        remarks: '深海に生息する。毒はないが棘に注意。',
      },
      {
        specCode: 4,
        genus: 'Tetraodon',
        species: 'nigroviridis',
        scientificName: 'Tetraodon nigroviridis',
        author: 'Marion de Procé, 1822',
        fbName: 'Green pufferfish',
        family: 'Tetraodontidae',
        fresh: true,
        brackish: true,
        saltwater: false,
        habitatZone: HabitatZone.DEMERSAL,
        length: cm(17),
        commonLength: cm(12),
        weight: g(100),
        depthRangeShallow: m(0),
        depthRangeDeep: m(10),
        dangerous: DangerLevel.POISONOUS_TO_EAT,
        gamefish: false,
        aquarium: AquariumSuitability.YES,
        importance: CommercialImportance.NO_INTEREST,
        comments: '小型のフグ。体に毒を持つ。',
        remarks: '観賞魚として人気があるが、取り扱いに注意が必要。',
      },
    ];

    // サンプル一般名データ
    const sampleCommonNames: CommonName[] = [
      // マグロ
      { autoctr: 1, comName: 'マグロ', specCode: 1, language: Language.JAPANESE, preferredName: true },
      { autoctr: 2, comName: 'まぐろ', specCode: 1, language: Language.JAPANESE, preferredName: false },
      { autoctr: 3, comName: '鮪', specCode: 1, language: Language.JAPANESE, preferredName: false },
      { autoctr: 4, comName: 'クロマグロ', specCode: 1, language: Language.JAPANESE, preferredName: false },
      { autoctr: 5, comName: 'Bluefin tuna', specCode: 1, language: Language.ENGLISH, preferredName: true },
      
      // サメ
      { autoctr: 6, comName: 'ホオジロザメ', specCode: 2, language: Language.JAPANESE, preferredName: true },
      { autoctr: 7, comName: 'ほおじろざめ', specCode: 2, language: Language.JAPANESE, preferredName: false },
      { autoctr: 8, comName: '大白鮫', specCode: 2, language: Language.JAPANESE, preferredName: false },
      { autoctr: 9, comName: 'White shark', specCode: 2, language: Language.ENGLISH, preferredName: true },
      
      // アカウオ
      { autoctr: 10, comName: 'アカウオ', specCode: 3, language: Language.JAPANESE, preferredName: true },
      { autoctr: 11, comName: 'あかうお', specCode: 3, language: Language.JAPANESE, preferredName: false },
      { autoctr: 12, comName: 'Redfish', specCode: 3, language: Language.ENGLISH, preferredName: true },
      
      // フグ
      { autoctr: 13, comName: 'ミドリフグ', specCode: 4, language: Language.JAPANESE, preferredName: true },
      { autoctr: 14, comName: 'みどりふぐ', specCode: 4, language: Language.JAPANESE, preferredName: false },
      { autoctr: 15, comName: 'Green puffer', specCode: 4, language: Language.ENGLISH, preferredName: true },
    ];

    // データ挿入
    console.log('💾 Inserting sample data...');
    dataImporter.insertFish(sampleFish);
    dataImporter.insertCommonNames(sampleCommonNames);

    // FTSインデックス構築
    console.log('🔍 Building full-text search indexes...');
    dataImporter.buildFTSIndex();

    // データベース最適化
    console.log('⚙️  Optimizing database...');
    dbManager.optimizeDatabase();

    // 統計情報表示
    const stats = dbManager.getStats();
    console.log('\n📊 Database Statistics:');
    console.log(`  - Total fish species: ${stats.fishCount}`);
    console.log(`  - Total common names: ${stats.commonNameCount}`);
    console.log(`  - Japanese names: ${stats.japaneseNameCount}`);
    console.log(`  - English names: ${stats.englishNameCount}`);

    console.log('\n✅ Sample data loaded successfully!');
  } catch (error) {
    console.error('\n❌ Error loading sample data:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

// 実行
loadSampleData().catch(console.error);