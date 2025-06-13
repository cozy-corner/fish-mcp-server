import { DatabaseManager } from '../src/database/db-manager.js';
import { getDbPath } from '../src/utils/paths.js';

async function checkDatabaseStatus() {
  console.log('🔍 Checking Database Status');
  console.log('===========================\n');

  let dbManager: DatabaseManager | null = null;
  try {
    // Use the shared path resolution helper
    const dbPath = getDbPath(import.meta.url);

    dbManager = new DatabaseManager(dbPath);
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
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (dbManager) {
      dbManager.close();
    }
  }
}

checkDatabaseStatus().catch(console.error);