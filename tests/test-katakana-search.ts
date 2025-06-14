import Database from 'better-sqlite3';
import { join } from 'path';
import { SearchService } from '../src/services/search-service.js';
import * as wanakana from 'wanakana';

// Test the katakana to romaji conversion and search
async function testKatakanaSearch() {
  const dbPath = join(process.cwd(), 'fish.db');
  const db = new Database(dbPath, { readonly: true });
  const searchService = new SearchService(db);

  console.log('=== Testing Katakana Search Implementation ===\n');

  // Test katakana to romaji conversion
  console.log('1. Testing katakana to romaji conversion:');
  const testWords = ['サバ', 'イワシ', 'タイ', 'マグロ', 'アジ', 'サケ', 'ブリ', 'カツオ'];
  
  for (const word of testWords) {
    const romaji = wanakana.toRomaji(word, { upcaseKatakana: false }).toLowerCase();
    const romajiWithMacrons = romaji.replace(/ou/g, 'ô').replace(/uu/g, 'û');
    console.log(`  ${word} → ${romaji} → ${romajiWithMacrons}`);
  }

  console.log('\n2. Testing search results for katakana queries:\n');

  for (const query of testWords) {
    console.log(`\nSearching for: ${query}`);
    
    try {
      const results = await searchService.searchFishByName(query, 5);
      
      if (results.length === 0) {
        console.log('  No results found');
        
        // Let's check what romaji version we're searching for
        const romaji = wanakana.toRomaji(query, { upcaseKatakana: false }).toLowerCase();
        const romajiWithMacrons = romaji.replace(/ou/g, 'ô').replace(/uu/g, 'û');
        console.log(`  (Searched for romaji: ${romajiWithMacrons})`);
        
        // Try to find any Japanese names containing this romaji
        const romajiResults = db
          .prepare("SELECT com_name FROM common_names WHERE language = 'Japanese' AND com_name LIKE ? LIMIT 5")
          .all(`%${romajiWithMacrons}%`) as Array<{ com_name: string }>;
        
        if (romajiResults.length > 0) {
          console.log(`  Found similar romaji names in database:`);
          romajiResults.forEach(r => console.log(`    - ${r.com_name}`));
        }
      } else {
        console.log(`  Found ${results.length} results:`);
        results.forEach(fish => {
          console.log(`    - ${fish.scientificName} (${fish.fbName})`);
          console.log(`      Match type: ${fish.matchType}`);
          if (fish.matchedName) {
            console.log(`      Matched name: ${fish.matchedName}`);
          }
        });
      }
    } catch (error) {
      console.error(`  Error searching: ${error}`);
    }
  }

  console.log('\n3. Testing direct database queries for common fish:\n');

  // Check if the exact katakana names exist in the database
  for (const name of testWords) {
    const exactMatch = db
      .prepare("SELECT COUNT(*) as count FROM common_names WHERE language = 'Japanese' AND com_name = ?")
      .get(name) as { count: number };
    
    console.log(`  ${name}: ${exactMatch.count > 0 ? 'EXISTS' : 'NOT FOUND'} in database`);
    
    if (exactMatch.count === 0) {
      // Check for partial matches
      const partialMatches = db
        .prepare("SELECT com_name FROM common_names WHERE language = 'Japanese' AND com_name LIKE ? LIMIT 3")
        .all(`%${name}%`) as Array<{ com_name: string }>;
      
      if (partialMatches.length > 0) {
        console.log(`    Partial matches found:`);
        partialMatches.forEach(m => console.log(`      - ${m.com_name}`));
      }
    }
  }

  db.close();
}

// Run the test
testKatakanaSearch().catch(console.error);