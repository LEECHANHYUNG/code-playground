# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## 🧑‍💻 In-Browser TypeScript / JSX Playground

This project ships with a live playground that lets you write **TypeScript + JSX** on the left and see the executed output on the right – all inside the browser, no back-end required.

### How it works

| Step | File                 | Responsibility                                                                                                                           |
| ---- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `src/CodeEditor.tsx` | Monaco Editor configured for **TypeScript (TSX)**. It sets compilation options and injects React/React-DOM type definitions at runtime.  |
| 2    | `src/bundler.ts`     | Uses **esbuild-wasm** to transpile the raw TSX code → ES2015 ESM JavaScript. The WASM binary is lazily loaded from _unpkg_ on first use. |
| 3    | `src/Preview.tsx`    | Extracts bare import specifiers to build an **import-map**, injects the transpiled code into an `<iframe>`, and displays runtime errors. |

### Key implementation details

1. **esbuild-wasm**
   ```ts
   const result = await esbuild.transform(rawCode, {
     loader: "tsx",
     jsx: "automatic", // React 17+ automatic runtime
     target: "es2015",
   });
   ```
2. **Monaco Editor compiler options**
   ```ts
   monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
     module: ESNext,
     moduleResolution: NodeJs,
     jsx: ReactJSX,
     jsxImportSource: "react",
   });
   ```
3. **Runtime type definitions** are fetched from _unpkg_ and registered via `addExtraLib()` so that the editor recognises:
   - `react`
   - `react/jsx-runtime`, `react/jsx-dev-runtime`
   - `react-dom`, `react-dom/client`

### Common errors & fixes

| TS Error code | Message (excerpt)                                       | Root cause                                | Fix implemented                                                             |
| ------------- | ------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| 8010          | `Type annotations can only be used in TypeScript files` | Monaco defaulted to `javascript` language | Set `defaultLanguage="typescript"` and `defaultPath="index.tsx"`            |
| 2792          | `Cannot find module 'react'`                            | TS compiler didn't locate `react` types   | Added compiler option `moduleResolution: NodeJs` and fetched `@types/react` |
| 2307          | `Cannot find module 'react/jsx-runtime'`                | Automatic JSX runtime types missing       | Loaded `jsx-runtime.d.ts` & `jsx-dev-runtime.d.ts`                          |
| 2307          | `Cannot find module 'react-dom/client'`                 | React 18 root API types missing           | Loaded `client.d.ts` from `@types/react-dom`                                |

If you encounter additional red squiggles, ensure the package has a corresponding `@types/...` entry on _DefinitelyTyped_. You can mimic the approach in `CodeEditor.tsx` to fetch and register it on demand.

### Running locally

```bash
pnpm i         # install dependencies (incl. esbuild-wasm)
pnpm dev       # start Vite
```

The first transpile triggers a fetch of the **esbuild.wasm** binary (~1 MB). Subsequent compilations are instant.

## 🚀 CDN Module Loading & Import Maps

The playground resolves bare `import` specifiers on-the-fly by pointing them at the ESM CDN [esm.sh](https://esm.sh) via a dynamically generated **import map**.

### How it works

1. **Extract bare specifiers** – any import that doesn't start with `./`, `../` or `/` is treated as a package name. See the helper in:

```8:23:vite-project/src/Preview.tsx
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
```

2. **Create the import-map** – for every package we add
   - an exact match (`"react" → https://esm.sh/react`)
   - **and** a _sub-path_ prefix (`"react/" → https://esm.sh/react/`) so that `react/jsx-runtime`, `react-dom/client`, … resolve correctly.

```26:33:vite-project/src/Preview.tsx
const buildImportMap = (imports: string[]): string => {
  const map: Record<string, string> = {};
  imports.forEach((spec) => {
    map[spec] = `https://esm.sh/${spec}`;
    map[`${spec}/`] = `https://esm.sh/${spec}/`;
  });
  return JSON.stringify({ imports: map }, null, 2);
};
```

3. **Inject into the sandbox** – the map and the transpiled user code are written into the `<iframe>` as shown here:

```38:44:vite-project/src/Preview.tsx
  return `<!DOCTYPE html>
  <html>
    <head></head>
    <body>
      <div id="root"></div>
      <script type="importmap">${importMapJSON}</script>
      <script type="module">
```

### Example import-map snippet

```html
<script type="importmap">
  {
    "imports": {
      "canvas-confetti/": "https://esm.sh/canvas-confetti/"
    }
  }
</script>
```

With the map in place you can simply write:

```jsx
import confetti from "canvas-confetti";

window.confetti = confetti;
document.body.innerHTML = `<button onclick="confetti()">🎉 클릭</button>`;
```

### Customising the CDN

If you prefer another ESM CDN (e.g. `unpkg`, `jspm.io`, `skypack`) just swap the base URL inside `buildImportMap()`.

> ℹ️ The entire feature lives in `src/Preview.tsx`; no changes to Vite or build tooling are required.
