import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import Controls from './components/Controls';
import AdvancedControls from './components/AdvancedControls';
import Scene from './components/Scene';
import { TextSettings, ViewMode, IntersectionConfig } from './types';
import { DEFAULT_SETTINGS, getFontLibrary } from './constants';
import { generateDualTextGeometry, exportToSTL, loadFont } from './services/geometryService';

const App: React.FC = () => {
  const [settings, setSettings] = useState<TextSettings>(DEFAULT_SETTINGS);
  const [generatedGeometry, setGeneratedGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const generateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fontLibrary = useMemo(() => getFontLibrary(), []);

  // Preload default font
  useEffect(() => {
    if (settings.fontUrl) {
        loadFont(settings.fontUrl).catch(e => console.warn("Failed to load default font", e));
    }
  }, []);

  // Sync Text Inputs to Intersection Config
  useEffect(() => {
    setSettings(prev => {
        const t1Chars = [...prev.text1];
        const t2Chars = [...prev.text2];
        const len = Math.max(t1Chars.length, t2Chars.length);
        
        let newConfig = [...prev.intersectionConfig];
        
        // 1. Resize if needed
        if (newConfig.length !== len) {
            if (len > newConfig.length) {
                for (let i = newConfig.length; i < len; i++) {
                    newConfig.push({
                        id: `${Math.random().toString(36).substr(2, 9)}`,
                        char1: t1Chars[i] || '',
                        char2: t2Chars[i] || '',
                        isOverridden: false,
                        // Defaults for new fields
                        char1Width: 1,
                        char2Width: 1,
                        transform: { scaleX: 1, scaleY: 1, moveX: 0, moveZ: 0 },
                        support: { 
                            enabled: prev.supportEnabled, 
                            type: prev.supportType, 
                            height: prev.supportHeight, 
                            width: prev.supportRadius 
                        },
                        bridge: {
                            enabled: true, // Default enabled
                            auto: true,    // Default auto
                            width: 2,
                            height: 3,
                            depth: 2,
                            moveX: 0,
                            moveY: 2.5,
                            moveZ: 0,
                            rotationZ: 0
                        }
                    });
                }
            } else {
                newConfig = newConfig.slice(0, len);
            }
        }

        // 2. Update chars and sync defaults
        const updated = newConfig.map((conf, i) => {
             const c1 = t1Chars[i] || '';
             const c2 = t2Chars[i] || '';
             
             let next = { ...conf, char1: c1, char2: c2 };
             
             if (!next.isOverridden) {
                 next.support = {
                     enabled: prev.supportEnabled,
                     type: prev.supportType,
                     height: prev.supportHeight,
                     width: prev.supportRadius
                 };
             }
             
             // Ensure bridge exists for older configs
             if (!next.bridge) {
                 next.bridge = {
                    enabled: true,
                    auto: true,
                    width: 2,
                    height: 3,
                    depth: 2,
                    moveX: 0,
                    moveY: 2.5,
                    moveZ: 0,
                    rotationZ: 0
                };
             }
             
             return next;
        });
        
        // Deep compare roughly
        if (JSON.stringify(updated) !== JSON.stringify(prev.intersectionConfig)) {
            return { ...prev, intersectionConfig: updated };
        }
        
        return prev;
    });
  }, [
      settings.text1, settings.text2, 
      settings.supportEnabled, settings.supportType, settings.supportHeight, settings.supportRadius
  ]);


  // Auto-generation effect
  useEffect(() => {
    if (generateTimeoutRef.current) {
        clearTimeout(generateTimeoutRef.current);
    }
    
    generateTimeoutRef.current = setTimeout(async () => {
        setIsGenerating(true);
        setError(null); 
        try {
            await new Promise(r => setTimeout(r, 50));
            
            // Only generate if we have configs
            if (settings.intersectionConfig.length > 0) {
                const geom = await generateDualTextGeometry(settings);
                setGeneratedGeometry(geom || null);
            }
        } catch (err: any) {
            console.error("Generation failed:", err);
            setError(err.message || "An unexpected error occurred during generation.");
            setGeneratedGeometry(null);
        } finally {
            setIsGenerating(false);
        }
    }, 1000); 

    return () => {
        if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current);
    };
  }, [settings]); 

  const handleDownload = () => {
    if (!generatedGeometry) return;
    const filename = `TextTango_${settings.text1}_${settings.text2}`;
    exportToSTL(generatedGeometry, filename);
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-gray-900">
      <Controls 
        settings={settings}
        setSettings={setSettings}
        onDownload={handleDownload}
        isGenerating={isGenerating}
        hasResult={!!generatedGeometry}
        fontLibrary={fontLibrary}
        showAdvanced={showAdvanced}
        toggleAdvanced={() => setShowAdvanced(!showAdvanced)}
      />

      {showAdvanced && (
          <AdvancedControls settings={settings} setSettings={setSettings} />
      )}

      <main className="flex-1 relative bg-gray-900 min-w-0">
        <Scene 
            settings={settings}
            generatedGeometry={isGenerating ? null : generatedGeometry} 
            mode={isGenerating || !generatedGeometry ? ViewMode.PREVIEW : ViewMode.RESULT}
        />
        
        {/* Loading Indicator */}
        {isGenerating && (
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-3 z-20 animate-pulse pointer-events-none">
                <i className="fas fa-cog fa-spin"></i>
                <span className="font-semibold text-sm">Generating Model...</span>
             </div>
        )}

        {/* Error Message Display */}
        {error && !isGenerating && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500 text-white px-6 py-4 rounded-lg shadow-xl z-30 max-w-lg flex flex-col gap-2">
                <div className="flex items-center gap-3 text-red-300 font-bold">
                    <i className="fas fa-exclamation-circle text-xl"></i>
                    <span>Generation Failed</span>
                </div>
                <p className="text-sm opacity-90">{error}</p>
                <button 
                    onClick={() => setError(null)}
                    className="self-end text-xs text-red-300 hover:text-white underline mt-1"
                >
                    Dismiss
                </button>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;