# ADR-002: Virtual Table (FTS5) vs 通常のテーブル

## 状況

SQLiteでの検索機能実装において、以下の選択肢があった：

1. **通常のテーブル + LIKE検索**: 標準的なSQL
2. **Virtual Table (FTS5)**: 全文検索専用機能

## 決定

**Virtual Table (FTS5)** を採用する。

## 理由

### 1. 日本語検索の課題

通常のLIKE検索の問題：
```sql
-- 効率が悪い（全テーブルスキャン）
SELECT * FROM fish WHERE description LIKE '%マグロ%'

-- 部分一致の限界
SELECT * FROM fish WHERE name LIKE '%まぐろ%'  -- ひらがな
-- 「マグロ」「鮪」「Maguro」は検索できない
```

FTS5による解決：
```sql
-- 高速検索（専用インデックス）
SELECT * FROM fish_search WHERE fish_search MATCH 'マグロ'

-- 複数条件
SELECT * FROM fish_search WHERE fish_search MATCH '深海 AND 危険'
```

### 2. MCPでの自然言語検索

MCPサーバーでは以下のような検索が必要：

```
ユーザー: 「赤くて小さい熱帯魚」
従来: 複数のLIKE文を組み合わせ（遅い）
FTS5: WHERE fish_search MATCH '赤い 小さい 熱帯'（高速）
```

### 3. 検索機能の比較

| 機能 | 通常のテーブル | FTS5 Virtual Table |
|------|---------------|-------------------|
| 完全一致 | ✅ | ✅ |
| 部分一致 | ✅（遅い） | ✅（高速） |
| 複数語検索 | ❌ 複雑 | ✅ 簡単 |
| 近接検索 | ❌ | ✅ |
| ハイライト | ❌ | ✅ |
| ランキング | ❌ | ✅ |

### 4. 実装例

```sql
-- Virtual Table作成
CREATE VIRTUAL TABLE fish_search USING fts5(
  japanese_name,
  scientific_name, 
  description,
  content='fish',
  content_rowid='id'
);

-- 高度な検索
SELECT f.*, 
       highlight(fs, 2, '<mark>', '</mark>') as highlighted_desc,
       rank
FROM fish f
JOIN fish_search fs ON f.id = fs.rowid
WHERE fish_search MATCH '深海 AND (危険 OR 毒)'
ORDER BY rank;
```

## 影響

### 正の影響
- 高速な日本語全文検索
- 自然言語での複雑な検索が可能
- 検索結果のハイライト表示
- 関連度によるランキング

### 負の影響
- 学習コストが高い
- データサイズの増加（インデックス分）
- 一部のSQL機能に制限

## 実装への影響

- FTS5の有効化確認
- Virtual Table作成処理の追加
- 検索クエリの専用実装
- 日本語トークナイザーの設定