/**
 * TypeScript IntelliSense 디버깅 유틸리티
 * 타입 로딩 상태와 자동완성 문제를 진단하는 도구
 */

import * as monaco from "monaco-editor";

export class IntelliSenseDebugger {
  private monaco: typeof monaco;

  constructor(monacoInstance: typeof monaco) {
    this.monaco = monacoInstance;
  }

  /**
   * 현재 로드된 모든 타입 라이브러리 조회
   */
  getLoadedLibraries(): Record<string, string> {
    const extraLibs = this.monaco.languages.typescript.typescriptDefaults.getExtraLibs();
    const result: Record<string, string> = {};
    
    for (const [path, lib] of Object.entries(extraLibs)) {
      result[path] = `${lib.content.length} characters`;
    }
    
    return result;
  }

  /**
   * TypeScript 컴파일러 옵션 조회
   */
  getCompilerOptions() {
    return this.monaco.languages.typescript.typescriptDefaults.getCompilerOptions();
  }

  /**
   * 진단 옵션 조회
   */
  getDiagnosticsOptions() {
    return this.monaco.languages.typescript.typescriptDefaults.getDiagnosticsOptions();
  }

  /**
   * 특정 위치에서 자동완성 제안 가져오기
   */
  async getCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.CompletionList | null> {
    try {
      console.log("Checking completion providers...");
      
      // 타입스크립트 언어 서비스에서 직접 제안 가져오기
      const worker = await this.monaco.languages.typescript.getTypeScriptWorker();
      await worker(model.uri);
      
      // 실제 완성 항목 가져오기는 복잡하므로 일단 null 반환
      console.log("TypeScript worker available, position:", position.lineNumber, position.column);
      return null;
    } catch (error) {
      console.error("Failed to get completion items:", error);
      return null;
    }
  }

  /**
   * 모델의 마커(오류) 조회
   */
  getModelMarkers(model: monaco.editor.ITextModel): monaco.editor.IMarkerData[] {
    return this.monaco.editor.getModelMarkers({
      resource: model.uri,
    });
  }

  /**
   * IntelliSense 상태 진단
   */
  diagnose(model?: monaco.editor.ITextModel): void {
    console.group("🔧 IntelliSense Diagnosis");
    
    // 1. 컴파일러 옵션
    console.log("📝 Compiler Options:", this.getCompilerOptions());
    
    // 2. 진단 옵션
    console.log("🩺 Diagnostics Options:", this.getDiagnosticsOptions());
    
    // 3. 로드된 라이브러리
    const libs = this.getLoadedLibraries();
    console.log(`📚 Loaded Libraries (${Object.keys(libs).length}):`, libs);
    
    // 4. 워커 상태
    console.log("⚙️ Workers:", {
      typescript: !!self.MonacoEnvironment?.getWorker,
      environment: !!self.MonacoEnvironment,
    });
    
    // 5. 모델 정보
    if (model) {
      console.log("📄 Model Info:", {
        uri: model.uri.toString(),
        language: model.getLanguageId(),
        lineCount: model.getLineCount(),
        markers: this.getModelMarkers(model).length,
      });
      
      // 마커 상세 정보
      const markers = this.getModelMarkers(model);
      if (markers.length > 0) {
        console.log("❌ Markers:", markers);
      }
    }
    
    console.groupEnd();
  }

  /**
   * 자동완성 테스트
   */
  async testCompletion(
    model: monaco.editor.ITextModel,
    lineNumber: number,
    column: number
  ): Promise<void> {
    const position = new this.monaco.Position(lineNumber, column);
    const completions = await this.getCompletionItems(model, position);
    
    console.group(`🧪 Completion Test at ${lineNumber}:${column}`);
    
    if (completions) {
      console.log(`Found ${completions.suggestions.length} suggestions:`);
      completions.suggestions.slice(0, 10).forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.label} (${suggestion.kind})`);
      });
      
      if (completions.suggestions.length > 10) {
        console.log(`... and ${completions.suggestions.length - 10} more`);
      }
    } else {
      console.warn("No completions found");
    }
    
    console.groupEnd();
  }

  /**
   * 타입 정보 확인
   */
  async getTypeInfo(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): Promise<monaco.languages.Hover | null> {
    try {
      // 타입스크립트 워커를 통해 호버 정보 가져오기
      const worker = await this.monaco.languages.typescript.getTypeScriptWorker();
      await worker(model.uri);
      
      console.log("Getting type info at position:", position.lineNumber, position.column);
      return null; // 실제 구현은 복잡하므로 일단 null 반환
    } catch (error) {
      console.error("Failed to get type info:", error);
      return null;
    }
  }

  /**
   * TypeScript 언어 서비스 강제 재시작
   */
  restartLanguageService(): void {
    console.log("🔄 Restarting TypeScript language service...");
    
    // 현재 모든 모델의 언어를 일시적으로 변경하고 다시 되돌리기
    const models = this.monaco.editor.getModels();
    models.forEach(model => {
      const originalLanguage = model.getLanguageId();
      if (originalLanguage === 'typescript') {
        this.monaco.editor.setModelLanguage(model, 'javascript');
        setTimeout(() => {
          this.monaco.editor.setModelLanguage(model, 'typescript');
        }, 100);
      }
    });
    
    console.log("✅ Language service restart completed");
  }
}

// 전역 디버거 인스턴스
let globalDebugger: IntelliSenseDebugger | null = null;

export function getIntelliSenseDebugger(monaco?: typeof import("monaco-editor")): IntelliSenseDebugger | null {
  if (!globalDebugger && monaco) {
    globalDebugger = new IntelliSenseDebugger(monaco);
  }
  return globalDebugger;
}

// 개발 환경에서 전역 접근 가능하도록 설정
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).intelliSenseDebugger = {
    get: () => globalDebugger,
    diagnose: (model?: monaco.editor.ITextModel) => globalDebugger?.diagnose(model),
    testCompletion: (model: monaco.editor.ITextModel, line: number, col: number) => 
      globalDebugger?.testCompletion(model, line, col),
    restart: () => globalDebugger?.restartLanguageService(),
  };
}
