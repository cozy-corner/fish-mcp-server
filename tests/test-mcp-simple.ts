#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testMCPServer() {
  console.log('🔍 Simple MCP Server Test');
  console.log('========================\n');

  try {
    // MCPサーバーを起動
    console.log('Starting MCP server...');
    const serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // エラー出力を表示
    serverProcess.stderr.on('data', (data) => {
      console.log('[Server Log]', data.toString());
    });

    // 標準出力を表示
    serverProcess.stdout.on('data', (data) => {
      console.log('[Server Output]', data.toString());
    });

    // プロセスエラーをハンドル
    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
    });

    // 少し待つ
    await setTimeout(2000);

    // テスト用のリクエストを送信
    console.log('\nSending list tools request...');
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    };

    serverProcess.stdin.write(JSON.stringify(request) + '\n');

    // レスポンスを待つ
    await setTimeout(1000);

    // サーバーを停止
    console.log('\nStopping server...');
    serverProcess.kill();
    
    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMCPServer().catch(console.error);