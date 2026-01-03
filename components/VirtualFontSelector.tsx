import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FontLibrary, FontVariant } from '../types';

interface VirtualFontSelectorProps {
    fontLibrary: FontLibrary;
    currentUrl?: string;
    onSelect: (url: string) => void;
    previewText: string;
    placeholder?: string;
}

// Virtual Font Row Component
const FontRow = ({ 
    style, 
    family, 
    variants, 
    isSelected, 
    onSelect, 
    previewText 
}: { 
    style: React.CSSProperties, 
    family: string, 
    variants: FontVariant[], 
    isSelected: boolean, 
    onSelect: (url: string) => void,
    previewText: string
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const variant = variants[0];
    // Create a unique font-family name for this session to avoid collisions
    const fontName = `Preview_${family.replace(/[^a-zA-Z0-9]/g, '')}`;

    useEffect(() => {
        let mounted = true;
        const loadFont = async () => {
            // Check if already loaded
            if (document.fonts.check(`12px "${fontName}"`)) {
                if (mounted) setIsLoaded(true);
                return;
            }

            try {
                const font = new FontFace(fontName, `url(${variant.url})`);
                await font.load();
                document.fonts.add(font);
                if (mounted) setIsLoaded(true);
            } catch (e) {
                // console.warn("Failed to load preview font", family);
            }
        };
        loadFont();
        return () => { mounted = false; };
    }, [family, variant.url, fontName]);

    return (
        <div 
            style={style} 
            onClick={() => onSelect(variant.url)}
            className={`cursor-pointer px-4 py-2 flex flex-col justify-center border-b border-gray-700 hover:bg-gray-700 transition-colors ${isSelected ? 'bg-blue-900/40 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
        >
            <div className="flex items-baseline justify-between gap-4">
                <span 
                    className="text-xl text-white truncate leading-none"
                    style={{ fontFamily: isLoaded ? `"${fontName}", sans-serif` : 'sans-serif' }}
                >
                    {previewText}
                </span>
            </div>
            <span className="text-[10px] text-gray-500 uppercase font-sans mt-1 tracking-wide">{family}</span>
        </div>
    );
};

export const VirtualFontSelector: React.FC<VirtualFontSelectorProps> = ({ 
    fontLibrary, 
    currentUrl, 
    onSelect, 
    previewText,
    placeholder = "Select Font"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState("");
    const families = useMemo(() => Object.keys(fontLibrary), [fontLibrary]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter families based on search input
    const filteredFamilies = useMemo(() => {
        if (!filter) return families;
        const lower = filter.toLowerCase();
        return families.filter(fam => fam.toLowerCase().includes(lower));
    }, [families, filter]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            // Short delay to allow render
            setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
            }, 50);
        }
    }, [isOpen]);

    // Virtualization constants
    const itemHeight = 64; 
    const containerHeight = 300;
    const totalHeight = filteredFamilies.length * itemHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(filteredFamilies.length, startIndex + visibleCount + 1);

    const visibleItems = [];
    for (let i = startIndex; i < endIndex; i++) {
        const family = filteredFamilies[i];
        visibleItems.push(
            <FontRow
                key={family}
                style={{ position: 'absolute', top: i * itemHeight, left: 0, width: '100%', height: itemHeight }}
                family={family}
                variants={fontLibrary[family]}
                isSelected={fontLibrary[family].some(v => v.url === currentUrl)}
                onSelect={(url) => {
                    onSelect(url);
                    setIsOpen(false);
                }}
                previewText={previewText}
            />
        );
    }

    const currentFamily = useMemo(() => {
        if (!currentUrl) return placeholder;
        for (const [fam, vars] of Object.entries(fontLibrary)) {
            if (vars.some(v => v.url === currentUrl)) return fam;
        }
        return placeholder;
    }, [currentUrl, fontLibrary, placeholder]);

    return (
        <div className="relative w-full" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-left flex justify-between items-center text-xs text-white hover:border-gray-500 transition-colors"
            >
                <span className="truncate mr-2">{currentFamily}</span>
                <i className={`fas fa-chevron-down text-gray-500 text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-gray-800 border border-gray-600 rounded shadow-2xl z-50 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-700 bg-gray-900 sticky top-0 z-20">
                        <input 
                            ref={inputRef}
                            type="text" 
                            className="w-full bg-gray-800 text-xs text-white p-1.5 rounded border border-gray-600 focus:border-blue-500 outline-none placeholder-gray-500"
                            placeholder="Search fonts..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    {filteredFamilies.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-500 italic">No fonts found</div>
                    ) : (
                        <div 
                            ref={scrollRef}
                            className="overflow-y-auto custom-scrollbar relative bg-gray-800"
                            style={{ height: containerHeight }}
                            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                        >
                            <div style={{ height: totalHeight }}>
                                {visibleItems}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};