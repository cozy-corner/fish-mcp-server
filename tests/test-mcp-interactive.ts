#!/usr/bin/env tsx

import { spawn } from 'child_process';
import * as readline from 'readline';
import { setTimeout } from 'timers/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function testMCPServer() {
  console.log('🐟 Fish MCP Server - Interactive Test');
  console.log('=====================================\n');

  // MCPサーバーを起動
  console.log('Starting MCP server...');
  const serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // エラー出力を表示
  serverProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message) console.log('[Server]', message);
  });

  // 標準出力からJSONレスポンスを解析
  serverProcess.stdout.on('data', (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.result && response.result.content) {
        console.log('\n📋 Result:');
        console.log(response.result.content[0].text);
      }
    } catch (e) {
      // JSONでない出力は無視
    }
  });

  await setTimeout(1000);

  console.log('\n✅ Server is ready!');
  console.log('\nAvailable commands:');
  console.log('  1. Search by name (e.g., "まぐろ", "サメ", "tuna")');
  console.log('  2. Search dangerous fish');
  console.log('  3. Search large fish');
  console.log('  4. Search deepwater fish');
  console.log('  5. Exit');

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

  const prompt = async (): Promise<void> => {
    const answer = await new Promise<string>((resolve) => {
      rl.question('\n> Enter command (1-5): ', resolve);
    });

    switch (answer) {
      case '1': {
        const query = await new Promise<string>((resolve) => {
          rl.question('Enter fish name: ', resolve);
        });
        sendRequest('tools/call', {
          name: 'search_fish_by_name',
          arguments: { query, limit: 5 },
        });
        break;
      }
      case '2':
        sendRequest('tools/call', {
          name: 'search_fish_by_features',
          arguments: { dangerous: true, limit: 5 },
        });
        break;
      case '3':
        sendRequest('tools/call', {
          name: 'search_fish_by_features',
          arguments: { minLength: 200, limit: 5 },
        });
        break;
      case '4':
        sendRequest('tools/call', {
          name: 'search_fish_by_features',
          arguments: { deepwater: true, limit: 5 },
        });
        break;
      case '5':
        console.log('\nStopping server...');
        serverProcess.kill();
        rl.close();
        return;
      default:
        console.log('Invalid command');
    }

    await setTimeout(500); // レスポンスを待つ
    await prompt(); // 次のコマンドを待つ
  };

  await prompt();
}

testMCPServer().catch(console.error);