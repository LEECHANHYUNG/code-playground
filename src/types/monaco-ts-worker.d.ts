declare module "monaco-editor/esm/vs/language/typescript/ts.worker.js" {
  export const initialize: (
    /** Factory that must return a worker instance */
    factory: (...args: any[]) => any
  ) => void;

  /** Alias to the embedded TypeScript compiler runtime */
  export const ts: any;

  /** Base worker implementation used by Monaco for TS/JS files */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class TypescriptWorker {
    constructor(...args: any[]);
    // Provided for convenience – we only need a subset, hence the loose typing.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readFile(fileName: string): string | undefined;
    getScriptFileNames(): string[];
    fileExists(fileName: string): boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _getModel(fileName: string): any;
    _getScriptText(fileName: string): string | undefined;
  }
}
