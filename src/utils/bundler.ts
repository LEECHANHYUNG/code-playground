import * as esbuild from "esbuild-wasm";

let initialized = false;

/**
 * Transpile TypeScript / TSX (including JSX) to plain JavaScript (ESM) in the browser
 */
export const bundle = async (rawCode: string): Promise<string> => {
  if (!initialized) {
    await esbuild.initialize({
      // Remote WASM binary that can be fetched in the browser at runtime
      wasmURL: "https://unpkg.com/esbuild-wasm@0.25.5/esbuild.wasm",
      worker: true,
    });
    initialized = true;
  }

  const result = await esbuild.transform(rawCode, {
    loader: "tsx",
    jsx: "automatic",
    format: "esm",
    target: "es2015",
  });

  return result.code;
};
