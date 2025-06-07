# ADR-004: FTS5日本語検索の改善戦略

## 状況

FTS5テストの結果、Unicode61 tokenizerでは以下の問題が判明：

1. **日本語の単語分割が不完全**
   - 「大型」「危険」「深海」などの単語が検索できない
   - 「美しい赤色」のような完全一致のみ動作

2. **現在の動作状況**
   - 英語検索: ✅ 正常（"tuna", "shark"）
   - カタカナ検索: ✅ 正常（「マグロ」）
   - 漢字・ひらがな混在: ❌ 不完全

## 決定

**段階的アプローチ**を採用し、MVPでは現在の実装を維持しつつ、実用的な回避策を実装する。

## 改善戦略

### Phase 1: MVP（現在の実装を活用）

1. **検索戦略の最適化**
   ```sql
   -- 1. 完全一致優先
   SELECT * FROM fish WHERE japanese_names LIKE ?
   
   -- 2. 部分一致
   SELECT * FROM fish WHERE comments LIKE '%' || ? || '%'
   
   -- 3. FTS5フォールバック（英語・カタカナ）
   SELECT * FROM fish_search WHERE fish_search MATCH ?
   ```

2. **検索前処理**
   ```typescript
   // カタカナ変換で検索精度向上
   const katakana = toKatakana(query); // まぐろ → マグロ
   const keywords = extractKeywords(query); // 複合語分解
   ```

### Phase 2: 実装の改良

1. **Trigram検索の追加**
   ```sql
   -- 3文字単位での部分一致インデックス
   CREATE VIRTUAL TABLE fish_trigram USING fts5(
     content,
     tokenize='trigram'
   );
   ```

2. **複数インデックス戦略**
   - Unicode61: 英語・カタカナ用
   - Trigram: 日本語部分一致用
   - 通常のLIKE: フォールバック

### Phase 3: 本格対応（将来）

1. **ICU tokenizer導入**
   - 形態素解析による正確な日本語分割
   - 環境依存の解決が必要

2. **外部サービス連携**
   - MeCab/Kuromoji等の形態素解析器
   - API経由での前処理

## 実装への影響

### 現在のSearchServiceの改善案

```typescript
searchFishByName(query: string): FishWithMatch[] {
  // 1. カタカナ変換
  const katakanaQuery = this.toKatakana(query);
  
  // 2. 完全一致（最優先）
  let results = this.exactMatch(query);
  if (results.length > 0) return results;
  
  // 3. カタカナ完全一致
  results = this.exactMatch(katakanaQuery);
  if (results.length > 0) return results;
  
  // 4. 部分一致（LIKE）
  results = this.partialMatch(query);
  if (results.length > 0) return results;
  
  // 5. FTS5（英語・カタカナ有効）
  results = this.ftsSearch(katakanaQuery);
  if (results.length > 0) return results;
  
  // 6. 英語フォールバック
  return this.englishSearch(query);
}
```

## まとめ

MVPでは現実的なアプローチを取り、段階的に検索精度を向上させる。Unicode61の制限は認識しつつ、実用的な回避策で対応する。