import React, { useEffect, useState, useMemo } from 'react';
import { TextSettings, FontLibrary, FontVariant } from '../types';

interface ControlsProps {
  settings: TextSettings;
  setSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
  onGenerate: () => void;
  onDownload: () => void;
  isGenerating: boolean;
  hasResult: boolean;
  fontLibrary: FontLibrary;
}

const Controls: React.FC<ControlsProps> = ({
  settings,
  setSettings,
  onGenerate,
  onDownload,
  isGenerating,
  hasResult,
  fontLibrary,
}) => {
  const handleChange = <K extends keyof TextSettings>(key: K, value: TextSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const text1Len = [...settings.text1].length;
  const text2Len = [...settings.text2].length;
  
  const lengthMismatch = text1Len !== text2Len;
  const truncateLength = Math.min(text1Len, text2Len);

  // Determine current family based on URL
  const currentFamily = useMemo(() => {
     for (const [family, variants] of Object.entries(fontLibrary)) {
         if ((variants as FontVariant[]).some(v => v.url === settings.fontUrl)) return family;
     }
     return Object.keys(fontLibrary)[0] || "";
  }, [settings.fontUrl, fontLibrary]);

  const [selectedFamily, setSelectedFamily] = useState(currentFamily);

  // Sync selected family if URL changes externally or on init
  useEffect(() => {
    if (currentFamily && currentFamily !== selectedFamily) {
        setSelectedFamily(currentFamily);
    }
  }, [currentFamily]);

  const handleFamilyChange = (family: string) => {
      setSelectedFamily(family);
      // Auto-select best variant (Bold preferred for 3D printing, else Regular)
      const variants = fontLibrary[family];
      if (variants && variants.length > 0) {
          const preferred = variants.find(v => v.name.includes('Bold')) || variants.find(v => v.name.includes('Regular')) || variants[0];
          handleChange('fontUrl', preferred.url);
      }
  };

  // Sync mask length
  useEffect(() => {
     if (settings.supportEnabled && settings.supportMask.length === 0) {
         const len = Math.max(text1Len, text2Len);
         const defaultMask = Array(len).fill('_').join('');
         handleChange('supportMask', defaultMask);
     }
  }, [settings.supportEnabled]);

  const availableVariants = fontLibrary[selectedFamily] || [];

  return (
    <div className="w-full md:w-96 bg-gray-800 p-6 flex flex-col gap-6 overflow-y-auto h-full border-r border-gray-700 shadow-xl z-10 custom-scrollbar">
      <div>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          TextTango Web
        </h1>
        <p className="text-gray-400 text-sm">
          Create 3D Optical Illusion Text
        </p>
      </div>

      {/* Text Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Text 1 (Visible from Left)
            <span className="ml-2 text-gray-500 text-[10px]">{text1Len} chars</span>
          </label>
          <input
            type="text"
            maxLength={30} // Higher visual limit, real limit logic is handled by user awareness
            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            value={settings.text1}
            onChange={(e) => handleChange('text1', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Text 2 (Visible from Right)
             <span className="ml-2 text-gray-500 text-[10px]">{text2Len} chars</span>
          </label>
          <input
            type="text"
            maxLength={30}
            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            value={settings.text2}
            onChange={(e) => handleChange('text2', e.target.value)}
          />
        </div>
        
        {lengthMismatch && (
            <div className="bg-orange-900/40 border border-orange-700 text-orange-200 px-3 py-2 rounded text-xs flex items-start gap-2">
                <i className="fas fa-exclamation-triangle mt-0.5"></i>
                <div>
                    <strong>Length Mismatch!</strong>
                    <p>Text will be truncated to {truncateLength} characters.</p>
                </div>
            </div>
        )}
      </div>

      <hr className="border-gray-700" />
      
      {/* Font Selection */}
      <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-400">Typography</label>
          
          <div>
            <span className="text-[10px] text-gray-500 uppercase">Font Family</span>
            <select 
                className="w-full bg-gray-700 text-white text-xs rounded p-2 border border-gray-600 outline-none mt-1"
                value={selectedFamily}
                onChange={(e) => handleFamilyChange(e.target.value)}
            >
                {Object.keys(fontLibrary).map((family) => (
                    <option key={family} value={family}>{family}</option>
                ))}
            </select>
          </div>

          <div>
             <span className="text-[10px] text-gray-500 uppercase">Style / Variant</span>
             <select 
                className="w-full bg-gray-700 text-white text-xs rounded p-2 border border-gray-600 outline-none mt-1 disabled:opacity-50"
                value={settings.fontUrl}
                onChange={(e) => handleChange('fontUrl', e.target.value)}
                disabled={availableVariants.length === 0}
            >
                {availableVariants.map((v, i) => (
                    <option key={i} value={v.url}>{v.name}</option>
                ))}
            </select>
          </div>
          
          <p className="text-[10px] text-gray-500 mt-2">
            Loaded {Object.keys(fontLibrary).length} font families.
          </p>
      </div>

      <hr className="border-gray-700" />

      {/* Basic Sliders */}
      <div className="space-y-5">
        <h3 className="text-gray-200 font-bold text-sm">Dimensions</h3>
        
        <div>
          <label className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Font Size</span>
            <span className="text-gray-300">{settings.fontSize}</span>
          </label>
          <input
            type="range"
            min="10"
            max="50"
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            value={settings.fontSize}
            onChange={(e) => handleChange('fontSize', Number(e.target.value))}
          />
        </div>

        <div>
          <label className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Letter Gap</span>
            <span className="text-gray-300">{Math.round(settings.spacing * 100)}%</span>
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            value={settings.spacing}
            onChange={(e) => handleChange('spacing', Number(e.target.value))}
          />
        </div>

        <div>
          <label className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Base Height</span>
            <span className="text-gray-300">{settings.baseHeight}</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            value={settings.baseHeight}
            onChange={(e) => handleChange('baseHeight', Number(e.target.value))}
          />
        </div>
        
         <div>
          <label className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Base Padding</span>
            <span className="text-gray-300">{settings.basePadding}</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            value={settings.basePadding}
            onChange={(e) => handleChange('basePadding', Number(e.target.value))}
          />
        </div>
      </div>

      <hr className="border-gray-700" />

      {/* Advanced Support */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-gray-200 font-bold text-sm">Reinforcement</h3>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.supportEnabled} onChange={(e) => handleChange('supportEnabled', e.target.checked)} />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>

        {settings.supportEnabled && (
            <div className="bg-gray-700/30 p-3 rounded space-y-3">
                 <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Support Mask
                    </label>
                    <input
                        type="text"
                        className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-xs text-white font-mono tracking-widest"
                        value={settings.supportMask}
                        placeholder="X_X"
                        onChange={(e) => handleChange('supportMask', e.target.value.toUpperCase())}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                        Use 'X' to add support for a letter, '_' for none.
                    </p>
                </div>
                 <div>
                    <label className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Radius</span>
                        <span className="text-gray-300">{settings.supportRadius}</span>
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        value={settings.supportRadius}
                        onChange={(e) => handleChange('supportRadius', Number(e.target.value))}
                    />
                </div>
                 <div>
                    <label className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Height</span>
                        <span className="text-gray-300">{settings.supportHeight}</span>
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="20"
                        step="0.5"
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        value={settings.supportHeight}
                        onChange={(e) => handleChange('supportHeight', Number(e.target.value))}
                    />
                </div>
            </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full py-3 px-4 rounded font-bold text-white transition-all flex items-center justify-center gap-2
            ${isGenerating 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg'}`}
        >
          {isGenerating ? (
            <>
              <i className="fas fa-circle-notch fa-spin"></i> Processing...
            </>
          ) : (
            <>
              <i className="fas fa-cube"></i> Generate Model
            </>
          )}
        </button>

        <button
          onClick={onDownload}
          disabled={!hasResult || isGenerating}
          className={`w-full py-3 px-4 rounded font-bold text-white transition-all flex items-center justify-center gap-2
            ${!hasResult || isGenerating
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600' 
              : 'bg-green-600 hover:bg-green-500 shadow-lg'}`}
        >
           <i className="fas fa-download"></i> Download STL
        </button>
      </div>
    </div>
  );
};

export default Controls;