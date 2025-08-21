import Editor from "@monaco-editor/react";
import { setMonacoInstance } from "./monacoInstance";
import { createIntelliSenseManager } from "./utils/intelligenceManager";
import { getIntelliSenseDebugger } from "./utils/intelliSenseDebugger";
import { useState, useRef } from "react";

// 디버깅을 위한 window 객체 확장
declare global {
  interface Window {
    debugIntelliSense?: () => void;
    testCompletion?: (line: number, col: number) => void;
    restartLanguageService?: () => void;
  }
}

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const intelligenceManagerRef = useRef<ReturnType<
    typeof createIntelliSenseManager
  > | null>(null);

  return (
    <div style={{ position: "relative", height: "100%" }}>
      {/* 타입 로딩 상태 표시 */}
      {isLoadingTypes && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              border: "2px solid #333",
              borderTop: "2px solid #fff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          {loadingStatus}
        </div>
      )}

      <Editor
        height="100%"
        defaultLanguage="typescript"
        path="file:///src/index.tsx"
        theme="vs-dark"
        value={code}
        onChange={onChange}
        onMount={async (editor, monaco) => {
          setMonacoInstance(monaco);

          try {
            console.log("🚀 Initializing Enhanced TypeScript IntelliSense...");

            // 1. 명시적 모델 생성 및 URI 설정
            const uri = monaco.Uri.parse("file:///src/index.tsx");
            let model = monaco.editor.getModel(uri);
            
            if (!model) {
              model = monaco.editor.createModel(code, "typescript", uri);
              editor.setModel(model);
            }

            // 2. 자동완성 트리거 설정
            editor.onKeyUp((e) => {
              // 점(.) 입력 시 자동완성 트리거
              if (e.keyCode === monaco.KeyCode.Period) {
                setTimeout(() => {
                  editor.trigger('autocomplete', 'editor.action.triggerSuggest', {});
                }, 100);
              }
              // 따옴표 입력 시 자동완성 트리거 (문자열 속성용)
              if (e.keyCode === monaco.KeyCode.Quote) {
                setTimeout(() => {
                  editor.trigger('autocomplete', 'editor.action.triggerSuggest', {});
                }, 100);
              }
              // 대괄호 입력 시 자동완성 트리거
              if (e.keyCode === monaco.KeyCode.BracketLeft) {
                setTimeout(() => {
                  editor.trigger('autocomplete', 'editor.action.triggerSuggest', {});
                }, 100);
              }
              // 스페이스 입력 후 특정 컨텍스트에서 자동완성 트리거
              if (e.keyCode === monaco.KeyCode.Space) {
                const position = editor.getPosition();
                if (position) {
                  const lineContent = model.getLineContent(position.lineNumber);
                  const beforeCursor = lineContent.substring(0, position.column - 1);
                  
                  // import 구문 후 자동완성
                  if (/import\s+\{[^}]*$/.test(beforeCursor) || /from\s+['"][^'"]*$/.test(beforeCursor)) {
                    setTimeout(() => {
                      editor.trigger('autocomplete', 'editor.action.triggerSuggest', {});
                    }, 100);
                  }
                }
              }
            });

            // JSX 태그 자동완성을 위한 추가 키 이벤트
            editor.onKeyDown((e) => {
              // Ctrl/Cmd + Space로 수동 트리거
              if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.Space) {
                e.preventDefault();
                editor.trigger('autocomplete', 'editor.action.triggerSuggest', {});
              }
              
              // '<' 입력 시 JSX 태그 자동완성 트리거 (실제로는 텍스트 변경 이벤트에서 처리)
              // 여기서는 단축키만 처리
            });

            // 텍스트 변경 시 JSX 컨텍스트 감지 및 자동완성 트리거
            editor.onDidChangeModelContent((e) => {
              if (e.changes.length > 0) {
                const change = e.changes[0];
                const text = change.text;
                
                // JSX 태그 시작 감지 '<'
                if (text === '<') {
                  setTimeout(() => {
                    editor.trigger('autocomplete', 'editor.action.triggerSuggest', {});
                  }, 100);
                }
                
                // JSX 속성 시작 감지 (스페이스 후)
                if (text === ' ') {
                  const position = editor.getPosition();
                  if (position) {
                    const lineContent = model.getLineContent(position.lineNumber);
                    const beforeCursor = lineContent.substring(0, position.column - 1);
                    
                    // JSX 태그 내부에서 스페이스 입력 시
                    if (/<[A-Z][a-zA-Z0-9]*[^>]*$/.test(beforeCursor)) {
                      setTimeout(() => {
                        editor.trigger('autocomplete', 'editor.action.triggerSuggest', {});
                      }, 100);
                    }
                  }
                }
              }
            });

            // 3. 통합 인텔리센스 관리자 생성 및 초기화
            const manager = createIntelliSenseManager(monaco, {
              enableCache: true,
              enableAutoLoading: true,
              debounceMs: 1000,
              maxConcurrentLoads: 3,
            });

            intelligenceManagerRef.current = manager;

            // 4. 인텔리센스 시스템 초기화
            await manager.initialize();

            // 5. 코드 변경 감지를 위한 추가 설정
            if (model) {
              let debounceTimeout: NodeJS.Timeout;

              model.onDidChangeContent(() => {
                const currentCode = model.getValue();

                // 타입 로딩 상태 업데이트
                const loadingModules = manager.getLoadingModules();
                if (loadingModules.length > 0) {
                  setIsLoadingTypes(true);
                  setLoadingStatus(
                    `Loading types for ${loadingModules.join(", ")}...`
                  );
                } else {
                  setIsLoadingTypes(false);
                  setLoadingStatus("");
                }

                // Debounced 타입 분석
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(async () => {
                  await manager.analyzeAndLoadTypes(currentCode);

                  // 로딩 완료 후 상태 업데이트
                  setTimeout(() => {
                    const stillLoading = manager.getLoadingModules();
                    if (stillLoading.length === 0) {
                      setIsLoadingTypes(false);
                      setLoadingStatus("");
                    }
                  }, 500);
                }, 1000);
              });
            }

            console.log("✅ Enhanced TypeScript IntelliSense is ready!");

            // 디버거 설정 (개발 환경)
            if (process.env.NODE_ENV === 'development') {
              const intelliSenseDebugger = getIntelliSenseDebugger(monaco);
              if (intelliSenseDebugger && model) {
                intelliSenseDebugger.diagnose(model);
                
                // 개발자 콘솔에서 사용할 수 있도록 전역 함수 추가
                window.debugIntelliSense = () => intelliSenseDebugger.diagnose(model);
                window.testCompletion = (line: number, col: number) => 
                  intelliSenseDebugger.testCompletion(model, line, col);
                window.restartLanguageService = () => intelliSenseDebugger.restartLanguageService();
                
                console.log("🔧 Debug functions available:");
                console.log("- window.debugIntelliSense() - 현재 상태 진단");
                console.log("- window.testCompletion(line, col) - 특정 위치에서 자동완성 테스트");
                console.log("- window.restartLanguageService() - 언어 서비스 재시작");
              }
            }

            // 6. 초기 코드 분석 (코드가 이미 있는 경우)
            if (code.trim()) {
              console.log("🔍 Analyzing initial code...");
              await manager.analyzeAndLoadTypes(code);
            }
            
            // 7. vapor-ui/core 수동 로드 (앱에서 기본으로 사용하는 라이브러리)
            if (code.includes('@vapor-ui/core')) {
              console.log("🎨 Loading @vapor-ui/core types...");
              try {
                await manager.loadLibrary('@vapor-ui/core');
              } catch (error) {
                console.warn("Failed to load @vapor-ui/core:", error);
              }
            }
          } catch (error) {
            console.error("❌ Failed to setup enhanced IntelliSense:", error);
          }
        }}
        beforeMount={() => {
          // 7. TypeScript 워커 설정 (beforeMount에서 먼저 설정)
          self.MonacoEnvironment = {
            getWorker(_: string, label: string) {
              if (label === "typescript" || label === "javascript") {
                return new Worker(
                  new URL(
                    "monaco-editor/esm/vs/language/typescript/ts.worker.js",
                    import.meta.url
                  ),
                  { type: "module" }
                );
              }
              return new Worker(
                new URL(
                  "monaco-editor/esm/vs/editor/editor.worker.js",
                  import.meta.url
                ),
                { type: "module" }
              );
            },
          } as typeof self.MonacoEnvironment;
        }}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: "on",
          // IntelliSense 개선을 위한 추가 옵션
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
          },
          quickSuggestionsDelay: 50, // 더 빠른 응답
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          acceptSuggestionOnCommitCharacter: true,
          snippetSuggestions: "top",
          wordBasedSuggestions: "off",
          // JSX 자동완성을 위한 추가 설정
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showClasses: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: false,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showColors: true,
            showFiles: false,
            showReferences: true,
            showFolders: false,
            showTypeParameters: true,
            showIssues: true,
            showUsers: false,
            filterGraceful: true,
            snippetsPreventQuickSuggestions: false,
            localityBonus: true,
            shareSuggestSelections: false,
            showInlineDetails: true,
          },
          // 파라미터 힌트 활성화
          parameterHints: {
            enabled: true,
            cycle: true,
          },
          // 호버 정보 활성화
          hover: {
            enabled: true,
            delay: 50, // 더 빠른 응답
            sticky: true,
          },
          // 코드 렌즈 활성화
          codeLens: true,
          // 자동 닫기 태그
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          autoIndent: "full",
          // JSX 태그 자동 완성
          autoClosingOvertype: "always",
          autoSurround: "languageDefined",
        }}
      />

      {/* 스피너 애니메이션을 위한 CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CodeEditor;
