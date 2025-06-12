import { DatabaseManager } from '../src/database/db-manager.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

async function checkDatabaseStatus() {
  console.log('🔍 Checking Database Status');
  console.log('===========================\n');

  try {
    // Get the project root directory from the current module's location
    const currentFileUrl = import.meta.url;
    const currentFilePath = fileURLToPath(currentFileUrl);
    const currentDir = dirname(currentFilePath);
    // Navigate from tests/ to project root
    const projectRoot = resolve(currentDir, '../');
    const dbPath = resolve(projectRoot, 'fish.db');

    const dbManager = new DatabaseManager(dbPath);
    dbManager.initialize();
    
    const stats = dbManager.getStats();
    console.log('📊 Database Statistics:');
    console.log(`  - Total fish species: ${stats.fishCount}`);
    console.log(`  - Total common names: ${stats.commonNameCount}`);
    console.log(`  - Japanese names: ${stats.japaneseNameCount}`);
    console.log(`  - English names: ${stats.englishNameCount}`);
    
    if (stats.fishCount === 0) {
      console.log('\n⚠️  Database is empty! You need to run the data import process first.');
      console.log('   Please implement and run the data loading script to populate the database.');
    } else {
      console.log('\n✅ Database is populated and ready!');
    }
    
    dbManager.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabaseStatus().catch(console.error);