import Editor from "@monaco-editor/react";

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
      onMount={async (editor, monaco) => {
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
        });

        // Load React & ReactDOM type definitions so the editor recognizes the modules.
        const reactVersion = "18.2.24";
        const reactDomVersion = "18.2.24";

        const addLib = async (url: string, path: string) => {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const text = await res.text();
              monaco.languages.typescript.typescriptDefaults.addExtraLib(
                text,
                path
              );
            }
          } catch {
            // ignore network errors – code will still run, only types missing
          }
        };

        addLib(
          `https://unpkg.com/@types/react@${reactVersion}/index.d.ts`,
          "file:///node_modules/@types/react/index.d.ts"
        );
        addLib(
          `https://unpkg.com/@types/react-dom@${reactDomVersion}/index.d.ts`,
          "file:///node_modules/@types/react-dom/index.d.ts"
        );

        // React 17+ automatic JSX runtime types
        addLib(
          `https://unpkg.com/@types/react@${reactVersion}/jsx-runtime.d.ts`,
          "file:///node_modules/@types/react/jsx-runtime.d.ts"
        );
        addLib(
          `https://unpkg.com/@types/react@${reactVersion}/jsx-dev-runtime.d.ts`,
          "file:///node_modules/@types/react/jsx-dev-runtime.d.ts"
        );

        addLib(
          `https://unpkg.com/@types/react-dom@${reactDomVersion}/client.d.ts`,
          "file:///node_modules/@types/react-dom/client.d.ts"
        );
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
