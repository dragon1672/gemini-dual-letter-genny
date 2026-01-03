import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader';

let cachedFont: Font | null = null;
let cachedFontName: string | null = null;

export const loadFont = async (url: string): Promise<Font> => {
  if (cachedFont && cachedFontName === url) return cachedFont;

  const loader = new TTFLoader();
  const fontLoader = new FontLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (json) => {
        try {
            const font = fontLoader.parse(json);
            cachedFont = font;
            cachedFontName = url;
            resolve(font);
        } catch (e) {
            console.error("Error parsing font:", e);
            reject(new Error(`Failed to parse font data from ${url}`));
        }
      },
      undefined,
      (err) => {
          console.error("Error loading font:", err);
          reject(new Error(`Failed to load font from ${url}. The file might be missing or blocked.`));
      }
    );
  });
};