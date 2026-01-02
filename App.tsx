import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import Controls from './components/Controls';
import Scene from './components/Scene';
import { TextSettings, ViewMode } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { generateDualTextGeometry, exportToSTL } from './services/geometryService';

const App: React.FC = () => {
  const [settings, setSettings] = useState<TextSettings>(DEFAULT_SETTINGS);
  const [generatedGeometry, setGeneratedGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.PREVIEW);

  // When settings change, revert to preview mode (invalidate old geometry visually)
  useEffect(() => {
    if (viewMode === ViewMode.RESULT) {
       setViewMode(ViewMode.PREVIEW);
    }
  }, [settings.text1, settings.text2, settings.fontSize, settings.spacing, settings.baseHeight, settings.basePadding, settings.fontUrl, settings.supportEnabled, settings.supportHeight, settings.supportRadius, settings.supportMask]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Add small delay to allow UI to update to loading state before heavy calculation
    setTimeout(async () => {
        try {
            const geom = await generateDualTextGeometry(settings);
            setGeneratedGeometry(geom);
            setViewMode(ViewMode.RESULT);
        } catch (error) {
            console.error("Generation failed:", error);
            alert("Failed to generate geometry.");
        } finally {
            setIsGenerating(false);
        }
    }, 100);
  };

  const handleDownload = () => {
    if (!generatedGeometry) return;
    const filename = `TextTango_${settings.text1}_${settings.text2}`;
    exportToSTL(generatedGeometry, filename);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      {/* Sidebar Controls */}
      <Controls 
        settings={settings}
        setSettings={setSettings}
        onGenerate={handleGenerate}
        onDownload={handleDownload}
        isGenerating={isGenerating}
        hasResult={!!generatedGeometry}
      />

      {/* 3D Scene */}
      <main className="flex-1 relative">
        <Scene 
            settings={settings}
            generatedGeometry={generatedGeometry}
            mode={viewMode}
        />
        
        {/* Overlay Message if in Preview Mode */}
        {viewMode === ViewMode.PREVIEW && generatedGeometry && !isGenerating && (
            <div className="absolute top-4 left-4 bg-yellow-600/90 text-white px-4 py-2 rounded shadow-lg text-sm z-10 backdrop-blur">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Settings changed. Click <strong>Generate Model</strong> to update result.
            </div>
        )}
      </main>
    </div>
  );
};

export default App;