import React, { useState, useMemo } from 'react';
import { TextSettings, IntersectionConfig, SupportType, FontLibrary } from '../types';
import { getFontLibrary } from '../constants';
import { VirtualFontSelector } from './VirtualFontSelector';

interface AdvancedControlsProps {
    settings: TextSettings;
    setSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
}

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-700 rounded bg-gray-800/50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 px-3 text-[10px] font-bold text-gray-300 hover:bg-gray-700/50 transition-colors uppercase tracking-wider"
            >
                <span>{title}</span>
                <i className={`fas fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && <div className="p-3 border-t border-gray-700 space-y-3">{children}</div>}
        </div>
    );
};

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

const AdvancedControls: React.FC<AdvancedControlsProps> = ({ settings, setSettings }) => {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const fontLibrary = useMemo(() => getFontLibrary(), []);

    const configArray = settings.intersectionConfig;
    
    // Helper to update specific intersection config
    const updateConfig = (index: number, updates: Partial<IntersectionConfig> | ((prev: IntersectionConfig) => Partial<IntersectionConfig>)) => {
        setSettings(prev => {
            const newArr = [...prev.intersectionConfig];
            const current = newArr[index];
            const changes = typeof updates === 'function' ? updates(current) : updates;
            
            newArr[index] = {
                ...current,
                ...changes,
                transform: changes.transform ? { ...current.transform, ...changes.transform } : current.transform,
                support: changes.support ? { ...current.support, ...changes.support } : current.support,
                bridge: changes.bridge ? { ...current.bridge, ...changes.bridge } : current.bridge,
                isOverridden: true
            };
            
            return { ...prev, intersectionConfig: newArr };
        });
    };

    const resetConfig = (index: number) => {
         setSettings(prev => {
            const newArr = [...prev.intersectionConfig];
            const current = newArr[index];
            newArr[index] = {
                ...current,
                isOverridden: false,
                fontUrl: undefined,
                char1FontUrl: undefined,
                char2FontUrl: undefined,
                embedDepth: undefined,
                char1Width: undefined,
                char2Width: undefined,
                transform: { scaleX: 1, scaleY: 1, moveX: 0, moveZ: 0 },
                support: { 
                    enabled: prev.supportEnabled, 
                    type: prev.supportType, 
                    height: prev.supportHeight, 
                    width: prev.supportRadius 
                },
                bridge: {
                    enabled: true,
                    auto: true,
                    width: 2, height: 3, depth: 2,
                    moveX: 0, moveY: 2.5, moveZ: 0,
                    rotationZ: 0
                }
            };
            return { ...prev, intersectionConfig: newArr };
        });
    };

    const selectedConfig = selectedIdx !== null ? configArray[selectedIdx] : null;

    // Get variants for current selection
    const char1Variants = useMemo(() => 
        selectedConfig ? getVariantsForUrl(fontLibrary, selectedConfig.char1FontUrl || selectedConfig.fontUrl) : [],
        [selectedConfig?.char1FontUrl, selectedConfig?.fontUrl, fontLibrary]
    );

    const char2Variants = useMemo(() => 
        selectedConfig ? getVariantsForUrl(fontLibrary, selectedConfig.char2FontUrl || selectedConfig.fontUrl) : [],
        [selectedConfig?.char2FontUrl, selectedConfig?.fontUrl, fontLibrary]
    );

    return (
        <div className="w-full md:w-80 bg-gray-900 border-l border-gray-700 flex flex-col h-full shadow-2xl z-10 custom-scrollbar overflow-y-auto shrink-0 transition-all">
            <div className="p-4 bg-gray-800 border-b border-gray-700">
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wide">
                    <i className="fas fa-cubes mr-2 text-purple-400"></i>
                    Intersection Pairs
                </h2>
                <p className="text-[10px] text-gray-400 mt-1">Configure individual character intersections.</p>
            </div>

            {/* List */}
            <div className="p-4 border-b border-gray-700">
                <label className="text-[10px] uppercase text-gray-500 block mb-2">Select Pair</label>
                <div className="flex flex-wrap gap-2">
                    {configArray.map((conf, idx) => (
                        <button
                            key={conf.id}
                            onClick={() => setSelectedIdx(idx)}
                            className={`px-3 py-2 rounded flex items-center justify-center text-sm font-bold border transition-all relative min-w-[3rem]
                                ${selectedIdx === idx 
                                    ? 'bg-purple-600 border-purple-400 text-white'
                                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            <span className="text-blue-300">{conf.char1}</span>
                            <span className="opacity-50 mx-1">/</span>
                            <span className="text-pink-300">{conf.char2}</span>
                            
                            {conf.isOverridden && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-gray-900"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor */}
            {selectedIdx !== null && selectedConfig && (
                <div className="p-4 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-300">
                            Editing: <span className="text-lg mx-1 font-mono text-white">{selectedConfig.char1}/{selectedConfig.char2}</span>
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => resetConfig(selectedIdx)} className="text-[10px] text-red-400 hover:text-red-300 underline">Reset</button>
                        </div>
                    </div>
                    
                    <Accordion title="Typography & Depth">
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

                    <Accordion title="Character Scaling">
                         <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="text-[9px] uppercase text-blue-300 block mb-1">Width: {selectedConfig.char1}</label>
                                <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={selectedConfig.char1Width ?? 1}
                                    onChange={(e) => updateConfig(selectedIdx, { char1Width: Number(e.target.value) })}
                                />
                             </div>
                             <div>
                                <label className="text-[9px] uppercase text-pink-300 block mb-1">Width: {selectedConfig.char2}</label>
                                <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={selectedConfig.char2Width ?? 1}
                                    onChange={(e) => updateConfig(selectedIdx, { char2Width: Number(e.target.value) })}
                                />
                             </div>
                        </div>
                        <p className="text-[9px] text-gray-500 italic mt-1">Stretches individual characters before intersection to fit better.</p>
                    </Accordion>

                    <Accordion title="Result Transform">
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="text-[9px] uppercase text-gray-500">Scale X</label>
                                <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={selectedConfig.transform.scaleX}
                                    onChange={(e) => updateConfig(selectedIdx, c => ({ transform: { ...c.transform, scaleX: Number(e.target.value) } }))}
                                />
                             </div>
                             <div>
                                <label className="text-[9px] uppercase text-gray-500">Scale Y</label>
                                <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={selectedConfig.transform.scaleY}
                                    onChange={(e) => updateConfig(selectedIdx, c => ({ transform: { ...c.transform, scaleY: Number(e.target.value) } }))}
                                />
                             </div>
                             <div>
                                <label className="text-[9px] uppercase text-gray-500">Offset X</label>
                                <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={selectedConfig.transform.moveX}
                                    onChange={(e) => updateConfig(selectedIdx, c => ({ transform: { ...c.transform, moveX: Number(e.target.value) } }))}
                                />
                             </div>
                             <div>
                                <label className="text-[9px] uppercase text-gray-500">Offset Z</label>
                                <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={selectedConfig.transform.moveZ}
                                    onChange={(e) => updateConfig(selectedIdx, c => ({ transform: { ...c.transform, moveZ: Number(e.target.value) } }))}
                                />
                             </div>
                        </div>
                    </Accordion>

                    <Accordion title="Bridge & Connection">
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

                    <Accordion title="Support Pillar">
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
            )}
            
            {selectedIdx === null && (
                <div className="flex-1 flex items-center justify-center p-8 text-center opacity-50">
                    <div>
                        <i className="fas fa-arrow-up text-2xl mb-2 text-gray-500"></i>
                        <p className="text-xs text-gray-400">Select an intersection pair above to configure.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedControls;