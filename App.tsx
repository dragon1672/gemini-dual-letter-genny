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
    
    // 2. Set generating state (used to show spinner in button or loading state)
    // Note: We don't set isGenerating=true immediately to avoid flashing spinner on every keystroke.
    // We can set a local "dirty" state if we wanted to show "changes pending".
    
    // 3. Schedule generation
    generateTimeoutRef.current = setTimeout(async () => {
        setIsGenerating(true);
        try {
            // Small yield to let UI render the spinner
            await new Promise(r => setTimeout(r, 50));
            const geom = await generateDualTextGeometry(settings);
            setGeneratedGeometry(geom);
        } catch (error) {
            console.error("Generation failed:", error);
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

  // Determine what to show. 
  // If we are generating, keep showing old result (if any) or Preview? 
  // Actually, usually you want to see the Preview while editing, then Result when done.
  // The 'isGenerating' flag is true only during the actual computation.
  // We can infer "Preview Mode" if user is typing (debounce active). 
  // But reacting to debounce active state is tricky with just refs.
  // For simplicity: Scene always renders Preview. It overlays Result if `generatedGeometry` exists AND `!isGenerating`.
  // Actually, if settings changed, `generatedGeometry` is stale compared to settings.
  // We can just rely on `isGenerating` to show a loader overlay.
  
  // Better UX: Show Preview (ghost) always. Show Result on top when valid. 
  // When settings change, we can hide Result immediately?
  // Let's hide Result immediately on settings change? 
  // No, that causes flickering.
  // Let's just track if settings match geometry? Too complex.
  // Let's just show Preview while debouncing.
  
  // Simplified:
  // We use `isGenerating` to show status. 
  // `ViewMode` is effectively always handled by Scene: 
  // Scene renders Preview (ghost inputs). Scene renders Result (solid) if passed.
  
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

      <main className="flex-1 relative">
        <Scene 
            settings={settings}
            generatedGeometry={isGenerating ? null : generatedGeometry} // Hide stale geometry during regen? Or keep it? keeping it might be confusing if mismatch. Let's hide it to show Preview.
            mode={isGenerating || !generatedGeometry ? ViewMode.PREVIEW : ViewMode.RESULT}
        />
        
        {isGenerating && (
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-3 z-20 animate-pulse">
                <i className="fas fa-cog fa-spin"></i>
                <span className="font-semibold text-sm">Generating Model...</span>
             </div>
        )}
      </main>
    </div>
  );
};

export default App;