import type * as monaco from "monaco-editor";

/**
 * Proxy to communicate with the custom TypeScript worker
 */
export class TypeScriptWorkerProxy {
  private worker: monaco.editor.MonacoWebWorker<any> | null = null;
  private monacoInstance: typeof monaco;

  constructor(monacoInstance: typeof monaco) {
    this.monacoInstance = monacoInstance;
  }

  /**
   * Initialize the worker proxy
   */
  async initialize(): Promise<void> {
    if (this.worker) return;

    // Get the TypeScript worker
    this.worker = await this.monacoInstance.editor.createWebWorker({
      moduleId: "vs/language/typescript/tsWorker",
      label: "typescript",
      createData: {
        compilerOptions:
          this.monacoInstance.languages.typescript.typescriptDefaults.getCompilerOptions(),
        extraLibs:
          this.monacoInstance.languages.typescript.typescriptDefaults.getExtraLibs(),
      },
    });
  }

  /**
   * Add extra library to the worker
   */
  async addExtraLib(fileName: string, contents: string): Promise<void> {
    await this.initialize();
    if (!this.worker) return;

    const proxy = await this.worker.getProxy();
    if (proxy && typeof proxy.addExtraLib === "function") {
      await proxy.addExtraLib(fileName, contents);
    }
  }

  /**
   * Dispose of the worker
   */
  dispose(): void {
    if (this.worker) {
      this.worker.dispose();
      this.worker = null;
    }
  }
}
