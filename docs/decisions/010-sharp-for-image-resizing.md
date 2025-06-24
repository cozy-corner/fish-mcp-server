# 10. Sharp for Image Resizing

Date: 2025-01-24

## Status

Accepted

## Context

Claude DesktopでBase64画像が大量のトークンを消費する問題が発生している。1回の応答で約50,000トークンに抑える必要があり、画像のリサイズによるトークン削減が必要となった。

Node.jsで利用可能な主要な画像処理ライブラリには以下がある：

1. **Sharp** - libvipsベースの高性能画像処理ライブラリ
2. **Jimp** - Pure JavaScriptの画像処理ライブラリ
3. **Canvas (node-canvas)** - HTML5 Canvas API互換ライブラリ

## Decision

画像リサイズ機能の実装にはSharpを採用する。

## Consequences

### Positive

- **高性能**: libvipsベースで最速の処理速度
- **メモリ効率**: ストリーミング対応で大きな画像でもメモリ効率的
- **豊富な機能**: リサイズ、品質調整、フォーマット変換（WebP対応）
- **トークン削減**: WebP変換により更なるファイルサイズ削減が可能
- **プロダクション実績**: 多くの大規模プロジェクトで採用実績

### Negative

- **ネイティブ依存**: libvipsのネイティブバインディングが必要
- **インストールサイズ**: パッケージサイズが大きい（約40MB）
- **プラットフォーム依存**: 一部の環境でビルドが必要になる可能性

### Neutral

- **学習コスト**: APIは直感的で学習しやすい
- **ドキュメント**: 充実したドキュメントとコミュニティサポート

## Alternatives Considered

### Jimp
- ✅ Pure JavaScript（依存関係なし）
- ❌ 処理速度が遅い
- ❌ メモリ使用量が多い（全画像をメモリに展開）
- ❌ WebP非対応

### Canvas (node-canvas)
- ✅ Canvas API互換で柔軟な描画
- ❌ 画像処理専用ではない
- ❌ Cairo依存でインストールが複雑
- ❌ リサイズ以外の最適化機能が限定的

## Implementation Notes

```typescript
// 使用例
import sharp from 'sharp';

const resizedBuffer = await sharp(inputBuffer)
  .resize(320, 240, {
    fit: 'inside',
    withoutEnlargement: true
  })
  .jpeg({ quality: 60 })
  .toBuffer();
```

トークン削減の目安：
- 元画像: 800x600 JPEG (125KB) → 約41,650トークン
- リサイズ後: 320x240 JPEG 60% (10KB) → 約3,330トークン