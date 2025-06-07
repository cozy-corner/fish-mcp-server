import { DatabaseManager } from './database/db-manager.js';

async function testFTS5() {
  console.log('🔍 FTS5機能のシンプルテスト');
  console.log('==========================\n');

  try {
    const dbManager = new DatabaseManager('./test-fts5.db');
    dbManager.initialize();
    const db = dbManager.getDatabase();

    // テストデータを挿入
    console.log('📝 テストデータ挿入...');
    
    // 魚のテストデータ
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

    // 日本語名のテストデータ
    const insertCommonName = db.prepare(`
      INSERT INTO common_names (spec_code, com_name, language, preferred_name)
      VALUES (?, ?, ?, ?)
    `);

    insertCommonName.run(1, 'マグロ', 'Japanese', 1);
    insertCommonName.run(1, 'まぐろ', 'Japanese', 0);
    insertCommonName.run(1, '鮪', 'Japanese', 0);
    insertCommonName.run(2, 'ホオジロザメ', 'Japanese', 1);
    insertCommonName.run(2, '大白鮫', 'Japanese', 0);
    insertCommonName.run(3, 'アカウオ', 'Japanese', 1);

    console.log('✅ テストデータ挿入完了');

    // FTS5インデックスを構築
    console.log('🔧 FTS5インデックス構築...');
    
    const buildFTS = db.prepare(`
      INSERT INTO fish_search (rowid, scientific_name, fb_name, comments, remarks, japanese_names, english_names)
      SELECT 
        f.spec_code,
        f.scientific_name,
        f.fb_name,
        COALESCE(f.comments, ''),
        COALESCE(f.remarks, ''),
        COALESCE(GROUP_CONCAT(CASE WHEN cn.language = 'Japanese' THEN cn.com_name END, ' '), ''),
        COALESCE(GROUP_CONCAT(CASE WHEN cn.language = 'English' THEN cn.com_name END, ' '), '')
      FROM fish f
      LEFT JOIN common_names cn ON f.spec_code = cn.spec_code
      GROUP BY f.spec_code, f.scientific_name, f.fb_name, f.comments, f.remarks
    `);

    buildFTS.run();
    console.log('✅ FTS5インデックス構築完了');

    // デバッグ: データを確認
    console.log('\n🔍 データ確認');
    console.log('==============');
    
    const fishCount = db.prepare('SELECT COUNT(*) as count FROM fish').get() as {count: number};
    console.log(`魚データ: ${fishCount.count}件`);
    
    const ftsCount = db.prepare('SELECT COUNT(*) as count FROM fish_search').get() as {count: number};
    console.log(`FTS5データ: ${ftsCount.count}件`);

    const sampleFts = db.prepare('SELECT * FROM fish_search LIMIT 1').get();
    console.log('FTS5サンプルデータ:', sampleFts);

    // FTS5検索テスト
    console.log('\n🔍 FTS5検索テスト開始');
    console.log('====================');

    const testQueries = [
      'マグロ',
      '危険',
      '深海',
      '大型',
      'tuna',
      'shark',
      '美しい',
      'Thunnus'
    ];

    const searchQuery = db.prepare(`
      SELECT 
        scientific_name,
        fb_name,
        comments,
        japanese_names,
        rank
      FROM fish_search
      WHERE fish_search MATCH ?
      ORDER BY rank
      LIMIT 5
    `);

    for (const query of testQueries) {
      console.log(`\n🔍 検索: "${query}"`);
      console.log('─'.repeat(30));
      
      try {
        const results = searchQuery.all(query);
        
        if (results.length === 0) {
          console.log('   結果なし');
        } else {
          results.forEach((row: any, index: number) => {
            console.log(`   ${index + 1}. ${row.japanese_names || row.fb_name}`);
            console.log(`      学名: ${row.scientific_name}`);
            console.log(`      説明: ${row.comments}`);
          });
        }
      } catch (error) {
        console.log(`   エラー: ${error}`);
      }
    }

    // 高度なFTS5機能テスト
    console.log('\n🔍 高度なFTS5機能テスト');
    console.log('========================');

    const advancedQueries = [
      '危険 AND 大型',    // AND検索
      '"深海魚"',         // フレーズ検索
      'マグロ OR サメ',   // OR検索
      'tun*',            // ワイルドカード
    ];

    for (const query of advancedQueries) {
      console.log(`\n🔍 高度検索: "${query}"`);
      console.log('─'.repeat(40));
      
      try {
        const results = searchQuery.all(query);
        
        if (results.length === 0) {
          console.log('   結果なし');
        } else {
          results.forEach((row: any, index: number) => {
            console.log(`   ${index + 1}. ${row.japanese_names || row.fb_name}`);
          });
        }
      } catch (error) {
        console.log(`   エラー: ${error}`);
      }
    }

    console.log('\n✅ FTS5機能テスト完了');

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

testFTS5().catch(console.error);