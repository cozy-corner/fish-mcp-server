// Test file to verify pre-commit hook works
import wasmInit from 'parquet-wasm/esm';

export async function testHook(): Promise<void> {
  console.log('Testing pre-commit hook with parquet-wasm import');
  await wasmInit();
}
