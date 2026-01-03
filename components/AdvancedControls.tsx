import React, { useState, useMemo } from 'react';
import { TextSettings, IntersectionConfig } from '../types';
import { getFontLibrary } from '../constants';
import { IntersectionList } from './advanced/IntersectionList';
import { IntersectionEditor } from './advanced/IntersectionEditor';

interface AdvancedControlsProps {
    settings: TextSettings;
    setSettings: React.Dispatch<React.SetStateAction<TextSettings>>;
}

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
                // Manually merge nested objects if they are present in changes
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
                char1Transform: { scaleX: 1, scaleY: 1, moveX: 0, moveY: 0 },
                char2Transform: { scaleX: 1, scaleY: 1, moveX: 0, moveY: 0 },
                pairSpacing: { x: 0, z: 0 },
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

    return (
        <div className="w-full md:w-80 bg-gray-900 border-l border-gray-700 flex flex-col h-full shadow-2xl z-10 custom-scrollbar overflow-y-auto shrink-0 transition-all">
            <div className="p-4 bg-gray-800 border-b border-gray-700">
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wide">
                    <i className="fas fa-cubes mr-2 text-purple-400"></i>
                    Intersection Pairs
                </h2>
                <p className="text-[10px] text-gray-400 mt-1">Configure individual character intersections.</p>
            </div>

            <IntersectionList 
                configArray={configArray} 
                selectedIdx={selectedIdx} 
                onSelect={setSelectedIdx} 
            />

            {selectedIdx !== null && selectedConfig && (
                <IntersectionEditor
                    selectedIdx={selectedIdx}
                    selectedConfig={selectedConfig}
                    updateConfig={updateConfig}
                    resetConfig={resetConfig}
                    fontLibrary={fontLibrary}
                    settings={settings}
                />
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