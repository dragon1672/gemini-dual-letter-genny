import React from 'react';
import { TextSettings } from '../../../types';
import { Accordion } from '../../shared/Accordion';

interface BaseControlsProps {
    settings: TextSettings;
    onChange: <K extends keyof TextSettings>(key: K, value: TextSettings[K]) => void;
}

export const BaseControls: React.FC<BaseControlsProps> = ({ settings, onChange }) => {
    return (
        <Accordion title="Base Config" defaultOpen={false}>
            <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Shape</label>
                <div className="flex bg-gray-900 rounded p-1 border border-gray-600">
                    <button 
                        onClick={() => onChange('baseType', 'RECTANGLE')}
                        className={`flex-1 text-xs py-1 rounded transition-colors ${settings.baseType === 'RECTANGLE' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >Rect</button>
                    <button 
                        onClick={() => onChange('baseType', 'OVAL')}
                        className={`flex-1 text-xs py-1 rounded transition-colors ${settings.baseType === 'OVAL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >Oval</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Height</label>
                    <input type="number" step="0.5" className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-white text-xs"
                        value={settings.baseHeight} onChange={(e) => onChange('baseHeight', Number(e.target.value))} />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Padding</label>
                    <input type="number" step="1" className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-white text-xs"
                        value={settings.basePadding} onChange={(e) => onChange('basePadding', Number(e.target.value))} />
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
                    onChange={(e) => onChange('embedDepth', Number(e.target.value))}
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
                        onChange={(e) => onChange('baseCornerRadius', Number(e.target.value))}
                    />
                </div>
            )}
        </Accordion>
    );
};