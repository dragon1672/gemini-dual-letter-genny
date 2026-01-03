import React from 'react';
import { IntersectionConfig } from '../../types';

interface IntersectionListProps {
    configArray: IntersectionConfig[];
    selectedIdx: number | null;
    onSelect: (idx: number) => void;
}

export const IntersectionList: React.FC<IntersectionListProps> = ({ configArray, selectedIdx, onSelect }) => {
    return (
        <div className="p-4 border-b border-gray-700">
            <label className="text-[10px] uppercase text-gray-500 block mb-2">Select Pair</label>
            <div className="flex flex-wrap gap-2">
                {configArray.map((conf, idx) => (
                    <button
                        key={conf.id}
                        onClick={() => onSelect(idx)}
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
    );
};