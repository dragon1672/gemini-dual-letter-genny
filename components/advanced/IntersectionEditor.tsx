
import React, { useMemo } from 'react';
import { IntersectionConfig, TextSettings, SupportType, FontLibrary, CharTransform } from '../../types';
import { Accordion } from '../shared/Accordion';
import { VirtualFontSelector } from '../VirtualFontSelector';

interface IntersectionEditorProps {
    selectedIdx: number;
    selectedConfig: IntersectionConfig;
    updateConfig: (index: number, updates: Partial<IntersectionConfig> | ((prev: IntersectionConfig) => Partial<IntersectionConfig>)) => void;
    resetConfig: (index: number) => void;
    fontLibrary: FontLibrary;
    settings: TextSettings;
}

// Helper to get variants for a URL
const getVariantsForUrl = (fontLibrary: FontLibrary, url?: string) => {
    if (!url) return [];
    for (const variants of Object.values(fontLibrary)) {
        if (variants.some(v => v.url === url)) {
            return variants;
        }
    }
    return [];
};

const TransformInputs = ({ 
    label, 
    values, 
    onChange 
}: { 
    label: string, 
    values: CharTransform, 
    onChange: (v: Partial<CharTransform>) => void 
}) => (
    <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
        <label className="text-[9px] uppercase text-gray-400 block mb-2 font-bold">{label}</label>
        <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="text-[9px] uppercase text-gray-500">Scale X</label>
                <input type="number" step="0.1" className="w-full bg-gray-900 text-xs p-1 rounded border border-gray-600 text-white"
                    value={values.scaleX}
                    onChange={(e) => onChange({ scaleX: Number(e.target.value) })}
                />
            </div>
            <div>
                <label className="text-[9px] uppercase text-gray-500">Scale Y</label>
                <input type="number" step="0.1" className="w-full bg-gray-900 text-xs p-1 rounded border border-gray-600 text-white"
                    value={values.scaleY}
                    onChange={(e) => onChange({ scaleY: Number(e.target.value) })}
                />
            </div>
            <div>
                <label className="text-[9px] uppercase text-gray-500">Move X</label>
                <input type="number" step="0.1" className="w-full bg-gray-900 text-xs p-1 rounded border border-gray-600 text-white"
                    value={values.moveX}
                    onChange={(e) => onChange({ moveX: Number(e.target.value) })}
                />
            </div>
            <div>
                <label className="text-[9px] uppercase text-gray-500">Move Y</label>
                <input type="number" step="0.1" className="w-full bg-gray-900 text-xs p-1 rounded border border-gray-600 text-white"
                    value={values.moveY}
                    onChange={(e) => onChange({ moveY: Number(e.target.value) })}
                />
            </div>
        </div>
    </div>
);

