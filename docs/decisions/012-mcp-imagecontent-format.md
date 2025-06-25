# ADR-012: MCP ImageContent形式の採用

## Status
Accepted

## Context
画像データをMCPサーバーから返す際、大量のトークンを消費する問題が発生していました。当初、Base64エンコードされた画像データをテキスト内に埋め込んで返していましたが、1枚の画像で数千〜数万トークンを消費することが判明しました。

### 問題点
1. Base64文字列をテキストとして返すと、Claude Desktopがその全文字をトークンとして処理
2. 320x240pxにリサイズした画像でも約10KBのBase64データ = 約2,500トークン
3. 複数の画像を返すと簡単にトークン上限に達する

### 検討した選択肢
1. **テキスト内Base64埋め込み（従来方式）**
   - 利点：Claudeが画像データに直接アクセス可能
   - 欠点：大量のトークン消費

2. **URL形式のみ**
   - 利点：軽量
   - 欠点：Claude Desktopで画像が表示されない

3. **MCP ImageContent形式**
   - 利点：画像専用のコンテンツタイプとして処理
   - 欠点：Claudeが画像データの中身にアクセスできない

## Decision
MCP仕様で定義されているImageContent形式を採用します。

```typescript
{
  type: 'image',
  data: base64String,  // data:プレフィックスなし
  mimeType: 'image/jpeg'
}
```

### MCP仕様の参照
- MCP SDK 型定義: `node_modules/@modelcontextprotocol/sdk/dist/esm/types.d.ts`
- ImageContentSchemaの定義が含まれている（2025年6月25日時点）
- 公式仕様書での明確な記載は未確認

MCP SDKの型定義において、`ImageContentSchema`は以下のように定義されています：
```typescript
export declare const ImageContentSchema: z.ZodObject<{
    type: z.ZodLiteral<"image">;
    data: z.ZodString;      // Base64エンコードされた画像データ
    mimeType: z.ZodString;  // 画像のMIMEタイプ
}>
```

### 実装の詳細
1. パラメータ名を`includeImagesAsBase64`から`includeImageContent`に変更
2. 画像データをテキストとは別のコンテンツオブジェクトとして返す
3. data URLプレフィックスは含めない（純粋なBase64データのみ）

## Consequences

### 良い結果
1. **トークン消費の削減**
   - 画像データがテキストトークンとしてカウントされない可能性
   - Claude Desktopが画像を適切に処理

2. **MCP仕様準拠**
   - 標準的な方法で画像を扱える
   - 将来的な互換性の確保

3. **表示品質の向上**
   - Claude Desktopが`<output_image>`タグとして適切に表示

### 悪い結果
1. **Claudeによる画像データアクセス不可**
   - HTMLアーティファクトなどで画像を使用する場合、Base64データにアクセスできない
   - 画像の内容をプログラム的に処理できない

2. **用途の制限**
   - 画像表示専用となり、データとしての活用が困難

### 緩和策
- 画像リサイズ（320x240px、JPEG品質60%）は継続し、もしImageContent形式でもトークンがカウントされる場合の対策とする
- 将来的に、用途に応じて複数の形式を選択できるようにすることを検討

## Notes
- 2025年6月25日時点で、ImageContent形式がClaude Desktopでどのように処理されるかは完全には明確でない
- トークン削減効果については実運用での検証が必要
- パラメータ構造（`includeImages`と`includeImageContent`の2つ）は将来的に見直しの余地あり