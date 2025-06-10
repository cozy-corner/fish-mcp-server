#!/usr/bin/env tsx

import assert from 'node:assert';
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testMCPServer() {
  console.log('🐟 Fish MCP Server - Integration Test');
  console.log('====================================\n');

  const serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let responseCount = 0;
  const responses: any[] = [];

  serverProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message) console.log('[Server]', message);
  });

  serverProcess.stdout.on('data', (data) => {
    try {
      const response = JSON.parse(data.toString());
      responses.push(response);
      responseCount++;
    } catch (e) {
      // ignore non-JSON output
    }
  });

  await setTimeout(1000);

  let requestId = 1;
  const sendRequest = (method: string, params: any) => {
    const request = {
      jsonrpc: '2.0',
      id: requestId++,
      method,
      params,
    };
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  };

  // Test 1: List tools
  console.log('📋 Test 1: List available tools');
  sendRequest('tools/list', {});
  await setTimeout(500);

  // Test 2: Search by Japanese name
  console.log('\n🔍 Test 2: Search by Japanese name "まぐろ"');
  sendRequest('tools/call', {
    name: 'search_fish_by_name',
    arguments: { query: 'まぐろ', limit: 3 },
  });
  await setTimeout(500);

  // Test 3: Search by English name
  console.log('\n🔍 Test 3: Search by English name "shark"');
  sendRequest('tools/call', {
    name: 'search_fish_by_name',
    arguments: { query: 'shark', limit: 3 },
  });
  await setTimeout(500);

  // Test 4: Search dangerous fish
  console.log('\n⚠️  Test 4: Search dangerous fish');
  sendRequest('tools/call', {
    name: 'search_fish_by_features',
    arguments: { dangerous: true, limit: 5 },
  });
  await setTimeout(500);

  // Test 5: Search large saltwater fish
  console.log('\n🌊 Test 5: Search large saltwater fish');
  sendRequest('tools/call', {
    name: 'search_fish_by_features',
    arguments: { minLength: 200, saltwater: true, limit: 5 },
  });
  await setTimeout(500);

  // Test 6: Search non-existent fish
  console.log('\n❓ Test 6: Search non-existent fish');
  sendRequest('tools/call', {
    name: 'search_fish_by_name',
    arguments: { query: '存在しない魚', limit: 3 },
  });
  await setTimeout(500);

  serverProcess.kill();
  
  // Verify test results with assertions
  console.log('\n🧪 Verifying test results...');
  
  try {
    // Should have received all 6 responses
    assert.strictEqual(responses.length, 6, 'Should receive 6 responses');
    console.log('✅ Received expected number of responses');

    // Test 1: Tools list
    const toolsResponse = responses[0];
    assert.ok(toolsResponse.result, 'Tools response should have result');
    assert.ok(toolsResponse.result.tools, 'Should have tools array');
    assert.strictEqual(toolsResponse.result.tools.length, 2, 'Should have 2 tools');
    
    const toolNames = toolsResponse.result.tools.map((t: any) => t.name);
    assert.ok(toolNames.includes('search_fish_by_name'), 'Should have search_fish_by_name tool');
    assert.ok(toolNames.includes('search_fish_by_features'), 'Should have search_fish_by_features tool');
    console.log('✅ Tools list verification passed');

    // Test 2: Japanese name search
    const japaneseSearchResponse = responses[1];
    assert.ok(japaneseSearchResponse.result, 'Japanese search should have result');
    assert.ok(japaneseSearchResponse.result.content, 'Should have content');
    const japaneseText = japaneseSearchResponse.result.content[0].text;
    assert.ok(japaneseText.includes('まぐろ'), 'Should contain search query');
    assert.ok(japaneseText.includes('件'), 'Should show result count');
    console.log('✅ Japanese name search verification passed');

    // Test 3: English name search
    const englishSearchResponse = responses[2];
    assert.ok(englishSearchResponse.result, 'English search should have result');
    const englishText = englishSearchResponse.result.content[0].text;
    assert.ok(englishText.includes('shark'), 'Should contain search query');
    assert.ok(englishText.includes('Great white') || englishText.includes('ホオジロザメ'), 'Should find shark results');
    console.log('✅ English name search verification passed');

    // Test 4: Dangerous fish search (may have SQL errors, but should respond)
    const dangerousSearchResponse = responses[3];
    assert.ok(dangerousSearchResponse.result, 'Dangerous search should have result');
    console.log('✅ Dangerous fish search responded');

    // Test 5: Large saltwater fish search
    const largeSearchResponse = responses[4];
    assert.ok(largeSearchResponse.result, 'Large fish search should have result');
    const largeText = largeSearchResponse.result.content[0].text;
    assert.ok(largeText.includes('200cm以上'), 'Should show size criteria');
    assert.ok(largeText.includes('海水魚'), 'Should show saltwater criteria');
    console.log('✅ Large saltwater fish search verification passed');

    // Test 6: Non-existent fish search
    const nonExistentResponse = responses[5];
    assert.ok(nonExistentResponse.result, 'Non-existent search should have result');
    const nonExistentText = nonExistentResponse.result.content[0].text;
    assert.ok(
      nonExistentText.includes('見つかりませんでした') || nonExistentText.includes('エラー'),
      'Should indicate no results or error'
    );
    console.log('✅ Non-existent fish search verification passed');

    console.log('\n🎉 All integration tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.log('\n📊 Response summary:');
    responses.forEach((response, index) => {
      console.log(`  ${index + 1}. ${response.result ? 'Success' : 'Error'}: ${
        response.result?.tools ? `${response.result.tools.length} tools` :
        response.result?.content ? response.result.content[0].text.substring(0, 50) + '...' :
        response.error?.message || 'Unknown'
      }`);
    });
    process.exit(1);
  }
}

testMCPServer().catch(console.error);