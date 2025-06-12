# Fish MCP Server

日本語対応の魚類検索MCPサーバー - FishBaseデータベースを使用した魚類情報検索システム

## 概要

Fish MCP Serverは、[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)を使用してClaude Desktopに魚類検索機能を提供するサーバーです。FishBaseの35,000種以上の魚類データと5,000種以上の日本語名データを使用し、日本語・英語の自然言語検索に対応しています。

## 主な機能

- **多言語検索**: 日本語（ひらがな、カタカナ、漢字）と英語での魚名検索
- **全文検索**: SQLite FTS5による高速な日本語全文検索
- **特徴検索**: サイズ、生息地、危険性などの条件による検索
- **画像取得**: iNaturalist APIによる魚類画像の自動取得
- **大規模データ**: FishBaseから取得した35,731魚種 + 81,808の名前データ

## 必要要件

- Node.js 18.0.0以上
- npm または yarn
- Claude Desktop

## インストール

### 1. プロジェクトのクローンとセットアップ

```bash
git clone <repository-url>
cd fish-mcp-server
npm install
```

### 2. TypeScriptのビルド

```bash
npm run build
```

### 3. データベースの準備

#### サンプルデータの読み込み（テスト用）
```bash
npm run load-sample-data
```

#### 完全なFishBaseデータの読み込み（本格運用用）
```bash
npm run load-data
```

### 4. Claude Desktop設定

Claude Desktopの設定ファイル（`~/.config/claude/claude_desktop_config.json` または `~/Library/Application Support/Claude/claude_desktop_config.json`）に以下を追加：

```json
{
  "mcpServers": {
    "fish-mcp-server": {
      "command": "node",
      "args": ["/path/to/fish-mcp-server/dist/index.js"],
      "cwd": "/path/to/fish-mcp-server"
    }
  }
}
```

**注意**: `/path/to/fish-mcp-server`は実際のプロジェクトパスに置き換えてください。

### 5. Claude Desktopの再起動

設定変更後、Claude Desktopを再起動してMCPサーバーを読み込みます。

## 使用方法

Claude Desktopで以下のような質問ができます：

### 魚名検索の例

```
マグロについて教えて
```

```
tunaを検索して
```

```
あじの仲間を探して
```

### 特徴検索の例

```
大きくて危険な海水魚を教えて
```

```
30cm以下の淡水魚はどんな種類がいますか？
```

```
深海魚を5種類教えて
```

### 画像付き検索の例

```
クマノミの写真も含めて検索して
```

## 利用可能なツール

### `search_fish_by_name`
魚の名前（日本語または英語）から魚を検索します。

**パラメータ:**
- `query` (必須): 検索する魚の名前
- `limit` (オプション): 検索結果の最大件数（デフォルト: 10）
- `includeImages` (オプション): 画像情報を含めるか（デフォルト: false）

### `search_fish_by_features`
魚の特徴から魚を検索します。

**パラメータ:**
- `minLength` (オプション): 最小サイズ（cm）
- `maxLength` (オプション): 最大サイズ（cm）
- `dangerous` (オプション): 危険な魚のみ検索
- `saltwater` (オプション): 海水魚のみ検索
- `deepwater` (オプション): 深海魚のみ検索
- `commercial` (オプション): 商業的に重要な魚のみ検索
- `limit` (オプション): 検索結果の最大件数（デフォルト: 20）
- `includeImages` (オプション): 画像情報を含めるか（デフォルト: false）

## 開発

### 開発用スクリプト

```bash
# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# テスト実行
npm run test-search
npm run test-fts5
npm run test-improved

# リント・フォーマット
npm run lint
npm run format
npm run check-all  # 開発時のチェック
npm run check-ci   # CI用の厳密チェック
```

### テスト

```bash
# データベース状態確認
npx tsx tests/test-db-status.ts

# 検索機能テスト
npx tsx tests/test-search.ts

# FTS5機能テスト
npx tsx tests/test-fts5-simple.ts
```

### データ管理

```bash
# サンプルデータ読み込み
npm run load-sample-data

# FishBase全データ読み込み
npm run load-data
```

## データソース

- **FishBase**: 世界最大の魚類データベース
  - 種別データ: 35,731種
  - 名前データ: 81,808件（日本語5,204件、英語76,604件）
- **iNaturalist API**: 魚類画像の取得

## 技術スタック

- **言語**: TypeScript
- **ランタイム**: Node.js
- **データベース**: SQLite + FTS5
- **プロトコル**: Model Context Protocol (MCP)
- **フレームワーク**: @modelcontextprotocol/sdk
- **データ処理**: parquet-wasm, apache-arrow
- **画像API**: iNaturalist API

## アーキテクチャ

```
src/
├── index.ts              # エントリーポイント
├── mcp/
│   ├── server.ts         # MCPサーバー実装
│   └── tools.ts          # MCP ツール定義
├── database/
│   ├── db-manager.ts     # データベース管理
│   ├── data-importer.ts  # データ読み込み
│   └── schema.sql        # データベーススキーマ
├── services/
│   ├── search-service.ts # 検索ロジック
│   ├── data-loader.ts    # FishBaseデータ読み込み
│   └── image-service.ts  # 画像取得サービス
└── types/               # 型定義
```

## トラブルシューティング

### MCP サーバーが読み込まれない

1. Claude Desktopのログを確認:
   ```bash
   tail -f ~/Library/Logs/Claude/mcp.log
   ```

2. パスが正しいか確認:
   ```bash
   ls -la /path/to/fish-mcp-server/dist/index.js
   ```

3. ビルドが正常に完了しているか確認:
   ```bash
   npm run build
   ```

### 検索結果が少ない・見つからない

1. データベースの状態確認:
   ```bash
   npx tsx tests/test-db-status.ts
   ```

2. FTS5インデックスの再構築:
   ```bash
   # データベースファイルを削除して再構築
   rm fish.db
   npm run load-data
   ```

### 画像が取得できない

- iNaturalist APIの制限により、一部の魚種では画像が取得できない場合があります
- 学名が不正確な場合、画像検索に失敗することがあります

## ライセンス

ISC License

## 開発者向け情報

### Console出力の禁止

MCP環境では、JSON-RPC通信を妨げるため、`console.log`や`console.error`は使用禁止です。ESLintルールで自動検出されます。

### パス解決

環境依存を避けるため、すべてのファイルパスは`import.meta.url`と`fileURLToPath`を使用した動的解決を行っています。

### Pre-commit フック

Husky + lint-stagedにより、コミット前に自動的にリント・フォーマットが実行されます。