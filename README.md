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
