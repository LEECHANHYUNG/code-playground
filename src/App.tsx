import "./App.css";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Preview from "./Preview";

function App() {
  const [code, setCode] = useState(`import {createRoot} from 'react-dom/client';

function App() {
    return <div>Hellow World!</div>
}

createRoot(document.getElementById('root')).render(<App />)`);

  return (
    <div className="app-container">
      <header className="header">Code Playground</header>
      <main className="main">
        <aside className="editor-pane">
          <CodeEditor
            code={code}
            onChange={(value: string | undefined) => setCode(value || "")}
          />
        </aside>
        <section className="preview-pane">
          <Preview code={code} />
        </section>
      </main>
    </div>
  );
}

export default App;
