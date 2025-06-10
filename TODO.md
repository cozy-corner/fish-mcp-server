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

## MCPサーバー実装（完了） ✅
- [x] MCPサーバーの基本構造実装
- [x] search_fish_by_nameツールの実装（自然言語対応）
- [x] search_fish_by_featuresツールの実装
- [x] エラーハンドリングとログ機能
- [x] サンプルデータ読み込みスクリプト
- [x] MCPプロトコル完全準拠

## 画像取得API実装 🖼️
### Phase 1（MVP - 優先度：高）
- [ ] Fish型定義にimageUrl、imageAttributionフィールドを追加
- [ ] ImageServiceクラスの作成（iNaturalist API連携）
- [ ] SearchServiceにImageService統合（画像URL取得処理追加）
- [ ] MCPツール（search_fish_by_name、search_fish_by_features）の戻り値に画像情報追加

### Phase 1.5（安定性向上 - 優先度：中）
- [ ] iNaturalist APIのレート制限対応（スロットリング実装）
- [ ] 画像取得エラー時のフォールバック処理実装
- [ ] 画像取得機能の単体テスト作成
- [ ] 画像取得機能の統合テスト作成

### Phase 2（拡張機能 - 優先度：低）
- [ ] 画像URLキャッシュ用のデータベーステーブル追加
- [ ] Wikipedia APIをセカンダリソースとして実装
- [ ] 環境変数でAPI選択を設定可能にする

## テスト（ほぼ完了） 🚧
- [x] 「マグロ」での検索テスト
- [x] 「大きくて危険な魚」での全文検索テスト
- [x] 特徴による複合検索テスト
- [x] 存在しない魚名でのエラーテスト
- [x] MCPプロトコル統合テスト
- [x] ツール一覧取得テスト
- [x] 日本語・英語名前検索テスト

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
- [ ] 検索結果の詳細表示機能
- [ ] パフォーマンス最適化

## 画像取得API技術詳細 📋
### iNaturalist API
- **エンドポイント**: https://api.inaturalist.org/v1/observations
- **認証**: 不要（読み取り専用）
- **レート制限**: 60-100リクエスト/分、推奨1リクエスト/秒
- **検索方法**: 学名（scientific name）で検索
- **取得データ**: 観察記録に含まれる写真URL、ライセンス情報

### 実装方針
1. **基本フロー**: 検索 → 魚情報取得 → 学名でiNaturalist検索 → 画像URL取得
2. **エラー処理**: API失敗時はimageUrl: null を返却
3. **フィールド追加**: Fish型にimageUrl（画像URL）とimageAttribution（著作権表示）を追加
