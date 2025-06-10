import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { DatabaseManager } from '../database/db-manager.js';
import { SearchService } from '../services/search-service.js';
import { searchFishByNameTool, searchFishByFeaturesTool } from './tools.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Fish, DangerLevel } from '../types/fish.js';

export class FishMCPServer {
  private server: Server;
  private dbManager: DatabaseManager;
  private searchService: SearchService;

  constructor(server: Server) {
    this.server = server;

    try {
      console.error('[FishMCPServer] Initializing database...');
      this.dbManager = new DatabaseManager('fish.db');
      this.dbManager.initialize();

      const stats = this.dbManager.getStats();
      console.error(
        `[FishMCPServer] Database initialized with ${stats.fishCount} fish and ${stats.japaneseNameCount} Japanese names`
      );

      this.searchService = new SearchService(this.dbManager.getDatabase());
      console.error('[FishMCPServer] Search service initialized');
    } catch (error) {
      console.error('[FishMCPServer] Failed to initialize:', error);
      throw error;
    }
  }

  setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [searchFishByNameTool, searchFishByFeaturesTool],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_fish_by_name': {
            const query = args?.query as string;
            if (!query) {
              throw new Error('検索クエリが指定されていません');
            }

            console.error(`[FishMCPServer] Searching by name: "${query}"`);
            const results = this.searchService.searchFishByName(
              query,
              args?.limit as number | undefined
            );
            console.error(`[FishMCPServer] Found ${results.length} results`);

            return {
              content: [
                {
                  type: 'text',
                  text: this.formatSearchResults(results, query),
                },
              ],
            };
          }

          case 'search_fish_by_features': {
            const options = args as Record<string, unknown>;
            console.error(
              `[FishMCPServer] Searching by features:`,
              JSON.stringify(options)
            );
            const results = this.searchService.searchFishByFeatures(options);
            console.error(`[FishMCPServer] Found ${results.length} results`);

            return {
              content: [
                {
                  type: 'text',
                  text: this.formatFeatureSearchResults(results, options),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '不明なエラーが発生しました';
        return {
          content: [
            {
              type: 'text',
              text: `エラー: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private formatSearchResults(results: Fish[], query: string): string {
    if (results.length === 0) {
      return `「${query}」に一致する魚は見つかりませんでした。`;
    }

    const formattedResults = results
      .map((fish, index) => {
        const extendedFish = fish as Fish & { japaneseNames?: string };
        const names = extendedFish.japaneseNames || fish.fbName || '名称不明';
        const size = fish.length ? `${fish.length}cm` : '不明';
        const habitat = this.getHabitatDescription(fish);
        const danger = this.getDangerDescription(fish.dangerous);

        return `${index + 1}. ${names}（${fish.scientificName}）
   大きさ: ${size}
   生息地: ${habitat}
   危険度: ${danger}
   ${fish.comments || ''}`;
      })
      .join('\n\n');

    return `「${query}」の検索結果（${results.length}件）:\n\n${formattedResults}`;
  }

  private formatFeatureSearchResults(
    results: Fish[],
    options: Record<string, unknown>
  ): string {
    if (results.length === 0) {
      return '指定された条件に一致する魚は見つかりませんでした。';
    }

    const conditions: string[] = [];
    if (options.minLength) conditions.push(`${options.minLength}cm以上`);
    if (options.maxLength) conditions.push(`${options.maxLength}cm以下`);
    if (options.dangerous !== undefined)
      conditions.push(options.dangerous ? '危険' : '安全');
    if (options.saltwater !== undefined)
      conditions.push(options.saltwater ? '海水魚' : '淡水魚');
    if (options.deepwater !== undefined)
      conditions.push(options.deepwater ? '深海魚' : '浅海魚');

    const formattedResults = results
      .map((fish, index) => {
        const extendedFish = fish as Fish & { japaneseNames?: string };
        const names = extendedFish.japaneseNames || fish.fbName || '名称不明';
        const size = fish.length ? `${fish.length}cm` : '不明';
        return `${index + 1}. ${names}（${size}）`;
      })
      .join('\n');

    return `条件（${conditions.join('、')}）に一致する魚（${results.length}件）:\n\n${formattedResults}`;
  }

  private getHabitatDescription(fish: Fish): string {
    const habitats: string[] = [];
    if (fish.saltwater) habitats.push('海水');
    if (fish.fresh) habitats.push('淡水');
    if (fish.brackish) habitats.push('汽水');
    if (fish.depthRangeDeep && fish.depthRangeDeep > 200) habitats.push('深海');
    return habitats.join('・') || '不明';
  }

  private getDangerDescription(dangerLevel?: DangerLevel): string {
    switch (dangerLevel) {
      case DangerLevel.HARMLESS:
        return '無害';
      case DangerLevel.VENOMOUS:
        return '毒性あり';
      case DangerLevel.TRAUMATOGENIC:
        return '外傷性';
      case DangerLevel.CIGUATERA:
        return 'シガテラ毒の報告あり';
      case DangerLevel.POTENTIAL_PEST:
        return '潜在的な害魚';
      case DangerLevel.POISONOUS_TO_EAT:
        return '食べると有毒';
      case DangerLevel.OTHER:
        return 'その他の危険';
      default:
        return '情報なし';
    }
  }

  close(): void {
    this.dbManager.close();
  }
}
