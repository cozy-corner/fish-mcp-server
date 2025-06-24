# 11. Image Resize Parameters for Token Optimization

Date: 2025-01-24

## Status

Accepted

## Context

Claude DesktopでBase64エンコードされた画像が大量のトークンを消費する問題が発生。現在の実装では、中品質の画像（800x600程度）をそのままBase64エンコードしているため、1枚あたり30,000トークン以上を消費している。

トークン消費の計算式：
- Base64文字列の長さ ≈ ファイルサイズ × 1.33
- 1トークン ≈ 4文字
- したがって、1KB ≈ 333トークン

要件：
- 1回の応答で50,000トークン程度に抑える
- デフォルトの検索結果は10件
- 各結果に画像1枚を含める
- 1枚あたり4,000トークン以内に抑える

## Decision

以下の画像リサイズパラメータを採用する：

```typescript
private static readonly DEFAULT_MAX_WIDTH = 320;
private static readonly DEFAULT_MAX_HEIGHT = 240;
private static readonly DEFAULT_JPEG_QUALITY = 60;
```

## Consequences

### Positive

- **トークン効率**: 1枚約3,300トークン（目標の4,000トークン以内）
- **総トークン数**: 10枚で約33,000トークン + テキストで合計50,000トークン以内
- **ファイルサイズ**: 平均10KB程度（8-12KB）
- **視認性**: 320×240は魚の識別には十分なサイズ
- **安定性**: 一貫したトークン消費で予測可能

### Negative

- **画質低下**: 元画像と比較して詳細が失われる
- **小さい特徴**: 細かい模様や特徴が見えにくくなる可能性

### Neutral

- **アスペクト比**: 4:3固定（fit: 'inside'で元のアスペクト比は維持）
- **形式**: JPEG固定（他の形式はサポートしない）

## Alternatives Considered

### Option 1: 400×300, 品質70%
- ファイルサイズ: 約20-25KB
- トークン数: 約6,600-8,300トークン/枚
- ❌ 10枚で66,000トークン以上になり、制限を超える可能性

### Option 2: 280×210, 品質70%
- ファイルサイズ: 約10-15KB
- トークン数: 約3,300-5,000トークン/枚
- ❌ 品質70%では一部の画像でサイズが大きくなる

### Option 3: 240×180, 品質50%
- ファイルサイズ: 約5-8KB
- トークン数: 約1,600-2,600トークン/枚
- ❌ 画質が低すぎて魚の識別が困難

## Implementation Notes

```typescript
// 画像リサイズの実装例
const resizedBuffer = await sharp(inputBuffer)
  .resize(320, 240, {
    fit: 'inside',        // アスペクト比を維持
    withoutEnlargement: true  // 拡大はしない
  })
  .jpeg({ 
    quality: 60,
    progressive: false,   // プログレッシブJPEGは使わない（サイズ増加を防ぐ）
    mozjpeg: true        // mozjpegエンコーダーでさらに最適化
  })
  .toBuffer();
```

## Future Considerations

- 将来的にはユーザーが画質とトークン消費のバランスを選択できるオプションを提供
- WebP形式のサポート（さらなるサイズ削減が可能）
- 動的なリサイズ（利用可能なトークン数に基づく調整）