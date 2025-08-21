/**
 * TypeScript IntelliSense 개발자 도구 패널
 * 타입 로딩 상태, 캐시 정보, 성능 통계를 표시하는 컴포넌트
 */

import React, { useState, useEffect } from "react";
import { getIntelliSenseManager } from "../utils/intelligenceManager";

interface DevPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const IntelliSenseDevPanel: React.FC<DevPanelProps> = ({
  isVisible,
  onToggle,
}) => {
  const [stats, setStats] = useState({
    loadedModules: [] as string[],
    loadingModules: [] as string[],
    cacheStats: {
      totalTypes: 0,
      cacheSize: "0 Bytes",
      hitRate: 0,
      hitCount: 0,
      missCount: 0,
    },
    supportedLibraries: [] as string[],
  });

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const updateStats = () => {
      const manager = getIntelliSenseManager();
      if (manager) {
        setStats({
          loadedModules: manager.getLoadedModules(),
          loadingModules: manager.getLoadingModules(),
          cacheStats: manager.getCacheStats(),
          supportedLibraries: manager.getSupportedLibraries(),
        });
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleClearCache = () => {
    const manager = getIntelliSenseManager();
    if (manager) {
      manager.clearCache();
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleLoadLibrary = async (libraryName: string) => {
    const manager = getIntelliSenseManager();
    if (manager) {
      try {
        await manager.loadLibrary(libraryName);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error(`Failed to load ${libraryName}:`, error);
      }
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          backgroundColor: "#007acc",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          fontSize: "20px",
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
        title="Open IntelliSense Dev Panel"
      >
        🔧
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "400px",
        maxHeight: "600px",
        backgroundColor: "#1e1e1e",
        color: "#ffffff",
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "16px",
        fontSize: "12px",
        fontFamily: "Consolas, Monaco, monospace",
        zIndex: 1000,
        overflow: "auto",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          borderBottom: "1px solid #333",
          paddingBottom: "8px",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "14px" }}>
          🔧 IntelliSense DevTools
        </h3>
        <button
          onClick={onToggle}
          style={{
            background: "none",
            border: "none",
            color: "#ccc",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* 로딩 상태 */}
      <section style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#4fc3f7" }}>
          📦 Loading Status
        </h4>
        {stats.loadingModules.length > 0 ? (
          <div style={{ padding: "8px", backgroundColor: "#2d2d30" }}>
            <div style={{ color: "#ffd600" }}>Loading...</div>
            {stats.loadingModules.map((module) => (
              <div key={module} style={{ fontSize: "11px", color: "#ccc" }}>
                • {module}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#4caf50" }}>✅ Ready</div>
        )}
      </section>

      {/* 로드된 모듈 */}
      <section style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#4fc3f7" }}>
          📚 Loaded Modules ({stats.loadedModules.length})
        </h4>
        <div
          style={{
            maxHeight: "120px",
            overflow: "auto",
            backgroundColor: "#2d2d30",
            padding: "8px",
          }}
        >
          {stats.loadedModules.length > 0 ? (
            stats.loadedModules.map((module) => (
              <div key={module} style={{ fontSize: "11px", color: "#ccc" }}>
                ✅ {module}
              </div>
            ))
          ) : (
            <div style={{ color: "#666" }}>No modules loaded yet</div>
          )}
        </div>
      </section>

      {/* 캐시 통계 */}
      <section style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#4fc3f7" }}>
          💾 Cache Stats
        </h4>
        <div style={{ backgroundColor: "#2d2d30", padding: "8px" }}>
          <div>Types: {stats.cacheStats.totalTypes}</div>
          <div>Size: {stats.cacheStats.cacheSize}</div>
          <div>
            Hit Rate: {stats.cacheStats.hitRate}% ({stats.cacheStats.hitCount}/
            {stats.cacheStats.hitCount + stats.cacheStats.missCount})
          </div>
          <button
            onClick={handleClearCache}
            style={{
              marginTop: "8px",
              padding: "4px 8px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "11px",
              cursor: "pointer",
            }}
          >
            Clear Cache
          </button>
        </div>
      </section>

      {/* 수동 라이브러리 로드 */}
      <section style={{ marginBottom: "16px" }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#4fc3f7" }}>🚀 Quick Load</h4>
        <div style={{ backgroundColor: "#2d2d30", padding: "8px" }}>
          {["lodash", "axios", "moment", "uuid", "classnames"].map((lib) => (
            <button
              key={lib}
              onClick={() => handleLoadLibrary(lib)}
              disabled={stats.loadedModules.includes(lib)}
              style={{
                margin: "2px",
                padding: "2px 6px",
                backgroundColor: stats.loadedModules.includes(lib)
                  ? "#4caf50"
                  : "#007acc",
                color: "white",
                border: "none",
                borderRadius: "3px",
                fontSize: "10px",
                cursor: stats.loadedModules.includes(lib)
                  ? "default"
                  : "pointer",
                opacity: stats.loadedModules.includes(lib) ? 0.6 : 1,
              }}
            >
              {lib}
            </button>
          ))}
        </div>
      </section>

      {/* 지원 라이브러리 목록 */}
      <section>
        <h4 style={{ margin: "0 0 8px 0", color: "#4fc3f7" }}>
          🔧 Supported Libraries ({stats.supportedLibraries.length})
        </h4>
        <div
          style={{
            maxHeight: "100px",
            overflow: "auto",
            backgroundColor: "#2d2d30",
            padding: "8px",
            fontSize: "10px",
          }}
        >
          {stats.supportedLibraries.map((lib) => (
            <span
              key={lib}
              style={{
                display: "inline-block",
                margin: "1px",
                padding: "1px 4px",
                backgroundColor: stats.loadedModules.includes(lib)
                  ? "#4caf50"
                  : "#555",
                borderRadius: "2px",
                color: "#fff",
              }}
            >
              {lib}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};
