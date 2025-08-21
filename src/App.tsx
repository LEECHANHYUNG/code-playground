import "./App.css";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Preview from "./Preview";
import LibraryManager from "./LibraryManager";
import TemplateManager from "./TemplateManager";
import { IntelliSenseDevPanel } from "./components/IntelliSenseDevPanel";

function App() {
  const [code, setCode] =
    useState(`import React from 'react';
import { Button, Card, Input, Text, Flex } from '@vapor-ui/core';

function App() {
  const [inputValue, setInputValue] = React.useState('');

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Card variant="elevated" p={6}>
        <Flex direction="column" spacing={4}>
          <Text fontSize="2xl" fontWeight="bold">
            Welcome to Code Playground!
          </Text>
          
          <Text color="gray.600">
            Try typing JSX components below and see the autocomplete in action:
          </Text>
          
          <Input 
            placeholder="Type something here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          
          <Button 
            variant="solid" 
            colorScheme="blue" 
            onClick={() => alert(\`Hello! You typed: \${inputValue}\`)}
          >
            Click me!
          </Button>
          
          {/* Try typing '<B' here and see Button autocomplete */}
          {/* Try typing '<C' here and see Card autocomplete */}
          {/* Try typing '<I' here and see Input autocomplete */}
          
        </Flex>
      </Card>
    </div>
  );
}

export default App;`);

  const [libs, setLibs] = useState<string[]>([]);
  const [showDevPanel, setShowDevPanel] = useState(false);

  const handleLibraryAdded = (pkg: string) => {
    setLibs((prev) => [...prev, pkg]);
  };

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

      {/* Enhanced TypeScript IntelliSense Developer Tools */}
      <IntelliSenseDevPanel
        isVisible={showDevPanel}
        onToggle={() => setShowDevPanel(!showDevPanel)}
      />
    </div>
  );
}

export default App;
