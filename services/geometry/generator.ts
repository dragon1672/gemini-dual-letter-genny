import * as THREE from 'three';
import { TextSettings } from '../../types';
import { loadFont } from './text';
import { getManifold } from './loader';
import { fromManifold } from './converters';

// Helper to sanitize points for Manifold
const cleanPoints = (points: number[][]): number[][] => {
    if (points.length < 3) return [];
    
    const result: number[][] = [];
    let last = points[points.length - 1];
    
    for (let i = 0; i < points.length; i++) {
        const curr = points[i];
        const dx = curr[0] - last[0];
        const dy = curr[1] - last[1];
        // Filter out extremely small segments
        if (dx * dx + dy * dy > 0.000001) {
            result.push(curr);
            last = curr;
        }
    }
    
    return result.length >= 3 ? result : [];
};

// Ensure points are in correct winding order (CCW for shape, CW for holes)
const isCCW = (points: number[][]) => {
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        sum += (p2[0] - p1[0]) * (p2[1] + p1[1]);
    }
    return sum < 0; 
};

const processPoints = (points: number[][], desiredCCW: boolean): number[][] => {
    const ccw = isCCW(points);
    if (ccw !== desiredCCW) {
        return points.reverse();
    }
    return points;
};

// Helper to convert THREE.Shape[] to Manifold
const shapesToManifold = (shapes: THREE.Shape[], m: any, depth: number) => {
    const loops: number[][][] = [];
    const resolution = 16; // Increased resolution for smoother bases and text

    shapes.forEach(shape => {
        const points = shape.getPoints(resolution).map(p => [p.x, p.y]);
        
        // Ensure closed loop
        if (points.length > 0) {
            const first = points[0];
            const last = points[points.length - 1];
            if (Math.abs(first[0] - last[0]) < 0.0001 && Math.abs(first[1] - last[1]) < 0.0001) {
                points.pop();
            }
        }

        const cleaned = cleanPoints(points);
        if (cleaned.length >= 3) {
            // Outer shape should be CCW
            loops.push(processPoints(cleaned, true));
        }

        shape.holes.forEach(hole => {
            const holePoints = hole.getPoints(resolution).map(p => [p.x, p.y]);
            
            if (holePoints.length > 0) {
                const first = holePoints[0];
                const last = holePoints[holePoints.length - 1];
                if (Math.abs(first[0] - last[0]) < 0.0001 && Math.abs(first[1] - last[1]) < 0.0001) {
                    holePoints.pop();
                }
            }

            const cleanedHole = cleanPoints(holePoints);
            if (cleanedHole.length >= 3) {
                // Holes should be CW
                loops.push(processPoints(cleanedHole, false));
            }
        });
    });

    if (loops.length === 0) return null;

    let cs = null;
    try {
        const fillRule = m.FillRule ? m.FillRule.EvenOdd : 'EvenOdd'; 
        cs = new m.CrossSection(loops, fillRule);
        
        let manifold = null;

        // Try static extrude (newer API)
        if (m.Manifold && typeof m.Manifold.extrude === 'function') {
            manifold = m.Manifold.extrude(cs, depth);
        }
        // Try instance extrude (older/alternative API)
        else if (cs && typeof cs.extrude === 'function') {
            manifold = cs.extrude(depth);
        }
        // Try generic module extrude
        else if (typeof m.extrude === 'function') {
            manifold = m.extrude(cs, depth);
        } else {
            throw new Error("Extrude function not found in Manifold API");
        }

        return manifold;
    } catch (e: any) {
        console.error("Manifold conversion/extrusion failed:", e);
        return null;
    } finally {
        if (cs && typeof cs.delete === 'function') {
            cs.delete();
        }
    }
};

