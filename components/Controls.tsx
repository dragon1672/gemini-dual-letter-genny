import React from 'react';
import { TextSettings, FontLibrary } from '../types';
import { BasicInputs } from './controls/sections/BasicInputs';
import { TypographyControls } from './controls/sections/TypographyControls';
import { DimensionControls } from './controls/sections/DimensionControls';
import { BaseControls } from './controls/sections/BaseControls';
import { SupportControls } from './controls/sections/SupportControls';

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

      <BasicInputs settings={settings} onChange={handleChange} />
      <TypographyControls settings={settings} onChange={handleChange} fontLibrary={fontLibrary} />
      <DimensionControls settings={settings} onChange={handleChange} />
      <BaseControls settings={settings} onChange={handleChange} />
      <SupportControls settings={settings} onChange={handleChange} />

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