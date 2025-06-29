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
      onMount={async (_, monaco) => {
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
