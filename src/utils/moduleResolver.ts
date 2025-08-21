import type * as monaco from "monaco-editor";

/**
 * Enhanced module resolver that helps Monaco find and resolve external modules
 */
export class ModuleResolver {
  private monaco: typeof monaco;
  private moduleMap = new Map<string, string>();

  constructor(monacoInstance: typeof monaco) {
    this.monaco = monacoInstance;
  }

  /**
   * Register a module with its type definitions
   */
  registerModule(moduleName: string, typeContent: string): void {
    // Register with multiple path patterns to ensure Monaco can find it
    const paths = [
      `file:///node_modules/${moduleName}/index.d.ts`,
      `file:///node_modules/@types/${moduleName}/index.d.ts`,
      `file:///node_modules/${moduleName}.d.ts`,
    ];

    paths.forEach((path) => {
      this.monaco.languages.typescript.typescriptDefaults.addExtraLib(
        typeContent,
        path
      );
    });

    // Store in module map
    this.moduleMap.set(moduleName, typeContent);

    console.log(`Registered module: ${moduleName} with ${paths.length} paths`);
  }

  /**
   * Create an ambient module declaration for fallback
   */
  createAmbientDeclaration(moduleName: string): string {
    return `
declare module '${moduleName}' {
  // Fallback ambient module declaration
  const content: any;
  export = content;
}
`;
  }

  /**
   * Register ambient modules for common libraries
   */
  registerAmbientModules(): void {
    const ambientDeclarations = `
// Ambient module declarations for external libraries
declare module '@vapor-ui/core' {
  import { ReactNode, CSSProperties, ChangeEvent } from 'react';
  
  export interface ButtonProps {
    children?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    style?: CSSProperties;
  }
  export const Button: React.FC<ButtonProps>;
  
  export interface CardProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
  }
  
  export const Card: React.FC<CardProps> & {
    Root: React.FC<CardProps>;
    Header: React.FC<CardProps>;
    Body: React.FC<CardProps>;
    Content: React.FC<CardProps>;
    Footer: React.FC<CardProps>;
    Title: React.FC<CardProps>;
    Description: React.FC<CardProps>;
  };
  
  export interface InputProps {
    value?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    type?: 'text' | 'password' | 'email' | 'number';
    className?: string;
    style?: CSSProperties;
  }
  export const Input: React.FC<InputProps>;
  
  export interface SwitchProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    style?: CSSProperties;
  }
  export const Switch: React.FC<SwitchProps>;
  
  export interface ThemeProviderProps {
    children: ReactNode;
    theme?: 'light' | 'dark' | string;
  }
  export const ThemeProvider: React.FC<ThemeProviderProps>;
}

declare module '@radix-ui/react-switch' {
  import { ReactNode } from 'react';
  
  export interface SwitchProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
  }
  export const Root: React.FC<SwitchProps>;
  export const Thumb: React.FC<{ children?: ReactNode }>;
}
`;

    this.monaco.languages.typescript.typescriptDefaults.addExtraLib(
      ambientDeclarations,
      "file:///node_modules/@types/ambient-modules.d.ts"
    );

    console.log("Registered ambient module declarations");
  }

  /**
   * Get all registered modules
   */
  getRegisteredModules(): string[] {
    return Array.from(this.moduleMap.keys());
  }
}