export const IntersectionEditor: React.FC<IntersectionEditorProps> = ({ 
    selectedIdx, 
    selectedConfig, 
    updateConfig, 
    resetConfig, 
    fontLibrary, 
    settings 
}) => {
    
    // Get variants for current selection
    const char1Variants = useMemo(() => 
        getVariantsForUrl(fontLibrary, selectedConfig.char1FontUrl || selectedConfig.fontUrl),
        [selectedConfig.char1FontUrl, selectedConfig.fontUrl, fontLibrary]
    );

    const char2Variants = useMemo(() => 
        getVariantsForUrl(fontLibrary, selectedConfig.char2FontUrl || selectedConfig.fontUrl),
        [selectedConfig.char2FontUrl, selectedConfig.fontUrl, fontLibrary]
    );

    return (
        <div className="p-4 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-300">
                    Editing: <span className="text-lg mx-1 font-mono text-white">{selectedConfig.char1}/{selectedConfig.char2}</span>
                </span>
                <div className="flex gap-2">
                    <button onClick={() => resetConfig(selectedIdx)} className="text-[10px] text-red-400 hover:text-red-300 underline">Reset</button>
                </div>
            </div>
            
            <Accordion title="Typography & Depth" contentClassName="p-3">
                <div className="space-y-4">
                    {/* Left Character Font */}
                    <div>
                        <label className="text-[9px] uppercase text-blue-300 block mb-1">Left Char Font ({selectedConfig.char1})</label>
                        <VirtualFontSelector 
                            fontLibrary={fontLibrary}
                            currentUrl={selectedConfig.char1FontUrl || selectedConfig.fontUrl}
                            onSelect={(url) => updateConfig(selectedIdx, { char1FontUrl: url })}
                            previewText={selectedConfig.char1 || "A"}
                            placeholder="(Global)"
                        />
                        {char1Variants.length > 1 && (
                            <div className="mt-1 relative">
                                <select 
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 text-xs text-gray-300 appearance-none focus:border-blue-500 outline-none cursor-pointer"
                                    value={selectedConfig.char1FontUrl || selectedConfig.fontUrl}
                                    onChange={(e) => updateConfig(selectedIdx, { char1FontUrl: e.target.value })}
                                >
                                    {char1Variants.map((v) => (
                                        <option key={v.url} value={v.url}>{v.name}</option>
                                    ))}
                                </select>
                                <i className="fas fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[9px] pointer-events-none"></i>
                            </div>
                        )}
                    </div>

                    {/* Right Character Font */}
                    <div>
                        <label className="text-[9px] uppercase text-pink-300 block mb-1">Right Char Font ({selectedConfig.char2})</label>
                        <VirtualFontSelector 
                            fontLibrary={fontLibrary}
                            currentUrl={selectedConfig.char2FontUrl || selectedConfig.fontUrl}
                            onSelect={(url) => updateConfig(selectedIdx, { char2FontUrl: url })}
                            previewText={selectedConfig.char2 || "B"}
                            placeholder="(Global)"
                        />
                        {char2Variants.length > 1 && (
                            <div className="mt-1 relative">
                                <select 
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 text-xs text-gray-300 appearance-none focus:border-blue-500 outline-none cursor-pointer"
                                    value={selectedConfig.char2FontUrl || selectedConfig.fontUrl}
                                    onChange={(e) => updateConfig(selectedIdx, { char2FontUrl: e.target.value })}
                                >
                                    {char2Variants.map((v) => (
                                        <option key={v.url} value={v.url}>{v.name}</option>
                                    ))}
                                </select>
                                <i className="fas fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[9px] pointer-events-none"></i>
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <div className="flex justify-between text-[9px] text-gray-500 uppercase mb-1">
                            <span>Embed Depth Override</span>
                            <span className="text-white">{selectedConfig.embedDepth ?? "(Global)"}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <input
                                type="range" min="-2" max="10" step="0.1"
                                className="flex-1 h-1 bg-gray-700 rounded appearance-none cursor-pointer"
                                value={selectedConfig.embedDepth ?? settings.embedDepth}
                                onChange={(e) => updateConfig(selectedIdx, { embedDepth: Number(e.target.value) })}
                            />
                            <button 
                                onClick={() => updateConfig(selectedIdx, { embedDepth: undefined })}
                                className="text-[10px] text-gray-500 hover:text-white"
                                title="Reset to global"
                            >
                                <i className="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </Accordion>

            <Accordion title="Character Transforms" contentClassName="p-3">
                <div className="space-y-3">
                     <TransformInputs 
                        label={`Transform ${selectedConfig.char1} (Blue)`}
                        values={selectedConfig.char1Transform}
                        onChange={(v) => updateConfig(selectedIdx, c => ({ char1Transform: { ...c.char1Transform, ...v } }))}
                     />
                     <TransformInputs 
                        label={`Transform ${selectedConfig.char2} (Pink)`}
                        values={selectedConfig.char2Transform}
                        onChange={(v) => updateConfig(selectedIdx, c => ({ char2Transform: { ...c.char2Transform, ...v } }))}
                     />
                </div>
            </Accordion>

            <Accordion title="Pair Positioning" contentClassName="p-3">
                <div className="grid grid-cols-2 gap-3">
                        <div>
                        <label className="text-[9px] uppercase text-gray-500">Offset X</label>
                        <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                            value={selectedConfig.pairSpacing.x}
                            onChange={(e) => updateConfig(selectedIdx, c => ({ pairSpacing: { ...c.pairSpacing, x: Number(e.target.value) } }))}
                        />
                        </div>
                        <div>
                        <label className="text-[9px] uppercase text-gray-500">Offset Z</label>
                        <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                            value={selectedConfig.pairSpacing.z}
                            onChange={(e) => updateConfig(selectedIdx, c => ({ pairSpacing: { ...c.pairSpacing, z: Number(e.target.value) } }))}
                        />
                        </div>
                </div>
            </Accordion>

            <Accordion title="Bridge & Connection" contentClassName="p-3">
                    <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Enable Bridge</span>
                    <input 
                        type="checkbox" 
                        checked={selectedConfig.bridge?.enabled ?? false}
                        onChange={(e) => updateConfig(selectedIdx, c => ({ bridge: { ...c.bridge, enabled: e.target.checked } }))}
                    />
                </div>

                {selectedConfig.bridge?.enabled && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2 bg-gray-800 p-2 rounded">
                            <input 
                                type="checkbox"
                                id="autoBridge"
                                checked={selectedConfig.bridge.auto}
                                onChange={(e) => updateConfig(selectedIdx, c => ({ bridge: { ...c.bridge, auto: e.target.checked } }))}
                            />
                            <label htmlFor="autoBridge" className="text-[10px] text-blue-300 font-bold uppercase cursor-pointer">Auto-Detect & Connect</label>
                        </div>

                        {!selectedConfig.bridge.auto && (
                            <>
                            <div className="grid grid-cols-3 gap-2">
                                    <div>
                                    <label className="text-[9px] uppercase text-gray-500">Width</label>
                                    <input type="number" step="0.5" className="w-full bg-gray-900 text-xs p-1 rounded border border-gray-600"
                                        value={selectedConfig.bridge.width}
                                        onChange={(e) => updateConfig(selectedIdx, c => ({ bridge: { ...c.bridge, width: Number(e.target.value) } }))}
                                    />
                                    </div>
                                    <div>
                                    <label className="text-[9px] uppercase text-gray-500">Height</label>
                                    <input type="number" step="0.5" className="w-full bg-gray-900 text-xs p-1 rounded border border-gray-600"
                                        value={selectedConfig.bridge.height}
                                        onChange={(e) => updateConfig(selectedIdx, c => ({ bridge: { ...c.bridge, height: Number(e.target.value) } }))}
                                    />
                                    </div>
                                    <div>
                                    <label className="text-[9px] uppercase text-gray-500">Depth</label>
                                    <input type="number" step="0.5" className="w-full bg-gray-900 text-xs p-1 rounded border border-gray-600"
                                        value={selectedConfig.bridge.depth}
                                        onChange={(e) => updateConfig(selectedIdx, c => ({ bridge: { ...c.bridge, depth: Number(e.target.value) } }))}
                                    />
                                    </div>
                            </div>
                            </>
                        )}
                    </div>
                )}
            </Accordion>

            <Accordion title="Support Pillar" contentClassName="p-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Enable Support</span>
                    <input 
                        type="checkbox" 
                        checked={selectedConfig.support.enabled}
                        onChange={(e) => updateConfig(selectedIdx, c => ({ support: { ...c.support, enabled: e.target.checked } }))}
                    />
                </div>
                
                {selectedConfig.support.enabled && (
                    <div className="space-y-3">
                        <div>
                            <label className="text-[9px] uppercase text-gray-500 block mb-1">Type</label>
                            <select 
                                className="w-full bg-gray-800 text-white text-xs rounded p-1.5 border border-gray-600"
                                value={selectedConfig.support.type}
                                onChange={(e) => updateConfig(selectedIdx, c => ({ support: { ...c.support, type: e.target.value as SupportType } }))}
                            >
                                <option value="CYLINDER">Cylinder</option>
                                <option value="SQUARE">Square</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] uppercase text-gray-500">Height</label>
                                <input type="number" step="0.5" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={selectedConfig.support.height}
                                    onChange={(e) => updateConfig(selectedIdx, c => ({ support: { ...c.support, height: Number(e.target.value) } }))}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] uppercase text-gray-500">Radius</label>
                                <input type="number" step="0.5" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={selectedConfig.support.width}
                                    onChange={(e) => updateConfig(selectedIdx, c => ({ support: { ...c.support, width: Number(e.target.value) } }))}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Accordion>
        </div>
    );
};
