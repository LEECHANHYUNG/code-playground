import React from "react";

interface Template {
  name: string;
  description: string;
  code: string;
}

const templates: Template[] = [
  {
    name: "Simple Component",
    description: "Basic React component with styling",
    code: `function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Hello World!</h1>
      <p>Edit this code to see changes in real-time!</p>
    </div>
  );
}`,
  },
  {
    name: "Interactive Counter",
    description: "Component with state and event handling",
    code: `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Counter: {count}</h1>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          marginRight: '10px'
        }}
      >
        +
      </button>
      <button 
        onClick={() => setCount(count - 1)}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px'
        }}
      >
        -
      </button>
    </div>
  );
}`,
  },
  {
    name: "Vapor UI Components",
    description: "Example using vapor-ui design system",
    code: `import { useState } from 'react';
import { Button, Input, Card, Switch } from '@vapor-ui/core';

function App() {
  const [text, setText] = useState('Hello Vapor UI!');
  const [enabled, setEnabled] = useState(true);

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <Card.Root>
        <Card.Header>
          <Card.Title>Vapor UI Demo</Card.Title>
        </Card.Header>
        <Card.Body>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Text Input:
            </label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter some text..."
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              Enable feature
            </label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p>Current text: <strong>{text}</strong></p>
            <p>Feature is: <strong>{enabled ? 'Enabled' : 'Disabled'}</strong></p>
          </div>
        </Card.Body>
        <Card.Footer>
          <Button onClick={() => setText('Reset!')}>
            Reset Text
          </Button>
        </Card.Footer>
      </Card.Root>
    </div>
  );
}`,
  },
  {
    name: "Full App (with createRoot)",
    description: "Complete app code including React DOM rendering",
    code: `import { createRoot } from 'react-dom/client';
import { useState } from 'react';

function App() {
  const [message, setMessage] = useState('Hello from full app!');

  return (
    <div style={{ padding: '20px' }}>
      <h1>{message}</h1>
      <input 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ padding: '8px', width: '300px' }}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);`,
  },
];

interface TemplateManagerProps {
  onTemplateSelected: (code: string) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  onTemplateSelected,
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <label style={{ color: "#fff", fontSize: "14px", whiteSpace: "nowrap" }}>
        Templates:
      </label>
      <select
        onChange={(e) => {
          const selectedTemplate = templates.find(
            (t) => t.name === e.target.value
          );
          if (selectedTemplate) {
            onTemplateSelected(selectedTemplate.code);
          }
        }}
        style={{
          padding: "6px 10px",
          backgroundColor: "#333",
          color: "#fff",
          border: "1px solid #555",
          borderRadius: "4px",
          fontSize: "14px",
          minWidth: "200px",
        }}
      >
        <option value="">Choose a template...</option>
        {templates.map((template) => (
          <option key={template.name} value={template.name}>
            {template.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TemplateManager;
