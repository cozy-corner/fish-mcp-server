import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testMCPServer() {
  console.log('🔍 MCP Server Test');
  console.log('==================\n');

  try {
    // MCPサーバーを起動
    const serverProcess = spawn('tsx', ['src/index.ts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const transport = new StdioClientTransport({
      command: 'tsx',
      args: ['src/index.ts'],
    });

    const client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // ツール一覧を取得
    const tools = await client.listTools();
    console.log('\n📋 Available tools:');
    tools.tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // 名前で検索テスト
    console.log('\n🔍 Testing search_fish_by_name...');
    const nameSearchResult = await client.callTool('search_fish_by_name', {
      query: 'マグロ',
      limit: 3,
    });
    console.log('Result:', nameSearchResult.content[0].text);

    // 特徴で検索テスト
    console.log('\n🔍 Testing search_fish_by_features...');
    const featureSearchResult = await client.callTool('search_fish_by_features', {
      minLength: 100,
      dangerous: true,
      saltwater: true,
      limit: 5,
    });
    console.log('Result:', featureSearchResult.content[0].text);

    // 接続を閉じる
    await client.close();
    serverProcess.kill();
    
    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMCPServer().catch(console.error);