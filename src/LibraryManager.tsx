import { useState } from "react";
import { getMonacoInstance } from "./monacoInstance";
import { fetchAndAddTypes } from "./utils/typeFetcher";

interface LibraryManagerProps {
  onLibraryAdded?: (pkg: string) => void;
}

const LibraryManager: React.FC<LibraryManagerProps> = ({ onLibraryAdded }) => {
  const [input, setInput] = useState("");
  const [libs, setLibs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    const pkg = input.trim();
    if (!pkg || libs.includes(pkg)) return;
    const monaco = getMonacoInstance();
    if (!monaco) {
      setError("Monaco is not initialized yet.");
      return;
    }

    // Add to list immediately for import-map if not present
    if (!libs.includes(pkg)) {
      setLibs([...libs, pkg]);
      onLibraryAdded?.(pkg);
    }

    setLoading(true);
    setError(null);
    try {
      await fetchAndAddTypes(pkg, monaco);
      setInput("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <label style={{ color: "#fff", fontSize: "14px", whiteSpace: "nowrap" }}>
        Add Library:
      </label>
      <div style={{ display: "flex", gap: "4px" }}>
        <input
          placeholder="ex: lodash@latest"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAdd()}
          style={{
            padding: "6px 8px",
            borderRadius: "4px",
            border: "1px solid #555",
            backgroundColor: "#333",
            color: "#fff",
            fontSize: "14px",
            width: "150px",
          }}
        />
        <button
          onClick={handleAdd}
          disabled={loading || !input.trim()}
          style={{
            padding: "6px 12px",
            borderRadius: "4px",
            border: "1px solid #555",
            backgroundColor: loading || !input.trim() ? "#555" : "#0066cc",
            color: "#fff",
            fontSize: "14px",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "..." : "Add"}
        </button>
      </div>
      {error && (
        <div style={{ color: "#ff6b6b", fontSize: "12px", marginLeft: "8px" }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default LibraryManager;
