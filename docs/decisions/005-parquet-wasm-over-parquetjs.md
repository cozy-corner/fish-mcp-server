# ADR 005: parquet-wasm over parquetjs for Large Dataset Processing

## Status
Accepted

## Context
FishBase全データ（約35,000種の魚、330,000の一般名）を読み込む際に、既存のparquetjsライブラリで`Maximum call stack size exceeded`エラーが発生し、データ処理が不可能になった。

### 問題の詳細
- **データ規模**: 35,731種 × 102列、330,105名前 × 35列
- **エラー**: `RangeError: Maximum call stack size exceeded at exports.decodeValues (rle.js:137:14)`
- **原因**: parquetjs 0.11.2のRLEコーデックが大きなrow group（35,000行）を処理する際の再帰実装の制限

### 検討した解決策
1. **Node.jsスタックサイズ増加**: `--stack-size=8192`オプションでも解決せず
2. **Pythonでの変換**: データ一貫性とTypeScript統合性の問題
3. **CSV変換**: parquetの利点（圧縮、型情報、メタデータ）を失う
4. **別のparquetライブラリ**: Apache Arrow JS、parquet-wasm等

## Decision
**parquet-wasm + Apache Arrow**の組み合わせを採用する。

### 選択理由
1. **技術的解決**: WebAssembly（Rust実装）により根本的なスタックオーバーフロー問題を回避
2. **パフォーマンス**: 大量データ処理でのWASMの速度優位性
3. **標準準拠**: Apache Arrowとの統合による将来性
4. **メモリ効率**: WASMメモリ空間での最適化された処理

## Implementation
```typescript
import wasmInit, { readParquet } from 'parquet-wasm/esm';
import { tableFromIPC } from 'apache-arrow';

// 1. WASM初期化（ローカルwasmファイル指定でNode.js対応）
const wasmPath = path.join(process.cwd(), 'node_modules', 'parquet-wasm', 'esm', 'parquet_wasm_bg.wasm');
const wasmBuffer = fs.readFileSync(wasmPath);
await wasmInit(wasmBuffer);

// 2. Parquet読み込み → Arrow変換
const buffer = fs.readFileSync(filePath);
const wasmTable = readParquet(new Uint8Array(buffer));
const arrowTable = tableFromIPC(wasmTable.intoIPCStream());

// 3. JavaScript objects変換（パフォーマンス重視のfor-loop）
// 330,105行 × 35列 = 約1,150万回の操作のため関数型より高速
for (let i = 0; i < arrowTable.numRows; i++) {
  const row: any = {};
  for (let j = 0; j < arrowTable.numCols; j++) {
    const column = arrowTable.getChildAt(j);
    const fieldName = arrowTable.schema.fields[j].name;
    row[fieldName] = column?.get(i);
  }
  rawRows.push(row as T);
}
```

## Results
- **データ処理成功**: 35,731種 + 330,105名前を完全処理
- **フィルタリング**: SQLite CHECK制約に合わせて英語・日本語のみ抽出（81,793レコード）
- **パフォーマンス**: スタックオーバーフロー問題完全解決

## Trade-offs

### Pros
- **根本的解決**: parquetjsの制限を完全回避
- **高パフォーマンス**: WebAssembly実装の速度優位性
- **メモリ効率**: 大量データ処理での最適化
- **将来性**: Apache Arrowエコシステムとの統合

### Cons
- **複雑性増加**: WASM初期化とArrow統合が必要
- **依存関係増**: parquet-wasm + apache-arrow
- **学習コスト**: 新しいAPIの理解が必要
- **バンドルサイズ**: WASMファイルによる増加

## Alternatives Considered

### parquetjs継続
- **Rejected**: 根本的な技術制限により大量データ処理不可

### Apache Arrow JS単体
- **Rejected**: parquetファイル直接読み込み機能不足

### @dsnp/parquetjs (parquetjsフォーク)
- **Rejected**: 同様のRLE問題の可能性、メンテナンス状況不明

### Python変換スクリプト
- **Rejected**: TypeScriptとの一貫性欠如、ダウンロード機能の重複実装

## Consequences
- FishBase全データ（35,000種）の処理が可能になり、本格的な魚検索機能を実現
- WebAssemblyベースの高性能データ処理パイプラインを確立
- 将来的なデータ拡張（SeaLifeBase等）にも対応可能
- モダンなデータ処理技術スタックの採用により技術記事価値も向上

## References
- [parquetjs Issue #110: Maximum call stack size exceeded](https://github.com/ironSource/parquetjs/issues/110)
- [parquet-wasm Documentation](https://kylebarron.dev/parquet-wasm/)
- [Apache Arrow JavaScript](https://arrow.apache.org/docs/js/)