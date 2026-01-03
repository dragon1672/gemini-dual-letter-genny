import React from 'react';
import { TextSettings, SupportType } from '../../../types';
import { Accordion } from '../../shared/Accordion';

interface SupportControlsProps {
    settings: TextSettings;
    onChange: <K extends keyof TextSettings>(key: K, value: TextSettings[K]) => void;
}

export const SupportControls: React.FC<SupportControlsProps> = ({ settings, onChange }) => {
    return (
        <Accordion title="Supports (Global)" defaultOpen={false}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-300">Enable Supports</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.supportEnabled} onChange={(e) => onChange('supportEnabled', e.target.checked)} />
                    <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0px] after:left-[0px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
            {settings.supportEnabled && (
                <div className="space-y-3">
                    <select 
                        className="w-full bg-gray-900 text-white text-xs rounded p-1.5 border border-gray-600"
                        value={settings.supportType}
                        onChange={(e) => onChange('supportType', e.target.value as SupportType)}
                    >
                        <option value="CYLINDER">Cylinder</option>
                        <option value="SQUARE">Square</option>
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[9px] uppercase text-gray-500">Height</label>
                            <input type="number" step="0.5" className="w-full bg-gray-900 text-xs p-1.5 rounded border border-gray-600"
                                value={settings.supportHeight} onChange={(e) => onChange('supportHeight', Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-[9px] uppercase text-gray-500">Radius</label>
                            <input type="number" step="0.5" className="w-full bg-gray-900 text-xs p-1.5 rounded border border-gray-600"
                                value={settings.supportRadius} onChange={(e) => onChange('supportRadius', Number(e.target.value))} />
                        </div>
                    </div>
                </div>
            )}
        </Accordion>
    );
};