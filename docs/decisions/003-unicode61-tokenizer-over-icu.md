# ADR-003: Unicode61 tokenizer vs ICU tokenizer for FTS5

## 状況

FTS5 Virtual Tableで日本語と英語の全文検索を実装する際、tokenizerの選択が必要となった：

1. **ICU tokenizer**: 高度な言語固有処理
2. **Unicode61 tokenizer**: SQLite標準の基本的なUnicode処理

## 決定

**Unicode61 tokenizer**（`tokenize='unicode61 remove_diacritics 1'`）を採用する。

## 理由

### 環境依存性とポータビリティ

| 項目 | ICU | Unicode61 |
|------|-----|-----------|
| 外部依存 | ICUライブラリ必須 | なし（SQLite標準） |
| 動作保証 | 環境によって失敗する可能性 | 全環境で動作 |
| セットアップ | 複雑（ICU付きSQLite必要） | 簡単 |

### 実装例での比較

```sql
-- ICU（理想的だが環境依存）
CREATE VIRTUAL TABLE fish_search USING fts5(
  ...,
  tokenize='icu'  -- ICUライブラリが必要
);

-- Unicode61（確実に動作）
CREATE VIRTUAL TABLE fish_search USING fts5(
  ...,
  tokenize='unicode61 remove_diacritics 1'  -- SQLite標準
);
```

### MVPでの優先順位

1. **確実な動作**: どの環境でも失敗しない
2. **簡単なセットアップ**: 開発者が簡単に試せる
3. **日本語対応**: 基本的な日本語検索が可能

### Unicode61の日本語対応能力

```
検索例:
- 「マグロ」→ 「マグロ」「まぐろ」「鮪」にマッチ（文字レベル）
- 「大きい魚」→ 「大きい」「魚」に分割して検索

制限:
- 形態素解析なし（ICUの方が精度高い）
- 単語境界の認識が限定的
```

## 影響

### 正の影響
- 環境依存リスクの排除
- セットアップの簡素化
- 開発・デプロイの安定性向上
- 基本的な日本語検索は十分機能

### 負の影響
- ICUと比較して日本語検索精度が劣る
- 高度な形態素解析機能なし

## 将来の移行パス

本格運用時の検討事項：
1. 検索精度の要件確認
2. 運用環境でのICU利用可能性調査
3. 必要に応じてICUへの移行

## 補足

この決定はMVPフェーズでの安定性を重視したもの。検索機能の要求が高度になった場合は、ICU tokenizer への移行を検討する。