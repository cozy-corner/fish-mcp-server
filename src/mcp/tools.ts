import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const searchFishByNameTool: Tool = {
  name: 'search_fish_by_name',
  description:
    '魚の名前（日本語または英語）から魚を検索します。ひらがな、カタカナ、英語に対応しています。',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '検索する魚の名前（例: "マグロ", "まぐろ", "tuna"）',
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

export const searchFishByNaturalLanguageTool: Tool = {
  name: 'search_fish_by_natural_language',
  description:
    '自然言語での魚検索を実行します。特徴、生息地、外見などの自由な表現で魚を検索できます。英語での検索が推奨されます（データベースのコメントが主に英語のため）。',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          '自然言語での検索クエリ。英語推奨（例: "large dangerous fish", "beautiful tropical fish", "deep sea fish"）。日本語も可能（例: "大きくて危険な魚", "美しい熱帯魚", "深海魚"）',
      },
      limit: {
        type: 'number',
        description: '検索結果の最大件数（デフォルト: 10）',
        default: 10,
      },
      scoreThreshold: {
        type: 'number',
        description: 'BM25スコア閾値。より負の値が高関連性（デフォルト: -2.0）',
        default: -2.0,
      },
    },
    required: ['query'],
  },
};
