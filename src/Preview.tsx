import { useEffect, useRef } from "react";
import { bundle } from "./utils/bundler";

interface PreviewProps {
  code: string;
}

const htmlTemplate = (code: string) => {
  const importMapJSON = JSON.stringify({
    imports: {
      react: "https://esm.sh/react",
      "react-dom/": "https://esm.sh/react-dom/",
      "canvas-confetti": "https://esm.sh/canvas-confetti",
    },
  });

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
