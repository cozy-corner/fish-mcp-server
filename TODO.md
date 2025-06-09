# TODO

## 技術検証（完了）
- [x] FishBase S3 APIからParquetファイルをダウンロード
- [x] comnames.parquetの日本語データ確認
- [x] species.parquetのデータ構造確認
- [x] Parquetファイルの読み込み方法検証

## 環境構築（完了）
- [x] TypeScriptプロジェクト初期化
- [x] @anthropic-ai/sdk インストール
- [x] Parquet読み込みライブラリ選定・インストール
- [x] 基本ディレクトリ構造作成

## SQLite + Virtual Table実装
- [x] SQLiteデータベース設計（Virtual Table含む）
- [x] better-sqlite3のインストール
- [x] Parquet→SQLite変換処理の実装
- [x] FTS5による日本語全文検索機能の実装
- [x] 特徴検索機能の実装（SQLクエリ）

## MCPサーバー実装
- [ ] MCPサーバーの基本構造実装
- [ ] search_fish_by_nameツールの実装（自然言語対応）
- [ ] search_fish_by_featuresツールの実装
- [ ] 画像取得機能の実装（外部API）
- [ ] エラーハンドリングとログ機能

## テスト
- [x] 「マグロ」での検索テスト
- [x] 「大きくて危険な魚」での全文検索テスト
- [x] 特徴による複合検索テスト
- [x] 存在しない魚名でのエラーテスト
- [ ] 画像取得失敗時のフォールバックテスト

## ドキュメント
- [ ] README.md作成
