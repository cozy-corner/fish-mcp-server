import { DatabaseManager } from '../src/database/db-manager.js';
import { SearchService } from '../src/services/search-service.js';
import Database from 'better-sqlite3';

async function testImprovedSearch() {
  console.log('🔍 改善された日本語検索テスト');
  console.log('===============================\n');

  try {
    // テスト用データベース作成
    const dbManager = new DatabaseManager('./test-improved.db');
    dbManager.initialize();
    const db = dbManager.getDatabase();

    // テストデータ挿入
    console.log('📝 テストデータ挿入...');
    
    // 魚データ
    const insertFish = db.prepare(`
      INSERT INTO fish (
        spec_code, genus, species, scientific_name, fb_name, family,
        length_cm, comments, remarks, saltwater
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertFish.run(1, 'Thunnus', 'thynnus', 'Thunnus thynnus', 'Atlantic bluefin tuna', 'Scombridae', 300, 
      '大型の回遊魚で、高速で泳ぐ。商業的に重要な魚種。', 
      '危険性は低いが、大きな個体は注意が必要。', 1);

    insertFish.run(2, 'Carcharodon', 'carcharias', 'Carcharodon carcharias', 'Great white shark', 'Lamnidae', 600,
      '大型の肉食性サメ。非常に危険。', 
      '深海から浅海まで広く分布。攻撃的で危険な魚。', 1);

    insertFish.run(3, 'Sebastes', 'marinus', 'Sebastes marinus', 'Golden redfish', 'Sebastidae', 100,
      '深海魚の一種。美しい赤色。', 
      '深海に生息する。毒はないが棘に注意。', 1);

    // 日本語名データ
    const insertCommonName = db.prepare(`
      INSERT INTO common_names (spec_code, com_name, language, preferred_name)
      VALUES (?, ?, ?, ?)
    `);

    // マグロのバリエーション
    insertCommonName.run(1, 'マグロ', 'Japanese', 1);
    insertCommonName.run(1, 'まぐろ', 'Japanese', 0);
    insertCommonName.run(1, '鮪', 'Japanese', 0);
    insertCommonName.run(1, 'クロマグロ', 'Japanese', 0);
    
    // サメのバリエーション
    insertCommonName.run(2, 'ホオジロザメ', 'Japanese', 1);
    insertCommonName.run(2, 'ほおじろざめ', 'Japanese', 0);
    insertCommonName.run(2, '大白鮫', 'Japanese', 0);
    
    // アカウオ
    insertCommonName.run(3, 'アカウオ', 'Japanese', 1);
    insertCommonName.run(3, 'あかうお', 'Japanese', 0);

    console.log('✅ テストデータ挿入完了\n');

    // SearchService初期化
    const searchService = new SearchService(db);

    // テストケース
    const testCases = [
      // 基本検索
      { query: 'まぐろ', description: 'ひらがな → カタカナ変換' },
      { query: 'マグロ', description: 'カタカナ直接検索' },
      { query: '鮪', description: '漢字検索' },
      
      // 部分一致
      { query: 'ざめ', description: '部分文字列（ひらがな）' },
      { query: 'ジロ', description: '部分文字列（カタカナ）' },
      
      // 説明文検索
      { query: '大型', description: '説明文から検索' },
      { query: '危険', description: '危険性の記述' },
      { query: '深海', description: '生息地の記述' },
      { query: '美しい', description: '特徴の記述' },
      
      // 複合語
      { query: '大型の肉食性', description: '複数単語の説明' },
      { query: '深海魚', description: '複合語' },
      
      // 英語
      { query: 'tuna', description: '英語名' },
      { query: 'shark', description: '英語名' },
    ];

    console.log('🔍 検索テスト開始');
    console.log('==================\n');

    for (const testCase of testCases) {
      console.log(`📋 テスト: ${testCase.description}`);
      console.log(`   クエリ: "${testCase.query}"`);
      
      const results = searchService.searchFishByName(testCase.query);
      
      if (results.length === 0) {
        console.log('   ❌ 結果なし');
      } else {
        console.log(`   ✅ ${results.length}件ヒット`);
        results.slice(0, 2).forEach((fish, index) => {
          console.log(`      ${index + 1}. ${fish.japaneseNames || fish.fbName}`);
          console.log(`         学名: ${fish.scientificName}`);
          if (fish.matchInfo) {
            console.log(`         マッチタイプ: ${fish.matchInfo.type}`);
          }
        });
      }
      console.log('');
    }

    // 改善前後の比較
    console.log('🔍 改善効果の検証');
    console.log('==================\n');

    const improvementTests = [
      { query: 'まぐろ', expected: 'マグロがヒットする（カタカナ変換）' },
      { query: '危険', expected: '説明文から危険な魚が検索される' },
      { query: '深海', expected: '深海魚が検索される' },
    ];

    for (const test of improvementTests) {
      const results = searchService.searchFishByName(test.query);
      console.log(`テスト: ${test.expected}`);
      console.log(`クエリ: "${test.query}"`);
      console.log(`結果: ${results.length > 0 ? '✅ 成功' : '❌ 失敗'} (${results.length}件)`);
      console.log('');
    }

    dbManager.close();
    console.log('✅ テスト完了');

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// テスト実行
testImprovedSearch().catch(console.error);