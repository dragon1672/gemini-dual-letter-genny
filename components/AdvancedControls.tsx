import React, { useState } from 'react';
import { TextSettings, IntersectionConfig, SupportType } from '../types';

interface AdvancedControlsProps {
    settings: TextSettings;
    setSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
}

const AdvancedControls: React.FC<AdvancedControlsProps> = ({ settings, setSettings }) => {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

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
                transform: { scaleX: 1, scaleY: 1, moveX: 0, moveZ: 0 },
                support: { 
                    enabled: prev.supportEnabled, 
                    type: prev.supportType, 
                    height: prev.supportHeight, 
                    width: prev.supportRadius 
                }
            };
            return { ...prev, intersectionConfig: newArr };
        });
    };

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
            {selectedIdx !== null && (
                <div className="p-4 space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-300">
                            Editing: <span className="text-lg mx-1 font-mono text-white">{configArray[selectedIdx].char1}/{configArray[selectedIdx].char2}</span>
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => resetConfig(selectedIdx)} className="text-[10px] text-red-400 hover:text-red-300 underline">Reset</button>
                        </div>
                    </div>

                    {/* Transform */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase border-b border-gray-700 pb-1">Result Transform</h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="text-[9px] uppercase text-gray-500">Scale Width</label>
                                <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={configArray[selectedIdx].transform.scaleX}
                                    onChange={(e) => updateConfig(selectedIdx, c => ({ transform: { ...c.transform, scaleX: Number(e.target.value) } }))}
                                />
                             </div>
                             <div>
                                <label className="text-[9px] uppercase text-gray-500">Scale Height</label>
                                <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={configArray[selectedIdx].transform.scaleY}
                                    onChange={(e) => updateConfig(selectedIdx, c => ({ transform: { ...c.transform, scaleY: Number(e.target.value) } }))}
                                />
                             </div>
                             <div>
                                <label className="text-[9px] uppercase text-gray-500">Offset X</label>
                                <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={configArray[selectedIdx].transform.moveX}
                                    onChange={(e) => updateConfig(selectedIdx, c => ({ transform: { ...c.transform, moveX: Number(e.target.value) } }))}
                                />
                             </div>
                             <div>
                                <label className="text-[9px] uppercase text-gray-500">Offset Z (Depth)</label>
                                <input type="number" step="0.1" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                    value={configArray[selectedIdx].transform.moveZ}
                                    onChange={(e) => updateConfig(selectedIdx, c => ({ transform: { ...c.transform, moveZ: Number(e.target.value) } }))}
                                />
                             </div>
                        </div>
                    </div>

                    {/* Supports */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-700 pb-1">
                            <h3 className="text-xs font-bold text-gray-400 uppercase">Support Pillar</h3>
                            <input 
                                type="checkbox" 
                                checked={configArray[selectedIdx].support.enabled}
                                onChange={(e) => updateConfig(selectedIdx, c => ({ support: { ...c.support, enabled: e.target.checked } }))}
                            />
                        </div>
                        
                        {configArray[selectedIdx].support.enabled && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] uppercase text-gray-500 block mb-1">Type</label>
                                    <select 
                                        className="w-full bg-gray-800 text-white text-xs rounded p-1.5 border border-gray-600"
                                        value={configArray[selectedIdx].support.type}
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
                                            value={configArray[selectedIdx].support.height}
                                            onChange={(e) => updateConfig(selectedIdx, c => ({ support: { ...c.support, height: Number(e.target.value) } }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase text-gray-500">Radius / Size</label>
                                        <input type="number" step="0.5" className="w-full bg-gray-800 text-xs p-1.5 rounded border border-gray-600 text-white"
                                            value={configArray[selectedIdx].support.width}
                                            onChange={(e) => updateConfig(selectedIdx, c => ({ support: { ...c.support, width: Number(e.target.value) } }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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