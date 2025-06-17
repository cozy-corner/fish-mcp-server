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

## 日本語検索精度改善 🔧
### 主要課題：5,204件の「日本語名」中、実際の日本語文字は214件のみ
残りの約4,990件はローマ字表記（例：Kibire-nisesuzume、Ami-chô-chô-uo）

### Phase 1: 緊急対応（優先度：高）✅
- [x] SQLエラーの修正（WHERE fs MATCH → WHERE fish_search MATCH）
- [x] SearchServiceのユニットテスト追加とリグレッション防止
- [x] **日本語データの問題に対処**
  - 現状：「サバ」「イワシ」「タイ」など基本的な魚名が検索できない
  - 原因：ローマ字表記のため日本語検索でヒットしない
- [x] **ローマ字表記の日本語名を検索可能にする**
  - カタカナ→ローマ字変換機能の実装（wanakanaライブラリ使用）
  - 検索時の自動変換による検索範囲拡大

### Phase 2: 検索精度向上（優先度：中）
- [x] **searchFishByNameの責務明確化**
  - コメント・説明文検索を削除（特徴検索は新規実装するsearchFishByNaturalLanguageの責務）
  - 名前検索（日本語名、英語名、学名）に特化
  - 現在の検索優先順位（完全一致→部分一致→FTS5）は適切なため維持
- [x] **未使用のremarksフィールドを削除**
  - schema.sqlからremarksカラム削除
  - FTS5のfish_searchテーブルからremarksフィールド削除
  - data-loader.tsからRemarksマッピング削除（Parquetには存在しない）
  - Fish型定義からremarksフィールド削除
- [x] **searchFishByNaturalLanguage関数の新規実装（Phase 1: 基本機能）**
  - SearchServiceにsearchFishByNaturalLanguageメソッド追加
  - FTS5を使用してcommentsフィールドを直接全文検索
  - 基本的な自然言語クエリをサポート
  - MCPツール「search_fish_by_natural_language」として公開
- [ ] **searchFishByNaturalLanguage機能拡張（Phase 2: スコアリング）**
  - FTS5のrank/bm25スコアリングを使用して関連性順にソート
  - 低スコアの結果をフィルタリングして検索精度を向上
  - スコア閾値の実装と調整
- [ ] **searchFishByNaturalLanguage完成（Phase 3: テストと最適化）**
  - 自然言語検索のテストケース作成
  - 統合テストの実装
  - スコア閾値の最適化
  - パフォーマンス検証
- [ ] **検索精度向上のためのテストケース作成**
  - より網羅的な日本語検索テスト
  - ローマ字検索のテストカバレッジ拡大
  - 自然言語検索のテストケース追加
- [x] **検索インタフェースの明確化**
  - 受け付け可能な文字種（カタカナ、ひらがな、ローマ字）を型定義で明示
  - 漢字対応の制限事項をドキュメント化
  - JSDocコメントで入力制約を明記

### Phase 3: データ品質改善（優先度：低）
- [ ] 日本語魚名データの品質改善（「マグロ」→「Genus Sp」問題）
  - 現状：「マグロ」「まぐろ」「鮪」が全て不完全なレコード（Genus Sp）にマッピング
  - 目標：実際のマグロ種（Thunnus属）との適切な関連付け
  - 対策案：
    - [ ] 日本語→英語名マッピングテーブルの作成
    - [ ] FishBaseからより完全な多言語データの取得
    - [ ] 検索時の関連語展開機能（「マグロ」→「tuna」も検索）
