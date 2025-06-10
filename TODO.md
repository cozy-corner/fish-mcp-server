# TODO

## 技術検証（完了） ✅
- [x] FishBase S3 APIからParquetファイルをダウンロード
- [x] comnames.parquetの日本語データ確認
- [x] species.parquetのデータ構造確認
- [x] Parquetファイルの読み込み方法検証

## 環境構築（完了） ✅
- [x] TypeScriptプロジェクト初期化
- [x] @anthropic-ai/sdk インストール
- [x] @modelcontextprotocol/sdk インストール
- [x] Parquet読み込みライブラリ選定・インストール
- [x] 基本ディレクトリ構造作成

## SQLite + Virtual Table実装（完了） ✅
- [x] SQLiteデータベース設計（Virtual Table含む）
- [x] better-sqlite3のインストール
- [x] Parquet→SQLite変換処理の実装
- [x] FTS5による日本語全文検索機能の実装
- [x] 特徴検索機能の実装（SQLクエリ）

## MCPサーバー実装（ほぼ完了） 🚧
- [x] MCPサーバーの基本構造実装
- [x] search_fish_by_nameツールの実装（自然言語対応）
- [x] search_fish_by_featuresツールの実装
- [x] エラーハンドリングとログ機能
- [x] サンプルデータ読み込みスクリプト
- [x] MCPプロトコル完全準拠
- [ ] 画像取得機能の実装（外部API）

## テスト（ほぼ完了） 🚧
- [x] 「マグロ」での検索テスト
- [x] 「大きくて危険な魚」での全文検索テスト
- [x] 特徴による複合検索テスト
- [x] 存在しない魚名でのエラーテスト
- [x] MCPプロトコル統合テスト
- [x] ツール一覧取得テスト
- [x] 日本語・英語名前検索テスト
- [ ] 画像取得失敗時のフォールバックテスト

## データ読み込み 📦
- [x] サンプルデータ（4魚種）
- [ ] FishBase全データ読み込み（約34,000種）

## ドキュメント 📝
- [ ] README.md作成

## 追加実装項目 💡
- [ ] searchFishByFeatures関数のSQL修正（危険性検索エラー対応）
- [ ] searchFishByName関数のSQL修正（特定クエリで "no such column: fs" エラー）
- [ ] 英語名検索の不具合修正（テストデータでは英語名が検索されない）
- [ ] FishBase全データダウンロード・インポート機能
- [ ] 画像検索・表示機能（iNaturalist/Wikipedia API）
- [ ] 検索結果の詳細表示機能
- [ ] パフォーマンス最適化
