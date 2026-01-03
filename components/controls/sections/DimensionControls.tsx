import React from 'react';
import { TextSettings } from '../../../types';
import { Accordion } from '../../shared/Accordion';

interface DimensionControlsProps {
    settings: TextSettings;
    onChange: <K extends keyof TextSettings>(key: K, value: TextSettings[K]) => void;
}

export const DimensionControls: React.FC<DimensionControlsProps> = ({ settings, onChange }) => {
    return (
        <Accordion title="Dimensions" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Font Size</label>
                    <input type="number" className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-white text-xs"
                        value={settings.fontSize} onChange={(e) => onChange('fontSize', Number(e.target.value))} />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Gap Factor</label>
                    <input type="number" step="0.05" className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-white text-xs"
                        value={settings.spacing} onChange={(e) => onChange('spacing', Number(e.target.value))} />
                </div>
            </div>
        </Accordion>
    );
};