# TODO

## 技術検証 ✅
- [x] FishBase S3 APIからParquetファイルをダウンロード
- [x] comnames.parquetの日本語データ確認
- [x] species.parquetのデータ構造確認
- [x] Parquetファイルの読み込み方法検証

## 環境構築 ✅
- [x] TypeScriptプロジェクト初期化
- [x] @anthropic-ai/sdk インストール
- [x] @modelcontextprotocol/sdk インストール
- [x] Parquet読み込みライブラリ選定・インストール
- [x] 基本ディレクトリ構造作成

## SQLite + Virtual Table実装 ✅
- [x] SQLiteデータベース設計（Virtual Table含む）
- [x] better-sqlite3のインストール
- [x] Parquet→SQLite変換処理の実装
- [x] FTS5による日本語全文検索機能の実装
- [x] 特徴検索機能の実装（SQLクエリ）

## MCPサーバー実装 ✅
- [x] MCPサーバーの基本構造実装
- [x] search_fish_by_nameツールの実装（自然言語対応）
- [x] search_fish_by_featuresツールの実装
- [x] エラーハンドリングとログ機能
- [x] サンプルデータ読み込みスクリプト
- [x] MCPプロトコル完全準拠
- [x] Claude Desktop MCP統合完了
- [x] JSON-RPC通信問題解決（console出力除去）
- [x] 絶対パス対応（Claude Desktop環境）

## 画像取得API実装 ✅
### Phase 1（MVP - 優先度：高）
- [x] Fish型定義にimages配列フィールドを追加
- [x] ImageServiceクラスの作成（iNaturalist API連携）
- [x] SearchServiceにImageService統合
- [x] MCPツールの戻り値に画像情報追加
- [x] includeImagesパラメータ追加（オプショナル画像取得）

### Phase 1.5（安定性向上 - 優先度：中）
- [x] 画像取得機能の統合テスト作成（test-image-integration.ts）
- [ ] 画像取得機能の単体テスト作成

### Phase 2（拡張機能 - 優先度：低）
- [ ] 画像URLキャッシュ用のデータベーステーブル追加
- [ ] Wikipedia APIをセカンダリソースとして実装
- [ ] 環境変数でAPI選択を設定可能にする

## テスト ✅
- [x] 「マグロ」での検索テスト
- [x] 「大きくて危険な魚」での全文検索テスト
- [x] 特徴による複合検索テスト
- [x] 存在しない魚名でのエラーテスト
- [x] MCPプロトコル統合テスト
- [x] ツール一覧取得テスト
- [x] 日本語・英語名前検索テスト
- [x] Claude Desktop 実機動作確認（MCP統合）
- [x] 画像付き検索テスト（includeImages: true）

## データ読み込み 📦
- [x] サンプルデータ（4魚種）
- [x] FishBase全データ読み込み（35,731魚種 + 5,204日本語名）

## ドキュメント 📝
- [x] README.md作成

## 追加実装項目 💡
- [x] searchFishByFeatures関数のSQL修正（危険性検索エラー対応）
- [x] searchFishByName関数のSQL修正（特定クエリで "no such column: fs" エラー）  
- [x] 英語名検索の不具合修正（テストデータでは英語名が検索されない）
- [x] FishBase全データダウンロード・インポート機能
- [ ] 検索結果の詳細表示機能  
- [ ] パフォーマンス最適化

## データ品質改善 🔧
- [ ] 日本語魚名データの品質改善（「マグロ」→「Genus Sp」問題）
  - 現状：「マグロ」「まぐろ」「鮪」が全て不完全なレコード（Genus Sp）にマッピング
  - 目標：実際のマグロ種（Thunnus属）との適切な関連付け
  - 対策案：
    - [ ] 日本語→英語名マッピングテーブルの作成
    - [ ] FishBaseからより完全な多言語データの取得
    - [ ] 検索時の関連語展開機能（「マグロ」→「tuna」も検索）