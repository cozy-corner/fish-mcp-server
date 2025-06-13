#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FishMCPServer } from './mcp/server.js';

async function main(): Promise<void> {
  const server = new Server(
    {
      name: 'fish-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const fishServer = new FishMCPServer(server);
  fishServer.setupHandlers();

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(error => {
  if (error instanceof Error) {
    // Use stderr for error output to avoid JSON-RPC contamination
    process.stderr.write(`Error: ${error.message}\n`);
    if (error.stack) {
      process.stderr.write(`Stack trace: ${error.stack}\n`);
    }
  } else {
    process.stderr.write(`Unknown error: ${String(error)}\n`);
  }
  process.exit(1);
});
