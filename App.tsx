import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import Controls from './components/Controls';
import Scene from './components/Scene';
import { TextSettings, ViewMode } from './types';
import { DEFAULT_SETTINGS, getFontLibrary } from './constants';
import { generateDualTextGeometry, exportToSTL, loadFont } from './services/geometryService';

const App: React.FC = () => {
  const [settings, setSettings] = useState<TextSettings>(DEFAULT_SETTINGS);
  const [generatedGeometry, setGeneratedGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to track timeout for debounce
  const generateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const fontLibrary = useMemo(() => getFontLibrary(), []);

  // Preload default font
  useEffect(() => {
    if (settings.fontUrl) {
        loadFont(settings.fontUrl).catch(e => console.warn("Failed to load default font", e));
    }
  }, []);

  // Auto-generation effect
  useEffect(() => {
    // 1. Cancel previous pending generation
    if (generateTimeoutRef.current) {
        clearTimeout(generateTimeoutRef.current);
    }
    
    // 2. Schedule generation
    generateTimeoutRef.current = setTimeout(async () => {
        setIsGenerating(true);
        setError(null); // Clear previous errors
        try {
            // Small yield to let UI render the spinner
            await new Promise(r => setTimeout(r, 50));
            const geom = await generateDualTextGeometry(settings);
            
            if (!geom) {
                // If geom is null but no error was thrown, it usually means empty input or no intersection
                // We don't necessarily treat it as a crash, but we clear the result.
                setGeneratedGeometry(null);
            } else {
                setGeneratedGeometry(geom);
            }
        } catch (err: any) {
            console.error("Generation failed:", err);
            setError(err.message || "An unexpected error occurred during generation.");
            setGeneratedGeometry(null);
        } finally {
            setIsGenerating(false);
        }
    }, 1500); // 1.5s delay after last change

    return () => {
        if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current);
    };
  }, [
      settings.text1, settings.text2, 
      settings.fontSize, settings.spacing, 
      settings.baseHeight, settings.basePadding, settings.baseType, settings.baseCornerRadius, settings.baseTopRounding,
      settings.fontUrl, 
      settings.supportEnabled, settings.supportHeight, settings.supportRadius, settings.supportMask
  ]);

  const handleDownload = () => {
    if (!generatedGeometry) return;
    const filename = `TextTango_${settings.text1}_${settings.text2}`;
    exportToSTL(generatedGeometry, filename);
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      <Controls 
        settings={settings}
        setSettings={setSettings}
        onDownload={handleDownload}
        isGenerating={isGenerating}
        hasResult={!!generatedGeometry}
        fontLibrary={fontLibrary}
      />

      <main className="flex-1 relative bg-gray-900">
        <Scene 
            settings={settings}
            generatedGeometry={isGenerating ? null : generatedGeometry} 
            mode={isGenerating || !generatedGeometry ? ViewMode.PREVIEW : ViewMode.RESULT}
        />
        
        {/* Loading Indicator */}
        {isGenerating && (
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-3 z-20 animate-pulse">
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