# ADR-008: Base64画像サポートのパラメータ設計

## 状況

Claude DesktopでURL形式の画像リンクが表示できない問題が発生している。Base64形式なら画像表示が可能であることを確認済み。既存の`includeImages`パラメータとの互換性を保ちつつ、Base64形式での画像取得機能を追加する必要がある。

### 検討したアプローチ

1. **アプローチ1: imageFormatパラメータ**
   ```typescript
   imageFormat: 'url' | 'base64' | 'both'
   ```

2. **アプローチ2: includeImagesAsBase64フラグ**
   ```typescript
   includeImages: boolean
   includeImagesAsBase64: boolean
   ```

## 決定

**アプローチ2（includeImagesAsBase64フラグ）を採用する。**

```typescript
// 既存パラメータ
includeImages: {
  type: 'boolean',
  description: '画像情報を含めるかどうか（デフォルト: false）',
  default: false,
},

// 新規パラメータ
includeImagesAsBase64: {
  type: 'boolean',
  description: 'Base64形式で画像を含める（デフォルト: false）',
  default: false,
}
```

## 理由

### 1. 後方互換性の完全保証

```typescript
// 既存の利用方法が変更なく動作
{ includeImages: true }  // URL形式（従来通り）

// 新機能の利用
{ includeImagesAsBase64: true }  // Base64形式
{ includeImages: true, includeImagesAsBase64: true }  // 両方
```

### 2. シンプルで直感的なAPI

- boolean型は理解しやすい
- パラメータの意図が明確
- 実装の複雑性が低い
- エラーパターンが少ない

### 3. 段階的な移行が可能

1. Phase 1: includeImagesAsBase64を追加（既存機能に影響なし）
2. Phase 2: ユーザーが徐々に新パラメータを利用開始
3. Phase 3: 必要に応じて将来的に統合を検討

### 4. 実装の簡潔性

```typescript
if (options.includeImages || options.includeImagesAsBase64) {
  const images = await this.imageService.getImagesForFish(
    fish.scientificName,
    options.includeImagesAsBase64  // Base64が必要かどうか
  );
}
```

## 代替案の検討

### アプローチ1の問題点

1. **既存APIとの整合性**
   - `includeImages: true`の挙動をどうするか不明確
   - enumとbooleanの混在による複雑性

2. **実装の複雑さ**
   - パラメータ間の依存関係管理が必要
   - バリデーションロジックが複雑化

### ハイブリッドアプローチの検討

```typescript
includeImages: boolean | { format: 'url' | 'base64' | 'both' }
```

- 柔軟性は高いが、型の複雑さがデメリット
- MCPツール定義での表現が困難

## 結果

### メリット

1. ✅ 既存のコードベースへの影響が最小限
2. ✅ 明確で予測可能な動作
3. ✅ テストケースがシンプル
4. ✅ ドキュメント化が容易

### デメリット

1. ❌ パラメータ数の増加
2. ❌ 将来的な画像形式追加時に新フラグが必要

### 使用例

```typescript
// URL形式のみ（従来通り）
await searchFishByName("マグロ", { 
  includeImages: true 
});

// Base64形式のみ
await searchFishByName("マグロ", { 
  includeImagesAsBase64: true 
});

// 両方含める
await searchFishByName("マグロ", { 
  includeImages: true,
  includeImagesAsBase64: true 
});
```

## 今後の考慮事項

1. **パフォーマンス最適化**: Base64変換のキャッシュ戦略（LRU、100MB、50画像）
2. **エラーハンドリング**: Base64変換失敗時はURLのみ返す
3. **将来の統合**: 利用状況を見て、より洗練されたAPIへの移行を検討

---

*この決定により、既存機能を維持しつつ、Claude Desktopでの画像表示問題を解決する実用的なソリューションを提供する。*