export const generateDualTextGeometry = async (settings: TextSettings): Promise<THREE.BufferGeometry | null> => {
  if (!settings.fontUrl) throw new Error("No font selected");

  const [font, m] = await Promise.all([
      loadFont(settings.fontUrl),
      getManifold()
  ]);

  if (!m) throw new Error("Could not initialize Geometry Engine (Manifold).");

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

  const gap = fontSize * spacing;
  const extrusionDepth = fontSize * 5; 

  const parts: any[] = [];
  
  let currentXOffset = 0;

  // --- 1. Generate Letter Intersections ---
  for (let i = 0; i < length; i++) {
      const char1 = t1Chars[i];
      const char2 = t2Chars[i];
      const isC1Space = char1.trim() === '';
      const isC2Space = char2.trim() === '';

      if (isC1Space && isC2Space) {
          currentXOffset += gap + (fontSize * 0.5);
          continue;
      }

      const getCharManifold = (c: string) => {
          if (c.trim() === '') return null;
          const shapes = font.generateShapes(c, fontSize);
          if (!shapes || shapes.length === 0) return null;
          return shapesToManifold(shapes, m, extrusionDepth);
      };

      let resultManifold = null;
      let m1 = null;
      let m2 = null;

      try {
        if (!isC1Space) {
             const raw = getCharManifold(char1);
             if (raw) {
                const b = raw.boundingBox();
                const centerX = (b.max[0] + b.min[0]) / 2;
                const bottomY = b.min[1];
                const centerZ = (b.max[2] + b.min[2]) / 2;
                
                const centered = raw.translate([-centerX, -bottomY, -centerZ]);
                m1 = centered.rotate([0, 45, 0]); 
                
                raw.delete();
                centered.delete();
             }
        }

        if (!isC2Space) {
             const raw = getCharManifold(char2);
             if (raw) {
                const b = raw.boundingBox();
                const centerX = (b.max[0] + b.min[0]) / 2;
                const bottomY = b.min[1];
                const centerZ = (b.max[2] + b.min[2]) / 2;
                
                const centered = raw.translate([-centerX, -bottomY, -centerZ]);
                m2 = centered.rotate([0, -45, 0]); 
                
                raw.delete();
                centered.delete();
             }
        }
      } catch (e) {
          console.warn(`Error preparing chars ${char1}/${char2}:`, e);
      }

      if (m1 && m2) {
          try {
              resultManifold = m1.intersect(m2);
              
              if (resultManifold) {
                   const b = resultManifold.boundingBox();
                   if ((b.max[0] - b.min[0]) < 0.001 || (b.max[1] - b.min[1]) < 0.001) {
                       resultManifold.delete();
                       resultManifold = null;
                   }
              }
          } catch (e) {
              console.warn(`Intersection failed for chars ${char1}/${char2}`, e);
              resultManifold = null;
          }
      } else {
          if (m1) {
              resultManifold = m1;
              m1 = null;
          } else if (m2) {
              resultManifold = m2;
              m2 = null;
          }
      }
      
      if (m1) m1.delete();
      if (m2) m2.delete();

      if (resultManifold) {
          const b = resultManifold.boundingBox();
          const width = b.max[0] - b.min[0];

          if (width > 0.001) {
             const centerX = currentXOffset + (width / 2);
             
             const finalPos = resultManifold.translate([centerX, 0, 0]);
             resultManifold.delete(); 
             
             parts.push(finalPos);

             // --- Supports ---
             if (supportEnabled) {
                const maskChar = (i < supportMask.length) ? supportMask[i] : '_';
                if (maskChar !== '_' && maskChar !== ' ') {
                    try {
                        const cyl = m.cylinder(supportHeight, supportRadius, supportRadius, 16, false);
                        const rotated = cyl.rotate([-90, 0, 0]);
                        const positioned = rotated.translate([centerX, 0, 0]);
                        parts.push(positioned);
                        
                        cyl.delete();
                        rotated.delete();
                    } catch(e) {
                        console.warn("Support generation failed", e);
                    }
                }
             }

             currentXOffset += width + gap;
          } else {
             resultManifold.delete();
             currentXOffset += gap + (fontSize * 0.5); 
          }
      } else {
          currentXOffset += gap + (fontSize * 0.5);
      }
  }

  if (parts.length === 0) {
      throw new Error("No printable 3D geometry could be generated. This usually means the selected font does not support the characters entered, or the intersection of the two text strings resulted in empty space (common with very thin fonts). Please try a bolder font or different text.");
  }

  // --- 2. Create Base ---
  if (baseHeight > 0) {
      try {
        // Union parts momentarily just to get the bounding box size
        const lettersUnion = m.Manifold.union(parts);
        const b = lettersUnion.boundingBox();
        const fullSize = { x: b.max[0] - b.min[0], z: b.max[2] - b.min[2] };
        const center = { x: (b.max[0] + b.min[0]) / 2, z: (b.max[2] + b.min[2]) / 2 };
        
        lettersUnion.delete(); 

        const width = fullSize.x + basePadding;
        const depth = fullSize.z + basePadding;

        const shape = new THREE.Shape();
        const x = -width / 2;
        const y = -depth / 2;
        
        // Draw the base profile 2D
        if (baseType === 'RECTANGLE') {
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
            shape.absellipse(0, 0, width / 2, depth / 2, 0, Math.PI * 2, false, 0);
        }

        // Generate base directly in Manifold using the same logic as text
        const baseManifoldRaw = shapesToManifold([shape], m, baseHeight);
        
        if (baseManifoldRaw) {
            // Extrusion happens in Z. We need it to stand up (Y-up)
            // Rotate X -90
            const baseRotated = baseManifoldRaw.rotate([-90, 0, 0]);
            baseManifoldRaw.delete();

            // Calculate overlap position.
            // Text sits at approx Y=0 (baseline). 
            // We want the base to sit below the text, with a slight overlap to fuse them.
            const overlap = 0.5;
            const yOffset = overlap - baseHeight;
            
            const baseFinal = baseRotated.translate([center.x, yOffset, center.z]);
            baseRotated.delete();
            
            parts.push(baseFinal);
        }
      } catch (e) {
          console.error("Base generation failed", e);
      }
  }

  // --- 3. Final Union & Cleanup ---
  try {
      const finalManifold = m.Manifold.union(parts);
      
      // Cleanup Input Parts
      for (const p of parts) {
          if (p && typeof p.delete === 'function') p.delete();
      }

      // 4. Remove Floating Parts (if base exists)
      // This prevents "floating cantilever" errors in slicers by removing 
      // disconnected islands that don't touch the base.
      let cleanManifold = finalManifold;

      if (baseHeight > 0) {
          const components = finalManifold.decompose();
          
          // Determine if components is Array (newer versions) or Vector (older)
          const isArray = Array.isArray(components);
          const count = isArray ? components.length : components.size();
          
          if (count > 1) {
              const kept = [];
              const b = finalManifold.boundingBox();
              const minY = b.min[1];
              
              // We check if components touch the bottom area.
              // base sits at [overlap - baseHeight] up to [overlap].
              // The lowest point is roughly (overlap - baseHeight).
              // We add a tolerance of 0.2.
              const threshold = minY + 0.2;

              for (let i = 0; i < count; i++) {
                  const comp = isArray ? components[i] : components.get(i);
                  const cb = comp.boundingBox();
                  
                  if (cb.min[1] <= threshold) {
                      kept.push(comp);
                  } else {
                      // Delete disconnected floating part
                      comp.delete();
                  }
              }
              
              // If we filtered anything out, re-union
              if (kept.length < count) {
                  if (kept.length > 0) {
                      cleanManifold = m.Manifold.union(kept);
                      // Cleanup kept intermediates
                      kept.forEach(k => k.delete());
                      finalManifold.delete(); // Delete original dirty one
                  } else {
                      // If we somehow filtered everything, keep original (fallback)
                      // Clean up kept (empty) to be safe
                      kept.forEach(k => k.delete());
                      cleanManifold = finalManifold;
                  }
              } else {
                  // Kept everything, just clean up references
                  kept.forEach(k => k.delete());
                  cleanManifold = finalManifold;
              }
          }
          // Explicitly delete the vector container (Manifold C++ binding) if it's not a JS array
          if (!isArray && components.delete) components.delete();
      }

      const resultGeom = fromManifold(cleanManifold, m);
      
      cleanManifold.delete();

      resultGeom.computeBoundingBox();
      if (resultGeom.boundingBox) {
          const c = new THREE.Vector3();
          resultGeom.boundingBox.getCenter(c);
          resultGeom.translate(-c.x, -c.y, -c.z);
      }
      
      return resultGeom;
  } catch (e: any) {
      throw new Error(`Final geometry merge failed: ${e.message}`);
  }
};