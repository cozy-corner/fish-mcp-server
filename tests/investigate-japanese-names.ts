import Database from 'better-sqlite3';
import { join } from 'path';

// Helper function to detect character types
function detectJapaneseCharType(text: string): {
  hasKatakana: boolean;
  hasHiragana: boolean;
  hasKanji: boolean;
  hasRomaji: boolean;
} {
  const katakanaRegex = /[\u30A0-\u30FF\u31F0-\u31FF]/;
  const hiraganaRegex = /[\u3040-\u309F]/;
  const kanjiRegex = /[\u4E00-\u9FAF]/;
  const romajiRegex = /[a-zA-Z]/;

  return {
    hasKatakana: katakanaRegex.test(text),
    hasHiragana: hiraganaRegex.test(text),
    hasKanji: kanjiRegex.test(text),
    hasRomaji: romajiRegex.test(text),
  };
}

// Main investigation
async function investigateJapaneseNames() {
  const dbPath = join(process.cwd(), 'fish.db');
  const db = new Database(dbPath, { readonly: true });

  console.log('=== Japanese Name Investigation ===\n');

  // 1. Total Japanese names count
  const totalJapanese = db
    .prepare("SELECT COUNT(*) as count FROM common_names WHERE language = 'Japanese'")
    .get() as { count: number };
  console.log(`Total Japanese names: ${totalJapanese.count}\n`);

  // 2. Get all Japanese names and analyze character types
  const japaneseNames = db
    .prepare("SELECT com_name, spec_code FROM common_names WHERE language = 'Japanese'")
    .all() as Array<{ com_name: string; spec_code: number }>;

  const stats = {
    katakanaOnly: 0,
    hiraganaOnly: 0,
    kanjiOnly: 0,
    romajiOnly: 0,
    katakanaHiragana: 0,
    katakanaKanji: 0,
    hiraganaKanji: 0,
    mixed: 0,
    total: japaneseNames.length,
  };

  const examplesByType: Record<string, string[]> = {
    katakanaOnly: [],
    hiraganaOnly: [],
    kanjiOnly: [],
    romajiOnly: [],
    katakanaHiragana: [],
    katakanaKanji: [],
    hiraganaKanji: [],
    mixed: [],
  };

  for (const name of japaneseNames) {
    const charTypes = detectJapaneseCharType(name.com_name);
    
    // Categorize based on character types
    if (charTypes.hasKatakana && !charTypes.hasHiragana && !charTypes.hasKanji && !charTypes.hasRomaji) {
      stats.katakanaOnly++;
      if (examplesByType.katakanaOnly.length < 10) {
        examplesByType.katakanaOnly.push(name.com_name);
      }
    } else if (!charTypes.hasKatakana && charTypes.hasHiragana && !charTypes.hasKanji && !charTypes.hasRomaji) {
      stats.hiraganaOnly++;
      if (examplesByType.hiraganaOnly.length < 10) {
        examplesByType.hiraganaOnly.push(name.com_name);
      }
    } else if (!charTypes.hasKatakana && !charTypes.hasHiragana && charTypes.hasKanji && !charTypes.hasRomaji) {
      stats.kanjiOnly++;
      if (examplesByType.kanjiOnly.length < 10) {
        examplesByType.kanjiOnly.push(name.com_name);
      }
    } else if (!charTypes.hasKatakana && !charTypes.hasHiragana && !charTypes.hasKanji && charTypes.hasRomaji) {
      stats.romajiOnly++;
      if (examplesByType.romajiOnly.length < 10) {
        examplesByType.romajiOnly.push(name.com_name);
      }
    } else if (charTypes.hasKatakana && charTypes.hasHiragana && !charTypes.hasKanji) {
      stats.katakanaHiragana++;
      if (examplesByType.katakanaHiragana.length < 10) {
        examplesByType.katakanaHiragana.push(name.com_name);
      }
    } else if (charTypes.hasKatakana && charTypes.hasKanji) {
      stats.katakanaKanji++;
      if (examplesByType.katakanaKanji.length < 10) {
        examplesByType.katakanaKanji.push(name.com_name);
      }
    } else if (charTypes.hasHiragana && charTypes.hasKanji && !charTypes.hasKatakana) {
      stats.hiraganaKanji++;
      if (examplesByType.hiraganaKanji.length < 10) {
        examplesByType.hiraganaKanji.push(name.com_name);
      }
    } else {
      stats.mixed++;
      if (examplesByType.mixed.length < 10) {
        examplesByType.mixed.push(name.com_name);
      }
    }
  }

  // 3. Display statistics
  console.log('=== Character Type Distribution ===');
  console.log(`Katakana only: ${stats.katakanaOnly} (${(stats.katakanaOnly / stats.total * 100).toFixed(2)}%)`);
  console.log(`Hiragana only: ${stats.hiraganaOnly} (${(stats.hiraganaOnly / stats.total * 100).toFixed(2)}%)`);
  console.log(`Kanji only: ${stats.kanjiOnly} (${(stats.kanjiOnly / stats.total * 100).toFixed(2)}%)`);
  console.log(`Romaji only: ${stats.romajiOnly} (${(stats.romajiOnly / stats.total * 100).toFixed(2)}%)`);
  console.log(`Katakana + Hiragana: ${stats.katakanaHiragana} (${(stats.katakanaHiragana / stats.total * 100).toFixed(2)}%)`);
  console.log(`Katakana + Kanji: ${stats.katakanaKanji} (${(stats.katakanaKanji / stats.total * 100).toFixed(2)}%)`);
  console.log(`Hiragana + Kanji: ${stats.hiraganaKanji} (${(stats.hiraganaKanji / stats.total * 100).toFixed(2)}%)`);
  console.log(`Mixed/Other: ${stats.mixed} (${(stats.mixed / stats.total * 100).toFixed(2)}%)`);
  console.log(`\nTotal with Katakana: ${stats.katakanaOnly + stats.katakanaHiragana + stats.katakanaKanji + stats.mixed}`);

  // 4. Show examples for each type
  console.log('\n=== Examples by Type ===');
  for (const [type, examples] of Object.entries(examplesByType)) {
    if (examples.length > 0) {
      console.log(`\n${type}:`);
      examples.forEach(ex => console.log(`  - ${ex}`));
    }
  }

  // 5. Search for specific fish names
  console.log('\n=== Searching for Specific Fish ===');
  const searchTerms = [
    'サバ', 'さば', 'saba',
    'イワシ', 'いわし', 'iwashi',
    'タイ', 'たい', 'tai',
    'マグロ', 'まぐろ', 'maguro',
    'アジ', 'あじ', 'aji',
    'サケ', 'さけ', 'sake',
    'ブリ', 'ぶり', 'buri',
    'カツオ', 'かつお', 'katsuo'
  ];

  for (const term of searchTerms) {
    const results = db
      .prepare("SELECT com_name, spec_code FROM common_names WHERE language = 'Japanese' AND com_name LIKE ?")
      .all(`%${term}%`) as Array<{ com_name: string; spec_code: number }>;
    
    if (results.length > 0) {
      console.log(`\nFound for "${term}": ${results.length} results`);
      results.slice(0, 3).forEach(r => console.log(`  - ${r.com_name} (spec_code: ${r.spec_code})`));
    } else {
      console.log(`\nNo results for "${term}"`);
    }
  }

  // 6. Get fish info for some katakana examples
  if (examplesByType.katakanaOnly.length > 0) {
    console.log('\n=== Fish Details for Katakana Examples ===');
    const katakanaExample = db
      .prepare("SELECT spec_code FROM common_names WHERE com_name = ? AND language = 'Japanese'")
      .get(examplesByType.katakanaOnly[0]) as { spec_code: number } | undefined;
    
    if (katakanaExample) {
      const fishInfo = db
        .prepare("SELECT scientific_name, fb_name FROM fish WHERE spec_code = ?")
        .get(katakanaExample.spec_code) as { scientific_name: string; fb_name: string } | undefined;
      
      if (fishInfo) {
        console.log(`\nExample: ${examplesByType.katakanaOnly[0]}`);
        console.log(`  Scientific name: ${fishInfo.scientific_name}`);
        console.log(`  English name: ${fishInfo.fb_name}`);
      }
    }
  }

  db.close();
}

// Run the investigation
investigateJapaneseNames().catch(console.error);