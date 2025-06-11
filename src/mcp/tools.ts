import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const searchFishByNameTool: Tool = {
  name: 'search_fish_by_name',
  description:
    '魚の名前（日本語または英語）から魚を検索します。ひらがな、カタカナ、漢字、英語に対応しています。',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '検索する魚の名前（例: "マグロ", "まぐろ", "鮪", "tuna"）',
      },
      limit: {
        type: 'number',
        description: '検索結果の最大件数（デフォルト: 10）',
        default: 10,
      },
      includeImages: {
        type: 'boolean',
        description: '画像情報を含めるかどうか（デフォルト: false）',
        default: false,
      },
    },
    required: ['query'],
  },
};

export const searchFishByFeaturesTool: Tool = {
  name: 'search_fish_by_features',
  description: '魚の特徴（大きさ、危険性、生息地など）から魚を検索します。',
  inputSchema: {
    type: 'object',
    properties: {
      minLength: {
        type: 'number',
        description: '最小サイズ（センチメートル）',
      },
      maxLength: {
        type: 'number',
        description: '最大サイズ（センチメートル）',
      },
      dangerous: {
        type: 'boolean',
        description: '危険な魚のみを検索（true: 危険、false: 安全）',
      },
      saltwater: {
        type: 'boolean',
        description: '海水魚のみを検索（true: 海水魚、false: 淡水魚）',
      },
      deepwater: {
        type: 'boolean',
        description: '深海魚のみを検索（true: 深海魚、false: 浅海魚）',
      },
      commercial: {
        type: 'boolean',
        description: '商業的に重要な魚のみを検索',
      },
      limit: {
        type: 'number',
        description: '検索結果の最大件数（デフォルト: 20）',
        default: 20,
      },
      includeImages: {
        type: 'boolean',
        description: '画像情報を含めるかどうか（デフォルト: false）',
        default: false,
      },
    },
    required: [],
  },
};
