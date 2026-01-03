import React, { useEffect, useState, useMemo } from 'react';
import { TextSettings, FontLibrary, FontVariant, SupportType } from '../types';

interface ControlsProps {
  settings: TextSettings;
  setSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
  onDownload: () => void;
  isGenerating: boolean;
  hasResult: boolean;
  fontLibrary: FontLibrary;
  showAdvanced: boolean;
  toggleAdvanced: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  settings,
  setSettings,
  onDownload,
  isGenerating,
  hasResult,
  fontLibrary,
  showAdvanced,
  toggleAdvanced
}) => {
  const handleChange = <K extends keyof TextSettings>(key: K, value: TextSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const text1Len = [...settings.text1].length;
  const text2Len = [...settings.text2].length;
  
  const lengthMismatch = text1Len !== text2Len;
  const truncateLength = Math.min(text1Len, text2Len);

  const currentFamily = useMemo(() => {
     for (const [family, variants] of Object.entries(fontLibrary)) {
         if ((variants as FontVariant[]).some(v => v.url === settings.fontUrl)) return family;
     }
     return Object.keys(fontLibrary)[0] || "";
  }, [settings.fontUrl, fontLibrary]);

  const [selectedFamily, setSelectedFamily] = useState(currentFamily);

  useEffect(() => {
    if (currentFamily && currentFamily !== selectedFamily) {
        setSelectedFamily(currentFamily);
    }
  }, [currentFamily]);

  const handleFamilyChange = (family: string) => {
      setSelectedFamily(family);
      const variants = fontLibrary[family];
      if (variants && variants.length > 0) {
          const preferred = variants.find(v => v.name.includes('Bold')) || variants.find(v => v.name.includes('Regular')) || variants[0];
          handleChange('fontUrl', preferred.url);
      }
  };

  const availableVariants = fontLibrary[selectedFamily] || [];

  return (
    <div className="w-full md:w-80 bg-gray-800 p-6 flex flex-col gap-6 overflow-y-auto h-full border-r border-gray-700 shadow-xl z-20 custom-scrollbar shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          TextTango Web
        </h1>
        <p className="text-gray-400 text-sm">
          3D Optical Illusion Generator
        </p>
      </div>

      {/* Text Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Text 1 (Left) <span className="text-gray-600">|</span> <span className="text-gray-500">{text1Len} chars</span>
          </label>
          <input
            type="text"
            maxLength={30}
            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            value={settings.text1}
            onChange={(e) => handleChange('text1', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Text 2 (Right) <span className="text-gray-600">|</span> <span className="text-gray-500">{text2Len} chars</span>
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
                    <strong>Length Mismatch</strong>
                    <p>Result truncated to {truncateLength} chars.</p>
                </div>
            </div>
        )}
      </div>

      <hr className="border-gray-700" />
      
      {/* Font */}
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
             <span className="text-[10px] text-gray-500 uppercase">Variant</span>
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
      </div>

      <hr className="border-gray-700" />

      {/* Basic Settings */}
      <div className="space-y-4">
        <h3 className="text-gray-200 font-bold text-sm">Global Dimensions</h3>
        <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Font Size</label>
                <input type="number" className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-white text-xs"
                    value={settings.fontSize} onChange={(e) => handleChange('fontSize', Number(e.target.value))} />
            </div>
            <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Gap %</label>
                <input type="number" step="0.05" className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-white text-xs"
                    value={settings.spacing} onChange={(e) => handleChange('spacing', Number(e.target.value))} />
            </div>
        </div>
      </div>

      <hr className="border-gray-700" />

      {/* Base Settings */}
      <div className="space-y-4">
          <h3 className="text-gray-200 font-bold text-sm">Base Configuration</h3>
          
          <div>
            <label className="text-[10px] text-gray-500 uppercase block mb-1">Shape</label>
            <div className="flex bg-gray-700 rounded p-1">
                <button 
                    onClick={() => handleChange('baseType', 'RECTANGLE')}
                    className={`flex-1 text-xs py-1.5 rounded transition-colors ${settings.baseType === 'RECTANGLE' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >Rect</button>
                <button 
                    onClick={() => handleChange('baseType', 'OVAL')}
                    className={`flex-1 text-xs py-1.5 rounded transition-colors ${settings.baseType === 'OVAL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >Oval</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Height</label>
                <input type="number" step="0.5" className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-white text-xs"
                    value={settings.baseHeight} onChange={(e) => handleChange('baseHeight', Number(e.target.value))} />
             </div>
             <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Padding</label>
                <input type="number" step="1" className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-white text-xs"
                    value={settings.basePadding} onChange={(e) => handleChange('basePadding', Number(e.target.value))} />
             </div>
          </div>

          <div>
            <label className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Embed Depth</span>
                <span>{settings.embedDepth}</span>
            </label>
            <input
                type="range" min="-2" max="5" step="0.1"
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                value={settings.embedDepth}
                onChange={(e) => handleChange('embedDepth', Number(e.target.value))}
            />
          </div>
      </div>

      <hr className="border-gray-700" />
      
      {/* Global Support Defaults */}
      <div className="space-y-3">
         <div className="flex items-center justify-between">
            <h3 className="text-gray-200 font-bold text-sm">Global Supports</h3>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.supportEnabled} onChange={(e) => handleChange('supportEnabled', e.target.checked)} />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
         </div>
         {settings.supportEnabled && (
             <div className="bg-gray-700/30 p-2 rounded space-y-2">
                 <select 
                    className="w-full bg-gray-900 text-white text-xs rounded p-1 border border-gray-600"
                    value={settings.supportType}
                    onChange={(e) => handleChange('supportType', e.target.value as SupportType)}
                 >
                    <option value="CYLINDER">Cylinder</option>
                    <option value="SQUARE">Square</option>
                 </select>
                 <div className="grid grid-cols-2 gap-2">
                     <div>
                         <label className="text-[9px] uppercase text-gray-500">Height</label>
                         <input type="number" step="0.5" className="w-full bg-gray-900 text-xs p-1 rounded border border-gray-600"
                            value={settings.supportHeight} onChange={(e) => handleChange('supportHeight', Number(e.target.value))} />
                     </div>
                     <div>
                         <label className="text-[9px] uppercase text-gray-500">Radius</label>
                         <input type="number" step="0.5" className="w-full bg-gray-900 text-xs p-1 rounded border border-gray-600"
                            value={settings.supportRadius} onChange={(e) => handleChange('supportRadius', Number(e.target.value))} />
                     </div>
                 </div>
             </div>
         )}
      </div>

      <div className="mt-auto pt-2 space-y-2">
        <button
            onClick={toggleAdvanced}
            className={`w-full py-2 px-3 rounded font-semibold text-xs transition-colors border ${showAdvanced ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
        >
            <i className="fas fa-sliders-h mr-2"></i>
            {showAdvanced ? 'Close Advanced' : 'Open Advanced Controls'}
        </button>

        <button
          onClick={onDownload}
          disabled={!hasResult || isGenerating}
          className={`w-full py-3 px-4 rounded font-bold text-white transition-all flex items-center justify-center gap-2
            ${!hasResult || isGenerating
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600' 
              : 'bg-green-600 hover:bg-green-500 shadow-lg'}`}
        >
           {isGenerating ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-download"></i>}
           {isGenerating ? ' Processing...' : ' Download STL'}
        </button>
      </div>
    </div>
  );
};

export default Controls;