import React, { useMemo } from 'react';
import { TextSettings, FontLibrary } from '../../../types';
import { VirtualFontSelector } from '../../VirtualFontSelector';
import { Accordion } from '../../shared/Accordion';

interface TypographyControlsProps {
    settings: TextSettings;
    onChange: <K extends keyof TextSettings>(key: K, value: TextSettings[K]) => void;
    fontLibrary: FontLibrary;
}

export const TypographyControls: React.FC<TypographyControlsProps> = ({ settings, onChange, fontLibrary }) => {
    const previewText = `${settings.text1} ${settings.text2}`.trim() || "Preview";

    const currentVariants = useMemo(() => {
        if (!settings.fontUrl) return [];
        for (const variants of Object.values(fontLibrary)) {
            if (variants.some(v => v.url === settings.fontUrl)) {
                return variants;
            }
        }
        return [];
    }, [settings.fontUrl, fontLibrary]);

    return (
        <Accordion title="Typography" defaultOpen={true}>
            <div className="space-y-3">
                <div>
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">Global Font</span>
                    <VirtualFontSelector 
                        fontLibrary={fontLibrary}
                        currentUrl={settings.fontUrl}
                        onSelect={(url) => onChange('fontUrl', url)}
                        previewText={previewText}
                    />
                </div>
                
                {currentVariants.length > 1 && (
                    <div className="animate-fade-in">
                        <label className="text-[10px] text-gray-500 uppercase block mb-1">Weight / Style</label>
                        <div className="relative">
                            <select 
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs text-white appearance-none focus:border-blue-500 outline-none cursor-pointer"
                                value={settings.fontUrl}
                                onChange={(e) => onChange('fontUrl', e.target.value)}
                            >
                                {currentVariants.map((v) => (
                                    <option key={v.url} value={v.url}>{v.name}</option>
                                ))}
                            </select>
                            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] pointer-events-none"></i>
                        </div>
                    </div>
                )}
            </div>
        </Accordion>
    );
};