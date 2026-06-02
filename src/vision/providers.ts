/** onnxruntime execution-provider name we use (a subset of ort's `ExecutionProviderName`). */
export type ExecutionProvider = 'webgpu' | 'wasm';

/**
 * Execution providers for the u2netp session, fastest first. WebGPU runs the conv-heavy net
 * on the GPU (several× faster than CPU WASM); `wasm` is always kept as the fallback for
 * Safari/Firefox or when no GPU adapter is available. onnxruntime tries them in order, so a
 * missing/failing WebGPU adapter transparently drops to WASM.
 *
 * Pure (no `navigator`, no ort import) so it stays unit-testable — the caller passes the
 * `'gpu' in navigator` check in.
 */
export function pickExecutionProviders(hasWebGpu: boolean): ExecutionProvider[] {
  return hasWebGpu ? ['webgpu', 'wasm'] : ['wasm'];
}
