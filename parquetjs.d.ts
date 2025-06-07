declare module 'parquetjs' {
  export interface ParquetCursor {
    next(): Promise<Record<string, unknown> | null>;
  }

  export interface ParquetReader {
    getCursor(): ParquetCursor;
    close(): Promise<void>;
  }

  export interface ParquetReaderStatic {
    openBuffer(buffer: Buffer): Promise<ParquetReader>;
  }

  export const ParquetReader: ParquetReaderStatic;
}
