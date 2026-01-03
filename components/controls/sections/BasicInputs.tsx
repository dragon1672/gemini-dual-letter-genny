import React from 'react';
import { TextSettings } from '../../../types';

interface BasicInputsProps {
    settings: TextSettings;
    onChange: <K extends keyof TextSettings>(key: K, value: TextSettings[K]) => void;
}

export const BasicInputs: React.FC<BasicInputsProps> = ({ settings, onChange }) => {
    const text1Len = [...settings.text1].length;
    const text2Len = [...settings.text2].length;
    const lengthMismatch = text1Len !== text2Len;
    const truncateLength = Math.min(text1Len, text2Len);

    return (
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
                    onChange={(e) => onChange('text1', e.target.value)}
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
                    onChange={(e) => onChange('text2', e.target.value)}
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
    );
};