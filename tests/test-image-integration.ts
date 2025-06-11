#!/usr/bin/env tsx

import assert from 'node:assert';
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testImageIntegration() {
  console.log('🖼️  Fish MCP Server - Image Integration Test');
  console.log('==========================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  const serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const responses: any[] = [];

  serverProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message) console.log('[Server]', message);
  });

  serverProcess.stdout.on('data', (data) => {
    try {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          const response = JSON.parse(line);
          responses.push(response);
        }
      }
    } catch (e) {
      // ignore non-JSON output
    }
  });

  await setTimeout(2000); // サーバー起動を待つ

  try {
    // Test 1: マグロを検索（画像取得を含む）
    console.log('🐟 Test 1: Searching for "マグロ" (Tuna) with image retrieval...');
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_fish_by_name',
        arguments: { query: 'マグロ', limit: 1, includeImages: true },
      },
    };
    
    serverProcess.stdin.write(JSON.stringify(request) + '\n');

    // 画像取得に時間がかかるため、長めに待つ
    console.log('⏳ Waiting for image retrieval from iNaturalist API...');
    await setTimeout(5000);

    // アサーション1: レスポンスが受信されたか
    assert(responses.length > 0, 'Should receive at least one response');
    console.log('✅ Assertion 1 passed: Response received');
    testsPassed++;

    // アサーション2: レスポンスが正しい形式か
    const response = responses[0];
    assert(response.result, 'Response should have result property');
    assert(response.result.content, 'Result should have content property');
    assert(Array.isArray(response.result.content), 'Content should be an array');
    assert(response.result.content.length > 0, 'Content array should not be empty');
    console.log('✅ Assertion 2 passed: Response has correct format');
    testsPassed++;

    // アサーション3: コンテンツにテキストが含まれているか
    const content = response.result.content[0];
    assert(content.type === 'text', 'Content type should be text');
    assert(typeof content.text === 'string', 'Content text should be a string');
    console.log('✅ Assertion 3 passed: Content contains text');
    testsPassed++;

    // アサーション4: 検索結果にマグロが含まれているか
    const resultText = content.text;
    assert(resultText.includes('マグロ') || resultText.includes('まぐろ'), 
      'Result should contain search term');
    assert(resultText.includes('Thunnus'), 'Result should contain scientific name');
    console.log('✅ Assertion 4 passed: Search result contains expected fish');
    testsPassed++;

    // アサーション5: 画像情報が含まれているか
    assert(resultText.includes('画像:'), 'Result should contain image URL label');
    assert(resultText.includes('http'), 'Result should contain image URL');
    assert(resultText.includes('画像提供:'), 'Result should contain image attribution');
    console.log('✅ Assertion 5 passed: Image information included');
    testsPassed++;

    // アサーション6: iNaturalist URLか確認
    assert(resultText.includes('inaturalist.org') || resultText.includes('inat'), 
      'Image URL should be from iNaturalist');
    console.log('✅ Assertion 6 passed: Image is from iNaturalist');
    testsPassed++;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testsFailed++;
  }

  serverProcess.kill();

  // テストサマリー
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📋 Total: ${testsPassed + testsFailed}`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

testImageIntegration().catch(console.error);