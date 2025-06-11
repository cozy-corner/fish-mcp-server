declare module 'parquet-wasm/esm' {
  export interface Table {
    intoIPCStream(): Uint8Array;
    intoFFI(): any;
    numBatches(): number;
    getArrayMemorySize(): number;
  }

  export function readParquet(data: Uint8Array, options?: any): Table;
  
  export default function wasmInit(input?: any): Promise<void>;
}