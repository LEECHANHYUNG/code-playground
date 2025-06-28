import { useEffect, useRef } from "react";
import { bundle } from "./bundler";

interface PreviewProps {
  code: string;
}

// --- helper: naive import specifier extraction (ignores relative paths) ---
const extractImports = (input: string): string[] => {
  const importRegex = /import[^'"`]*['"`]([^'"`]+)['"`]/g;
  const specifiers = new Set<string>();
  let match;
  while ((match = importRegex.exec(input))) {
    const spec = match[1];
    if (
      !spec.startsWith("./") &&
      !spec.startsWith("../") &&
      !spec.startsWith("/")
    ) {
      specifiers.add(spec);
    }
  }
  return Array.from(specifiers);
};

const buildImportMap = (imports: string[]): string => {
  const map: Record<string, string> = {};
  imports.forEach((spec) => {
    // Use ?bundle so 종속성이 하나의 파일에 번들되어 추가 import가 필요 없음.
    map[spec] = `https://esm.sh/${spec}?bundle`;
    // 그래도 하위 경로 import를 대비해 prefix 매핑 유지
    map[`${spec}/`] = `https://esm.sh/${spec}/`;
  });
  return JSON.stringify({ imports: map }, null, 2);
};

const htmlTemplate = (code: string) => {
  const importMapJSON = buildImportMap(extractImports(code));

  return `<!DOCTYPE html>
  <html>
    <head></head>
    <body>
      <div id="root"></div>
      <script type="importmap">${importMapJSON}</script>
      <script type="module">
        window.addEventListener('error', (e) => {
          document.body.innerHTML = '<pre style="color: red;">' + e.error + '</pre>';
        });

        ${code}
      </script>
    </body>
  </html>`;
};

const Preview: React.FC<PreviewProps> = ({ code }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const transpileAndRender = async () => {
      try {
        const transformed = await bundle(code);
        if (iframeRef.current) {
          iframeRef.current.srcdoc = htmlTemplate(transformed);
        }
      } catch (err) {
        if (iframeRef.current) {
          iframeRef.current.srcdoc = `<pre style="color:red;">${
            (err as Error).message
          }</pre>`;
        }
      }
    };

    transpileAndRender();
  }, [code]);

  return (
    <iframe
      ref={iframeRef}
      title="preview"
      sandbox="allow-scripts allow-same-origin"
      style={{ width: "100%", height: "100%", border: "none" }}
    />
  );
};

export default Preview;
