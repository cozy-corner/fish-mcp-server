#!/usr/bin/env tsx

import { DatabaseManager } from '../src/database/db-manager.js';
import { DataImporter } from '../src/database/data-importer.js';
import { FishBaseDataLoader } from '../src/services/data-loader.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

async function loadData() {
  console.log('🐟 Fish MCP Server - Data Loading Script');
  console.log('========================================\n');

  // Get the project root directory from the current module's location
  const currentFileUrl = import.meta.url;
  const currentFilePath = fileURLToPath(currentFileUrl);
  const currentDir = dirname(currentFilePath);
  // Navigate from scripts/ to project root
  const projectRoot = resolve(currentDir, '../');
  const dbPath = resolve(projectRoot, 'fish.db');

  const dbManager = new DatabaseManager(dbPath);
  const dataImporter = new DataImporter(dbManager.getDatabase());
  const dataLoader = new FishBaseDataLoader();

  try {
    // データベース初期化
    console.log('📊 Initializing database...');
    dbManager.initialize();

    // データ読み込み
    console.log('📥 Loading fish data from FishBase...');
    const { species, commonNames } = await dataLoader.loadAllFishData();
    
    console.log(`✅ Loaded ${species.length} fish species`);
    console.log(`✅ Loaded ${commonNames.length} common names`);

    // データ挿入
    console.log('\n💾 Inserting data into database...');
    dataImporter.insertFish(species);
    dataImporter.insertCommonNames(commonNames);

    // FTSインデックス構築
    console.log('🔍 Building full-text search indexes...');
    dataImporter.buildFTSIndex();

    // データベース最適化
    console.log('⚙️  Optimizing database...');
    dbManager.optimizeDatabase();

    // 統計情報表示
    const stats = dbManager.getStats();
    console.log('\n📊 Final Database Statistics:');
    console.log(`  - Total fish species: ${stats.fishCount}`);
    console.log(`  - Total common names: ${stats.commonNameCount}`);
    console.log(`  - Japanese names: ${stats.japaneseNameCount}`);
    console.log(`  - English names: ${stats.englishNameCount}`);

    console.log('\n✅ Data loading completed successfully!');
  } catch (error) {
    console.error('\n❌ Error loading data:', error);
    process.exit(1);
  } finally {
    dbManager.close();
  }
}

// 実行
loadData().catch(console.error);