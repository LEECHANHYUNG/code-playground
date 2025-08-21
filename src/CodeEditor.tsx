import Editor from "@monaco-editor/react";
import { setMonacoInstance } from "./monacoInstance";

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      defaultPath="index.tsx"
      theme="vs-dark"
      value={code}
      onChange={onChange}
      onMount={async (_, monaco) => {
        setMonacoInstance(monaco);

        // Configure compiler options for TypeScript in the browser
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ESNext,
          module: monaco.languages.typescript.ModuleKind.ESNext,
          moduleResolution:
            monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
          jsxImportSource: "react",
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          resolvePackageJsonExports: true,
          allowNonTsExtensions: true,
          skipLibCheck: true,
          strict: false, // Less strict to avoid issues with external types
          noImplicitAny: false,
        });

        // Set diagnostics options to be more lenient
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          noSuggestionDiagnostics: false,
        });

        // Add React JSX runtime types
        try {
          // Load basic React types first
          console.log("Loading React base types...");
          const reactTypesResponse = await fetch("https://esm.sh/react?dts");
          const reactTypes = await reactTypesResponse.text();
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            reactTypes,
            "file:///node_modules/@types/react/index.d.ts"
          );

          const reactDomTypesResponse = await fetch(
            "https://esm.sh/react-dom?dts"
          );
          const reactDomTypes = await reactDomTypesResponse.text();
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            reactDomTypes,
            "file:///node_modules/@types/react-dom/index.d.ts"
          );

          // Add comprehensive JSX runtime types
          const jsxRuntimeTypes = `
declare module 'react/jsx-runtime' {
  import { ReactElement, ReactNode } from 'react';
  
  export function jsx(
    type: any,
    props: any,
    key?: string | number | null
  ): ReactElement;
  
  export function jsxs(
    type: any,
    props: any,
    key?: string | number | null
  ): ReactElement;
  
  export { Fragment } from 'react';
}

declare module 'react/jsx-dev-runtime' {
  export * from 'react/jsx-runtime';
}
`;
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            jsxRuntimeTypes,
            "file:///node_modules/@types/react/jsx-runtime.d.ts"
          );

          // Pre-load common UI library types
          console.log("Pre-loading common library types...");

          // Use dynamic imports to avoid circular dependency
          const { fetchAndAddTypes } = await import("./utils/typeFetcher");
          const { ModuleResolver } = await import("./utils/moduleResolver");

          // Create module resolver
          const resolver = new ModuleResolver(monaco);

          // Register ambient modules first for immediate intellisense
          resolver.registerAmbientModules();

          // Then fetch real types
          const commonLibs = ["@vapor-ui/core", "@radix-ui/react-switch"];

          for (const lib of commonLibs) {
            try {
              await fetchAndAddTypes(lib, monaco);
              console.log(`Successfully loaded types for ${lib}`);
            } catch (error) {
              console.warn(`Failed to load types for ${lib}:`, error);
              // Fallback to ambient declaration if real types fail
              const fallback = resolver.createAmbientDeclaration(lib);
              resolver.registerModule(lib, fallback);
            }
          }

          console.log("Type loading completed!");
        } catch (error) {
          console.warn("Failed to load React types:", error);
        }

        // Use a module worker via MonacoEnvironment override because customWorkerPath expects classic workers.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - extend global
        self.MonacoEnvironment = {
          getWorker(_: string, label: string) {
            if (label === "typescript" || label === "javascript") {
              return new Worker(
                new URL(
                  "./service/custom-typescript-language-server.ts",
                  import.meta.url
                ),
                { type: "module" }
              );
            }
            return new Worker(
              new URL(
                "monaco-editor/esm/vs/editor/editor.worker.js",
                import.meta.url
              ),
              { type: "module" }
            );
          },
        } as any;
      }}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: "on",
      }}
    />
  );
};

export default CodeEditor;
