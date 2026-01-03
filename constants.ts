
import { FontLibrary, BaseType, SupportType, TextSettings } from './types';
import { BASE_URL, RAW_FONT_PATHS } from './font_constants';

export const getFontLibrary = (): FontLibrary => {
    const library: FontLibrary = {};

    RAW_FONT_PATHS.forEach(path => {
        const filename = path.split('/').pop() || "";
        let namePart = filename.replace(/\.ttf$/, "");
        const isVariable = namePart.includes("[");
        namePart = namePart.replace(/\[.*?\]/, ""); 

        const parts = namePart.split('-');
        let family = parts[0];
        let variant = parts.length > 1 ? parts.slice(1).join(' ') : "Regular";

        if (isVariable && variant === "Regular") variant = "Variable";
        if (isVariable && variant !== "Variable") variant = `${variant} (Variable)`;

        family = family.replace(/([a-z])([A-Z])/g, '$1 $2');
        variant = variant.replace(/([a-z])([A-Z])/g, '$1 $2');

        if (!library[family]) library[family] = [];
        library[family].push({
            name: variant,
            url: `${BASE_URL}/${path}`
        });
    });

    const sortedLibrary: FontLibrary = {};
    Object.keys(library).sort().forEach(key => {
        const variants = library[key].sort((a, b) => {
             const getScore = (name: string) => {
                 if (name.includes('Regular') || name.includes('Variable')) return -1;
                 if (name.includes('Bold')) return 0;
                 return 1;
             };
             const scoreA = getScore(a.name);
             const scoreB = getScore(b.name);
             if (scoreA !== scoreB) return scoreA - scoreB;
             return a.name.localeCompare(b.name);
        });
        sortedLibrary[key] = variants;
    });

    return sortedLibrary;
};

const library = getFontLibrary();
const defaultFamily = 'Abhaya Libre'; 
const defaultUrl = library[defaultFamily]?.[0]?.url || library['Roboto']?.[0]?.url;

export const DEFAULT_SETTINGS: TextSettings = {
  text1: '♥YE♥',
  text2: '♥NO!',
  fontUrl: defaultUrl, 
  fontSize: 20,
  spacing: 0.15, 
  baseHeight: 2,
  basePadding: 4,
  baseType: 'RECTANGLE' as BaseType,
  baseCornerRadius: 4,
  baseTopRounding: 0.5,
  embedDepth: 0.5,
  
  supportEnabled: false,
  supportType: 'CYLINDER' as SupportType,
  supportHeight: 2.5, 
  supportRadius: 1.5,

  intersectionConfig: []
};
