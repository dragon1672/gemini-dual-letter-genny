import React, { useState } from 'react';
import { TextSettings, FontLibrary, SupportType } from '../types';
import { VirtualFontSelector } from './VirtualFontSelector';

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

// --- Helper Components ---

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-700 rounded bg-gray-800/50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 text-xs font-bold text-gray-300 hover:bg-gray-700/50 transition-colors uppercase tracking-wider"
            >
                <span>{title}</span>
                <i className={`fas fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && <div className="p-4 border-t border-gray-700 space-y-4">{children}</div>}
        </div>
    );
};

// --- Main Controls ---

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

  // Combine text for preview
  const previewText = `${settings.text1} ${settings.text2}`.trim() || "Preview";

  return (
    <div className="w-full md:w-80 bg-gray-800 p-4 flex flex-col gap-4 overflow-y-auto h-full border-r border-gray-700 shadow-xl z-20 custom-scrollbar shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-1">
          TextTango
        </h1>
        <p className="text-gray-400 text-xs">
          Dual Text Illusion Generator
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Text 1 (Front) <span className="text-gray-600">|</span> <span className="text-gray-500">{text1Len}</span>
          </label>
          <input
            type="text"
            maxLength={30}
            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
            value={settings.text1}
            onChange={(e) => handleChange('text1', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Text 2 (Side) <span className="text-gray-600">|</span> <span className="text-gray-500">{text2Len}</span>
          </label>
          <input
            type="text"
            maxLength={30}
            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
            value={settings.text2}
            onChange={(e) => handleChange('text2', e.target.value)}
          />
        </div>
        
        {lengthMismatch && (
            <div className="bg-orange-900/40 border border-orange-700 text-orange-200 px-3 py-2 rounded text-[10px] flex items-start gap-2">
                <i className="fas fa-exclamation-triangle mt-0.5"></i>
                <div>
                    <strong>Length Mismatch</strong>
                    <p>Result truncated to {truncateLength} chars.</p>
                </div>
            </div>
        )}
      </div>

      <Accordion title="Typography" defaultOpen={true}>
          <div>
            <span className="text-[10px] text-gray-500 uppercase block mb-1">Global Font</span>
            <VirtualFontSelector 
                fontLibrary={fontLibrary}
                currentUrl={settings.fontUrl}
                onSelect={(url) => handleChange('fontUrl', url)}
                previewText={previewText}
            />
          </div>
      </Accordion>

      <Accordion title="Dimensions" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Font Size</label>
                <input type="number" className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-white text-xs"
                    value={settings.fontSize} onChange={(e) => handleChange('fontSize', Number(e.target.value))} />
            </div>
            <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Gap Factor</label>
                <input type="number" step="0.05" className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-white text-xs"
                    value={settings.spacing} onChange={(e) => handleChange('spacing', Number(e.target.value))} />
            </div>
        </div>
      </Accordion>

      <Accordion title="Base Config" defaultOpen={false}>
          <div>
            <label className="text-[10px] text-gray-500 uppercase block mb-1">Shape</label>
            <div className="flex bg-gray-900 rounded p-1 border border-gray-600">
                <button 
                    onClick={() => handleChange('baseType', 'RECTANGLE')}
                    className={`flex-1 text-xs py-1 rounded transition-colors ${settings.baseType === 'RECTANGLE' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >Rect</button>
                <button 
                    onClick={() => handleChange('baseType', 'OVAL')}
                    className={`flex-1 text-xs py-1 rounded transition-colors ${settings.baseType === 'OVAL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >Oval</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Height</label>
                <input type="number" step="0.5" className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-white text-xs"
                    value={settings.baseHeight} onChange={(e) => handleChange('baseHeight', Number(e.target.value))} />
             </div>
             <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Padding</label>
                <input type="number" step="1" className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-white text-xs"
                    value={settings.basePadding} onChange={(e) => handleChange('basePadding', Number(e.target.value))} />
             </div>
          </div>

          <div>
            <label className="flex justify-between text-[10px] text-gray-500 uppercase mb-1">
                <span>Embed Depth (Global)</span>
                <span className="text-white">{settings.embedDepth}</span>
            </label>
            <input
                type="range" min="-2" max="10" step="0.1"
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                value={settings.embedDepth}
                onChange={(e) => handleChange('embedDepth', Number(e.target.value))}
            />
          </div>

          {settings.baseType === 'RECTANGLE' && (
              <div>
                <label className="flex justify-between text-[10px] text-gray-500 uppercase mb-1">
                    <span>Corner Radius</span>
                    <span className="text-white">{settings.baseCornerRadius}</span>
                </label>
                <input
                    type="range" min="0" max="20" step="0.5"
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    value={settings.baseCornerRadius}
                    onChange={(e) => handleChange('baseCornerRadius', Number(e.target.value))}
                />
              </div>
          )}
      </Accordion>

      <Accordion title="Supports (Global)" defaultOpen={false}>
         <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-300">Enable Supports</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.supportEnabled} onChange={(e) => handleChange('supportEnabled', e.target.checked)} />
                <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0px] after:left-[0px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
         </div>
         {settings.supportEnabled && (
             <div className="space-y-3">
                 <select 
                    className="w-full bg-gray-900 text-white text-xs rounded p-1.5 border border-gray-600"
                    value={settings.supportType}
                    onChange={(e) => handleChange('supportType', e.target.value as SupportType)}
                 >
                    <option value="CYLINDER">Cylinder</option>
                    <option value="SQUARE">Square</option>
                 </select>
                 <div className="grid grid-cols-2 gap-3">
                     <div>
                         <label className="text-[9px] uppercase text-gray-500">Height</label>
                         <input type="number" step="0.5" className="w-full bg-gray-900 text-xs p-1.5 rounded border border-gray-600"
                            value={settings.supportHeight} onChange={(e) => handleChange('supportHeight', Number(e.target.value))} />
                     </div>
                     <div>
                         <label className="text-[9px] uppercase text-gray-500">Radius</label>
                         <input type="number" step="0.5" className="w-full bg-gray-900 text-xs p-1.5 rounded border border-gray-600"
                            value={settings.supportRadius} onChange={(e) => handleChange('supportRadius', Number(e.target.value))} />
                     </div>
                 </div>
             </div>
         )}
      </Accordion>

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