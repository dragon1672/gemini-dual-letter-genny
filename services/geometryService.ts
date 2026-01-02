import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { Evaluator, Brush, ADDITION, INTERSECTION } from 'three-bvh-csg';
import { TextSettings } from '../types';

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

export const generateDualTextGeometry = async (settings: TextSettings): Promise<THREE.BufferGeometry> => {
  if (!settings.fontUrl) throw new Error("No font selected");

  const font = await loadFont(settings.fontUrl);
  const { 
    text1, 
    text2, 
    fontSize, 
    spacing, 
    baseHeight, 
    basePadding,
    baseFillet,
    supportEnabled,
    supportMask,
    supportHeight,
    supportRadius
  } = settings;

  // Use array spread to correctly handle unicode surrogate pairs (emojis)
  const t1Chars = [...text1];
  const t2Chars = [...text2];
  const length = Math.min(t1Chars.length, t2Chars.length);

  const evaluator = new Evaluator();
  evaluator.attributes = ['position', 'normal']; 
  evaluator.useGroups = false;

  let finalBrush: Brush | null = null;
  const gap = fontSize * spacing;
  const extrusionDepth = fontSize * 3; 

  let currentXOffset = 0;

  const createCharBrush = (char: string, rotY: number): Brush | null => {
    // Generate text
    const geom = new TextGeometry(char, {
        font,
        size: fontSize,
        depth: extrusionDepth,
        curveSegments: 4,
        bevelEnabled: false,
    });
    
    // Check if geometry actually has data (glyph might be missing)
    if (!geom.attributes.position || geom.attributes.position.count === 0) {
        return null;
    }

    geom.computeBoundingBox();
    if (geom.boundingBox) {
        const center = new THREE.Vector3();
        geom.boundingBox.getCenter(center);
        
        // 1. Center on X/Z
        // 2. Align bottom (min.y) to 0 to fix floating issues
        const yOffset = -geom.boundingBox.min.y;
        
        geom.translate(-center.x, yOffset, -center.z);
    }

    const brush = new Brush(geom);
    brush.rotation.y = rotY;
    brush.updateMatrixWorld();
    return brush;
  };

  for (let i = 0; i < length; i++) {
    const char1 = t1Chars[i];
    const char2 = t2Chars[i];
    let intersectionResult: Brush | null = null;

    // Check against spaces (and handle potential whitespace chars)
    const isC1Space = char1.trim() === '';
    const isC2Space = char2.trim() === '';

    if (!isC1Space && !isC2Space) {
        const brush1 = createCharBrush(char1, Math.PI / 4);
        const brush2 = createCharBrush(char2, -Math.PI / 4);
        
        if (brush1 && brush2) {
            // Only perform intersection if both brushes are valid
            intersectionResult = evaluator.evaluate(brush1, brush2, INTERSECTION);
        } else if (brush1) {
             // Fallback if one char is missing in font (rare, but safety net)
             intersectionResult = brush1; 
        } else if (brush2) {
             intersectionResult = brush2;
        }
    } else if (!isC1Space) {
        intersectionResult = createCharBrush(char1, Math.PI / 4);
    } else if (!isC2Space) {
        intersectionResult = createCharBrush(char2, -Math.PI / 4);
    } else {
        // Both spaces
        currentXOffset += gap + (fontSize * 0.5);
        continue;
    }

    if (intersectionResult) {
        const bbox = new THREE.Box3().setFromObject(intersectionResult);
        const width = bbox.max.x - bbox.min.x;
        
        // If the resulting intersection is empty (no overlap), width might be 0 or negative
        if (width <= 0.001) {
             currentXOffset += gap + (fontSize * 0.5); // Treat as space-ish
             continue;
        }

        const centerX = currentXOffset + (width / 2);
        intersectionResult.position.set(centerX, 0, 0);
        intersectionResult.updateMatrixWorld();

        if (!finalBrush) {
            finalBrush = intersectionResult;
        } else {
            finalBrush = evaluator.evaluate(finalBrush, intersectionResult, ADDITION);
        }
        
        // Add Supports (Extend Upwards)
        if (supportEnabled) {
            const maskChar = (i < supportMask.length) ? supportMask[i] : '_';
            if (maskChar !== '_' && maskChar !== ' ') {
                const cylGeom = new THREE.CylinderGeometry(supportRadius, supportRadius, supportHeight, 16);
                const cylBrush = new Brush(cylGeom);
                // Center Y = supportHeight / 2 -> Bottom at 0
                cylBrush.position.set(centerX, supportHeight / 2, 0);
                cylBrush.updateMatrixWorld();

                finalBrush = evaluator.evaluate(finalBrush, cylBrush, ADDITION);
            }
        }

        currentXOffset += width + gap;
    }
  }

  if (!finalBrush) {
      return new THREE.BufferGeometry();
  }

  // --- Create Main Base ---
  if (baseHeight > 0) {
      const fullBBox = new THREE.Box3().setFromObject(finalBrush);
      const fullSize = new THREE.Vector3();
      fullBBox.getSize(fullSize);
      const fullCenter = new THREE.Vector3();
      fullBBox.getCenter(fullCenter);
      
      const width = fullSize.x + basePadding;
      const height = baseHeight;
      const depth = fullSize.z + basePadding;

      let baseGeom: THREE.BufferGeometry;
      
      if (baseFillet) {
          // Use rounded box with a pleasant radius (e.g., 2 units or clamped by dimensions)
          const radius = Math.min(2, width/2, depth/2);
          const segments = 4; // Low segments for CSG performance, but enough for visual roundness
          baseGeom = new RoundedBoxGeometry(width, height, depth, segments, radius);
      } else {
          baseGeom = new THREE.BoxGeometry(width, height, depth);
      }
      
      const baseBrush = new Brush(baseGeom);
      baseBrush.position.set(
          fullCenter.x, 
          -baseHeight / 2, 
          fullCenter.z
      );
      baseBrush.updateMatrixWorld();

      finalBrush = evaluator.evaluate(finalBrush, baseBrush, ADDITION);
  }

  const finalGeom = finalBrush.geometry;
  finalGeom.computeBoundingBox();
  finalGeom.computeVertexNormals();
  
  if (finalGeom.boundingBox) {
      const center = new THREE.Vector3();
      finalGeom.boundingBox.getCenter(center);
      finalGeom.translate(-center.x, -center.y, -center.z);
  }
  
  return finalGeom;
};

export const exportToSTL = (geometry: THREE.BufferGeometry, filename: string) => {
  const exporter = new STLExporter();
  const mesh = new THREE.Mesh(geometry);
  
  // Rotate mesh 90 degrees on X axis to make it Z-up (lay flat for 3D printing)
  mesh.rotation.x = Math.PI / 2;
  mesh.updateMatrixWorld();

  const result = exporter.parse(mesh, { binary: true });
  const blob = new Blob([result], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.stl`;
  link.click();
};