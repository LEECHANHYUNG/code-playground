import "./App.css";
import { useState, useEffect } from "react";
import CodeEditor from "./CodeEditor";
import Preview from "./Preview";
import LibraryManager from "./LibraryManager";
import TemplateManager from "./TemplateManager";
import { getMonacoInstance } from "./monacoInstance";
import { fetchAndAddTypes } from "./utils/typeFetcher";

function App() {
  const [code, setCode] =
    useState(`import { Button, Card } from '@vapor-ui/core';

function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <Card.Root>
        <Card.Body>
          <h1>Welcome to Code Playground!</h1>
          <p>Edit this code to see changes in real-time with Vapor UI components!</p>
          <Button onClick={() => alert('Hello Vapor UI!')}>
            Click me!
          </Button>
        </Card.Body>
      </Card.Root>
    </div>
  );
}`);

  const [libs, setLibs] = useState<string[]>([]);

  const handleLibraryAdded = (pkg: string) => {
    setLibs((prev) => [...prev, pkg]);
  };

  // Auto-scan code for bare module specifiers and fetch their types
  useEffect(() => {
    const monaco = getMonacoInstance();
    if (!monaco) return;

    const regex = /from ['"]([^./][^'";]+)['"]/g; // matches bare specs not starting with ./ ../ /
    const found: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(code))) {
      const spec = m[1];
      if (!libs.includes(spec) && !found.includes(spec)) {
        found.push(spec);
      }
    }
    if (found.length === 0) return;

    // Add to libs immediately so preview import map is updated regardless of typing fetch outcome
    setLibs((prev) => [...prev, ...found.filter((s) => !prev.includes(s))]);

    (async () => {
      for (const spec of found) {
        try {
          await fetchAndAddTypes(spec, monaco);
        } catch {
          // ignore fetch/type failures
        }
      }
    })();
  }, [code, libs]);

  return (
    <div className="app-container">
      <header className="header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Code Playground</h1>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <LibraryManager onLibraryAdded={handleLibraryAdded} />
            <TemplateManager onTemplateSelected={setCode} />
          </div>
        </div>
      </header>
      <main className="main">
        <aside className="editor-pane">
          <CodeEditor
            code={code}
            onChange={(value: string | undefined) => setCode(value || "")}
          />
        </aside>
        <section className="preview-pane">
          <Preview code={code} extraLibs={libs} />
        </section>
      </main>
    </div>
  );
}

export default App;
