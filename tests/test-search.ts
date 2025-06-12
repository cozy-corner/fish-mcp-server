import { FishBaseDataLoader } from '../src/services/data-loader.js';
import { SearchService } from '../src/services/search-service.js';
import { DatabaseManager } from '../src/database/db-manager.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

async function testSearch() {
  console.log('🐟 Fish MCP Server - 検索機能テスト');
  console.log('=====================================\n');

  try {
    // データベース初期化
    console.log('📦 データベース初期化中...');
    // Get the project root directory from the current module's location
    const currentFileUrl = import.meta.url;
    const currentFilePath = fileURLToPath(currentFileUrl);
    const currentDir = dirname(currentFilePath);
    // Navigate from tests/ to project root
    const projectRoot = resolve(currentDir, '../');
    const dbPath = resolve(projectRoot, 'fish.db');

    const dbManager = new DatabaseManager(dbPath);
    dbManager.initialize();
    
    // データ確認
    console.log('📥 データ確認中...');
    const stats = dbManager.getStats();
    console.log(`魚データ: ${stats.fishCount}件`);
    console.log(`日本語名: ${stats.japaneseNameCount}件`);
    
    if (stats.fishCount === 0) {
      console.log('⚠️  データが存在しません。現在のFTS5実装のテストはスキップします。');
      console.log('💡 実際のテストには、まずデータをインポートする必要があります。');
      return;
    }
    
    // 検索サービス初期化
    const searchService = new SearchService(dbManager.getDatabase());
    
    console.log('✅ 初期化完了\n');
    
    // テストケース
    const testCases = [
      'マグロ',   // 日本語検索
      'Tuna',     // 英語検索
      'まぐろ',   // ひらがな検索
      '大きい',   // 形容詞検索
      '深海',     // 生息地検索
      'Thunnus',  // 学名検索
    ];
    
    for (const query of testCases) {
      console.log(`🔍 検索: "${query}"`);
      console.log('------------------------');
      
      const results = searchService.searchFishByName(query);
      
      if (results.length === 0) {
        console.log('   結果なし\n');
        continue;
      }
      
      console.log(`   結果数: ${results.length}件`);
      
      // 最初の3件を表示
      results.slice(0, 3).forEach((fish, index) => {
        console.log(`   ${index + 1}. ${fish.japanese_names || '名称不明'}`);
        console.log(`      学名: ${fish.scientific_name}`);
        console.log(`      科: ${fish.family_name || '不明'}`);
        if (fish.match_info) {
          console.log(`      一致: ${fish.match_info.type} (優先度: ${fish.match_info.priority})`);
        }
        console.log('');
      });
      
      if (results.length > 3) {
        console.log(`   ... 他${results.length - 3}件\n`);
      }
    }
    
    // FTS5特有のテスト
    console.log('🔍 FTS5全文検索テスト');
    console.log('========================');
    
    const ftsTestCases = [
      '危険',
      '深海 魚',
      'large fish',
      'トゥナ ひらがな',
    ];
    
    for (const query of ftsTestCases) {
      console.log(`\n🔍 FTS5検索: "${query}"`);
      console.log('----------------------------');
      
      const results = searchService.searchFishByName(query);
      const ftsResults = results.filter(r => r.match_info?.type === 'fts');
      
      console.log(`   FTS5結果: ${ftsResults.length}件`);
      
      ftsResults.slice(0, 2).forEach((fish, index) => {
        console.log(`   ${index + 1}. ${fish.japanese_names || '名称不明'}`);
        console.log(`      学名: ${fish.scientific_name}`);
        if (fish.match_info?.matched_text) {
          console.log(`      一致テキスト: "${fish.match_info.matched_text}"`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
    if (error instanceof Error) {
      console.error('スタックトレース:', error.stack);
    }
  }
}

// スクリプト実行
testSearch().catch(console.error);