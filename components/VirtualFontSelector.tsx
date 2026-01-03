
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FontLibrary, FontVariant } from '../types';
import { FALLBACK_FONT_URLS } from '../constants';

interface VirtualFontSelectorProps {
    fontLibrary: FontLibrary;
    currentUrl?: string;
    onSelect: (url: string) => void;
    previewText: string;
    placeholder?: string;
}

// Global cache to prevent reloading same fonts during scrolling
const loadedFonts = new Set<string>();
const loadingFonts = new Map<string, Promise<void>>();
const parsedFonts = new Map<string, any>(); // Cache for OpenType font objects

// Fallback Font State
let fallbackInitPromise: Promise<void> | null = null;
const fallbackOpentypeFonts: any[] = [];
const fallbackFontFamilyNames: string[] = [];

// Initialize fallback fonts (Symbols, CJK, etc.)
const initFallbackFonts = () => {
    if (fallbackInitPromise) return fallbackInitPromise;

    fallbackInitPromise = (async () => {
        // @ts-ignore
        if (!window.opentype) return;

        const promises = FALLBACK_FONT_URLS.map(async (url, index) => {
            try {
                const name = `GlobalFallback_${index}`;
                const res = await fetch(url);
                const buffer = await res.arrayBuffer();
                
                // CSS Font Face
                const fontFace = new FontFace(name, buffer);
                await fontFace.load();
                document.fonts.add(fontFace);
                
                // OpenType Parse
                // @ts-ignore
                const otFont = window.opentype.parse(buffer);
                
                return { name, otFont };
            } catch (e) {
                console.warn("Failed to load fallback font", url, e);
                return null;
            }
        });

        const results = await Promise.all(promises);
        results.forEach(res => {
            if (res) {
                fallbackFontFamilyNames.push(res.name);
                fallbackOpentypeFonts.push(res.otFont);
            }
        });
    })();
    return fallbackInitPromise;
};


// Cache for validated preview strings per font + text
const glyphCheckCache = new Map<string, string>();

// Helper to check glyphs against a parsed font AND fallbacks
const checkGlyphs = (otFont: any, text: string): string => {
    try {
        const uniqueChars = Array.from(new Set([...text]));
        const missing = new Set();
        
        uniqueChars.forEach(char => {
            let found = false;

            // 1. Check Primary Font
            if (otFont) {
                const glyph = otFont.charToGlyph(char);
                if (glyph.index !== 0 && glyph.name !== '.notdef') {
                    found = true;
                }
            }

            // 2. Check Fallbacks (if not in primary)
            if (!found) {
                for (const fbFont of fallbackOpentypeFonts) {
                    const glyph = fbFont.charToGlyph(char);
                    if (glyph.index !== 0 && glyph.name !== '.notdef') {
                        found = true;
                        break;
                    }
                }
            }

            if (!found) {
                missing.add(char);
            }
        });

        return text.split('').map(c => missing.has(c) ? '?' : c).join('');
    } catch (e) {
        return text;
    }
};

// Font Row Component
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
    const variant = variants[0];
    const uniqueId = family.replace(/[^a-zA-Z0-9]/g, '');
    const fontName = `Preview_${uniqueId}`;
    // Include previewText in cache key to handle different texts for same font
    const cacheKey = `${fontName}::${previewText}`; 
    
    const [isLoaded, setIsLoaded] = useState(loadedFonts.has(fontName));
    const [validatedText, setValidatedText] = useState(() => {
        return glyphCheckCache.get(cacheKey) || previewText;
    });

    useEffect(() => {
        // If result is already cached, update immediately
        if (glyphCheckCache.has(cacheKey)) {
            setValidatedText(glyphCheckCache.get(cacheKey)!);
        } else if (parsedFonts.has(fontName) && fallbackInitPromise) {
            // If font is parsed AND fallbacks are ready, check now
            const checked = checkGlyphs(parsedFonts.get(fontName), previewText);
            glyphCheckCache.set(cacheKey, checked);
            setValidatedText(checked);
        } else {
            // Fallback while loading
            setValidatedText(previewText);
        }
    }, [previewText, cacheKey, fontName]);

    useEffect(() => {
        if (isLoaded && glyphCheckCache.has(cacheKey)) return;

        let mounted = true;

        const loadFont = async () => {
            // Ensure fallbacks are initializing/loaded
            if (!fallbackInitPromise) initFallbackFonts();
            await fallbackInitPromise;

            // If completely new font, fetch and parse
            if (!loadingFonts.has(fontName)) {
                const loadTask = async () => {
                    try {
                        const response = await fetch(variant.url);
                        const buffer = await response.arrayBuffer();
                        
                        // 1. Register for CSS usage
                        const font = new FontFace(fontName, buffer);
                        await font.load();
                        document.fonts.add(font);
                        loadedFonts.add(fontName);

                        // 2. Parse with OpenType to check glyphs
                        // @ts-ignore
                        if (window.opentype) {
                            // @ts-ignore
                            const otFont = window.opentype.parse(buffer);
                            parsedFonts.set(fontName, otFont);
                        }
                    } catch (e) {
                        console.warn(`Failed to load preview font ${fontName}`, e);
                    }
                };
                loadingFonts.set(fontName, loadTask());
            }

            // Wait for load to finish
            await loadingFonts.get(fontName);

            if (mounted) {
                setIsLoaded(true);
                // Perform check if not done yet
                if (!glyphCheckCache.has(cacheKey)) {
                    // Note: checkGlyphs will internally use the now-loaded fallbackOpentypeFonts
                    const checked = checkGlyphs(parsedFonts.get(fontName), previewText);
                    glyphCheckCache.set(cacheKey, checked);
                    setValidatedText(checked);
                }
            }
        };

        loadFont();

        return () => { mounted = false; };
    }, [fontName, variant.url, previewText, cacheKey, isLoaded]);

    // Build font stack: Primary -> Fallbacks -> System
    const fontStack = [`"${fontName}"`, ...fallbackFontFamilyNames.map(n => `"${n}"`), 'sans-serif'].join(', ');
    const fontStyle = { fontFamily: isLoaded ? fontStack : 'sans-serif' };

    return (
        <div 
            style={style} 
            onClick={() => onSelect(variant.url)}
            className={`cursor-pointer px-4 py-2 flex flex-col justify-center border-b border-gray-700 hover:bg-gray-700 transition-colors ${isSelected ? 'bg-blue-900/40 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
        >
            <div className="flex items-baseline justify-between gap-4">
                <span 
                    className="text-xl text-white truncate leading-none"
                    style={fontStyle}
                >
                    {validatedText}
                </span>
            </div>
            <span 
                className="text-[10px] text-gray-400 uppercase mt-1 tracking-wide truncate opacity-80"
                style={fontStyle}
            >
                {family}
            </span>
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

    // Trigger fallback load immediately when selector is mounted
    useEffect(() => {
        initFallbackFonts();
    }, []);

    const filteredFamilies = useMemo(() => {
        if (!filter) return families;
        const lower = filter.toLowerCase();
        return families.filter(fam => fam.toLowerCase().includes(lower));
    }, [families, filter]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
            }, 50);
        }
    }, [isOpen]);

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
