import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { Evaluator, Brush, ADDITION, SUBTRACTION, INTERSECTION } from 'three-bvh-csg';
import { TextSettings } from '../types';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
    baseType, 
    baseCornerRadius, 
    baseTopRounding,
    supportEnabled,
    supportMask,
    supportHeight,
    supportRadius
  } = settings;

  const t1Chars = [...text1];
  const t2Chars = [...text2];
  const length = Math.min(t1Chars.length, t2Chars.length);

  const evaluator = new Evaluator();
  evaluator.attributes = ['position', 'normal']; 
  evaluator.useGroups = false;
  
  const gap = fontSize * spacing;
  const extrusionDepth = fontSize * 3; 

  let currentXOffset = 0;
  
  // Collect all valid intersection brushes (the letters)
  const letterBrushes: Brush[] = [];
  // Collect support cylinders
  const supportGeometries: THREE.BufferGeometry[] = [];

  const createCharBrush = (char: string, rotY: number): Brush | null => {
    let geom: THREE.BufferGeometry = new TextGeometry(char, {
        font,
        size: fontSize,
        depth: extrusionDepth,
        curveSegments: 8,
        bevelEnabled: false,
    });
    
    // PRE-WELD: Fix non-manifold font geometry before CSG
    // This removes duplicate vertices and ensures the mesh is "watertight"
    geom = BufferGeometryUtils.mergeVertices(geom, 0.0001);

    if (!geom.attributes.position || geom.attributes.position.count === 0) return null;

    geom.computeBoundingBox();
    if (geom.boundingBox) {
        const center = new THREE.Vector3();
        geom.boundingBox.getCenter(center);
        // Align bottom (min.y) to 0
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
    const isC1Space = char1.trim() === '';
    const isC2Space = char2.trim() === '';

    let resultBrush: Brush | null = null;

    if (!isC1Space && !isC2Space) {
        const b1 = createCharBrush(char1, Math.PI / 4);
        const b2 = createCharBrush(char2, -Math.PI / 4);
        if (b1 && b2) {
            // Because inputs are pre-welded, INTERSECTION is much cleaner
            resultBrush = evaluator.evaluate(b1, b2, INTERSECTION);
        } else {
            resultBrush = b1 || b2;
        }
    } else if (!isC1Space) {
        resultBrush = createCharBrush(char1, Math.PI / 4);
    } else if (!isC2Space) {
        resultBrush = createCharBrush(char2, -Math.PI / 4);
    } else {
        currentXOffset += gap + (fontSize * 0.5);
        continue;
    }

    if (resultBrush) {
        const bbox = new THREE.Box3().setFromObject(resultBrush);
        const width = bbox.max.x - bbox.min.x;
        
        if (width > 0.001) {
            const centerX = currentXOffset + (width / 2);
            resultBrush.position.set(centerX, 0, 0);
            resultBrush.updateMatrixWorld();
            
            letterBrushes.push(resultBrush);

            // Generate Support Geometry
            if (supportEnabled) {
                const maskChar = (i < supportMask.length) ? supportMask[i] : '_';
                if (maskChar !== '_' && maskChar !== ' ') {
                    const cylGeom = new THREE.CylinderGeometry(supportRadius, supportRadius, supportHeight, 16);
                    cylGeom.translate(centerX, supportHeight / 2 - 0.5, 0);
                    supportGeometries.push(cylGeom);
                }
            }
            currentXOffset += width + gap;
        } else {
            currentXOffset += gap + (fontSize * 0.5);
        }
    }
  }

  if (letterBrushes.length === 0) {
      return new THREE.BufferGeometry();
  }

  // --- 1. Consolidate Letters via CSG Union ---
  let combinedBrush = letterBrushes[0];
  combinedBrush.updateMatrixWorld();

  for (let i = 1; i < letterBrushes.length; i++) {
      const nextBrush = letterBrushes[i];
      nextBrush.updateMatrixWorld();
      combinedBrush = evaluator.evaluate(combinedBrush, nextBrush, ADDITION);
  }

  // --- 2. Add Supports (Pre-welded) ---
  if (supportGeometries.length > 0) {
      let mergedSupports = BufferGeometryUtils.mergeGeometries(supportGeometries, false);
      if (mergedSupports) {
          // PRE-WELD: Ensure supports are manifold before union
          mergedSupports = BufferGeometryUtils.mergeVertices(mergedSupports, 0.0001);
          
          const supportBrush = new Brush(mergedSupports);
          supportBrush.updateMatrixWorld();
          combinedBrush = evaluator.evaluate(combinedBrush, supportBrush, ADDITION);
      }
  }

  // --- 3. Create Base with Shape Extrusion ---
  if (baseHeight > 0) {
      const fullBBox = new THREE.Box3().setFromObject(combinedBrush);
      const fullSize = new THREE.Vector3();
      fullBBox.getSize(fullSize);
      const fullCenter = new THREE.Vector3();
      fullBBox.getCenter(fullCenter);
      
      const width = fullSize.x + basePadding;
      const depth = fullSize.z + basePadding;
      
      const shape = new THREE.Shape();
      
      // Draw shape centered at 0,0 (which will be X,Z)
      const x = -width / 2;
      const y = -depth / 2;
      
      if (baseType === 'RECTANGLE') {
          // Rounded Rectangle
          // Clamp radius to not exceed dimensions
          const r = Math.min(baseCornerRadius, width/2, depth/2);
          shape.moveTo(x + r, y);
          shape.lineTo(x + width - r, y);
          shape.quadraticCurveTo(x + width, y, x + width, y + r);
          shape.lineTo(x + width, y + depth - r);
          shape.quadraticCurveTo(x + width, y + depth, x + width - r, y + depth);
          shape.lineTo(x + r, y + depth);
          shape.quadraticCurveTo(x, y + depth, x, y + depth - r);
          shape.lineTo(x, y + r);
          shape.quadraticCurveTo(x, y, x + r, y);
      } else {
          // Oval / Ellipse
          shape.absellipse(0, 0, width / 2, depth / 2, 0, Math.PI * 2, false, 0);
      }

      // Extrude with Bevel for "Vertical Curving"
      const extrudeSettings = {
          depth: baseHeight, 
          bevelEnabled: baseTopRounding > 0,
          bevelThickness: baseTopRounding,
          bevelSize: baseTopRounding,
          bevelSegments: 6, // Smooth bevel
      };
      
      let baseGeom: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      
      // Fix Orientation: Extrude is along Z. We want it along Y (Up).
      // Rotate -90 on X puts Z axis to Y axis.
      baseGeom.rotateX(-Math.PI / 2);
      
      // PRE-WELD: Base geometry
      baseGeom = BufferGeometryUtils.mergeVertices(baseGeom, 0.0001);
      
      const baseBrush = new Brush(baseGeom);
      
      // Position Strategy:
      // The extrusion starts at Z=0 (after rotation becomes Y=0) and goes to Y=depth.
      // We want the TOP of the base to intersect the text.
      // Text starts at Y=0 and goes up.
      
      const topY = baseHeight + (baseTopRounding > 0 ? baseTopRounding : 0);
      
      // Increased overlap to ensure robust intersection and prevent "floating" geometry
      const overlap = 0.8; 
      const targetTopY = overlap; 
      const yTranslation = targetTopY - topY;

      baseBrush.position.set(fullCenter.x, yTranslation, fullCenter.z); // Center X/Z on text
      baseBrush.updateMatrixWorld();

      // --- 4. Flatten Bottom ---
      if (baseTopRounding > 0) {
          // Create a floor cutter to remove the bottom bevel generated by ExtrudeGeometry
          const cutterGeom = new THREE.BoxGeometry(1000, 100, 1000);
          const cutter = new Brush(cutterGeom);
          // Cut everything below Y = yTranslation
          cutter.position.set(0, yTranslation - 50, 0);
          cutter.updateMatrixWorld();
          
          // Cut the bottom bevel off the base
          const flatBottomBase = evaluator.evaluate(baseBrush, cutter, SUBTRACTION);
          combinedBrush = evaluator.evaluate(combinedBrush, flatBottomBase, ADDITION);
      } else {
          // No bevel, bottom is already flat
          combinedBrush = evaluator.evaluate(combinedBrush, baseBrush, ADDITION);
      }
  }

  // --- Final Geometry Cleanup ---
  let finalGeom = combinedBrush.geometry;
  
  // Remove UVs and Color attributes to ensure clean merging for STL
  if (finalGeom.getAttribute('uv')) finalGeom.deleteAttribute('uv');
  if (finalGeom.getAttribute('color')) finalGeom.deleteAttribute('color');

  // Weld vertices to close microscopic non-manifold gaps
  finalGeom = BufferGeometryUtils.mergeVertices(finalGeom, 0.001);

  finalGeom.computeBoundingBox();
  finalGeom.computeVertexNormals();
  
  // Center geometry at origin for clean export
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
  
  // Correct rotation for 3D printing (Z-up)
  // +90 degrees on X axis
  mesh.rotation.x = Math.PI / 2;
  mesh.updateMatrixWorld();

  const result = exporter.parse(mesh, { binary: true });
  const blob = new Blob([result], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.stl`;
  link.click();
};