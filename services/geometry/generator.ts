import * as THREE from 'three';
import { TextSettings, SupportType } from '../../types';
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
    const resolution = 16; 

    shapes.forEach(shape => {
        const points = shape.getPoints(resolution).map(p => [p.x, p.y]);
        if (points.length > 0) {
            const first = points[0];
            const last = points[points.length - 1];
            if (Math.abs(first[0] - last[0]) < 0.0001 && Math.abs(first[1] - last[1]) < 0.0001) {
                points.pop();
            }
        }
        const cleaned = cleanPoints(points);
        if (cleaned.length >= 3) {
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
        if (m.Manifold && typeof m.Manifold.extrude === 'function') {
            manifold = m.Manifold.extrude(cs, depth);
        } else if (cs && typeof cs.extrude === 'function') {
            manifold = cs.extrude(depth);
        } else if (typeof m.extrude === 'function') {
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

const createSupportPrimitive = (m: any, type: SupportType, height: number, size: number) => {
    try {
        if (type === 'CYLINDER') {
            if (m.Manifold && typeof m.Manifold.cylinder === 'function') {
                return m.Manifold.cylinder(height, size, size, 16, true);
            } else if (typeof m.cylinder === 'function') {
                return m.cylinder(height, size, size, 16, true);
            }
        } else if (type === 'SQUARE') {
            if (m.Manifold && typeof m.Manifold.cube === 'function') {
                return m.Manifold.cube([size * 2, size * 2, height], true);
            } else if (typeof m.cube === 'function') {
                return m.cube([size * 2, size * 2, height], true);
            }
        }
    } catch (e) {
        console.warn("Primitive creation failed", e);
    }
    return null;
};

// Auto-bridge logic: Decomposes manifold, finds vertically separated parts, and connects them.
const applyAutoBridge = (inputManifold: any, m: any) => {
    const componentsVec = inputManifold.decompose();
    const isArray = Array.isArray(componentsVec);
    const count = isArray ? componentsVec.length : componentsVec.size();
    
    if (count <= 1) {
        if (!isArray && componentsVec.delete) componentsVec.delete();
        return inputManifold;
    }
    
    const parts: any[] = [];
    for(let i=0; i<count; i++) {
        parts.push(isArray ? componentsVec[i] : componentsVec.get(i));
    }
    if (!isArray && componentsVec.delete) componentsVec.delete();
    
    // Sort by Y position (bottom to top)
    parts.sort((a, b) => {
        const bA = a.boundingBox();
        const bB = b.boundingBox();
        return bA.min[1] - bB.min[1];
    });

    const bridgeGeoms = [];
    
    for(let i=0; i < parts.length - 1; i++) {
        const lower = parts[i];
        const upper = parts[i+1];
        
        const bLower = lower.boundingBox();
        const bUpper = upper.boundingBox();
        
        // Check for vertical gap
        const yMin = bLower.max[1];
        const yMax = bUpper.min[1];
        
        // If there is a gap or they are just touching, bridge them
        if (yMax > yMin - 0.2) { 
            const height = (yMax - yMin) + 0.4; // Small overlap
            const centerY = (yMax + yMin) / 2;
            
            // X/Z Centers
            const cLx = (bLower.min[0] + bLower.max[0])/2;
            const cLz = (bLower.min[2] + bLower.max[2])/2;
            const cUx = (bUpper.min[0] + bUpper.max[0])/2;
            const cUz = (bUpper.min[2] + bUpper.max[2])/2;
            
            const avgX = (cLx + cUx) / 2;
            const avgZ = (cLz + cUz) / 2;
            
            // Bridge width
            const bridgeWidth = 1.8; 
            
            try {
                // Vertical Cylinder Bridge
                // Manifold.cylinder is along Z. Rotate to Y.
                let connector = m.Manifold.cylinder(height, bridgeWidth/2, bridgeWidth/2, 8, true);
                connector = connector.rotate([-90, 0, 0]);
                connector = connector.translate([avgX, centerY, avgZ]);
                bridgeGeoms.push(connector);
            } catch (e) { console.warn("Auto bridge failed", e); }
        }
    }
    
    // Union original parts + new bridges
    const toUnion = [...parts, ...bridgeGeoms];
    const united = m.Manifold.union(toUnion);
    
    // Cleanup intermediates
    // inputManifold is technically represented by 'parts' now, so we can delete inputManifold
    inputManifold.delete();
    toUnion.forEach(p => { if (p !== united) p.delete(); });
    
    return united;
};

export const generateDualTextGeometry = async (settings: TextSettings): Promise<THREE.BufferGeometry | null> => {
  if (!settings.fontUrl) throw new Error("No font selected");

  const [font, m] = await Promise.all([
      loadFont(settings.fontUrl),
      getManifold()
  ]);

  if (!m) throw new Error("Could not initialize Geometry Engine (Manifold).");

  const { 
    intersectionConfig, 
    fontSize, 
    spacing, 
    baseHeight, 
    basePadding,
    baseType, 
    baseCornerRadius, 
    embedDepth
  } = settings;

  const length = intersectionConfig.length;
  const gap = fontSize * spacing;
  const extrusionDepth = fontSize * 5; 

  const parts: any[] = [];
  
  let currentXOffset = 0;

  // --- 1. Generate Letter Intersections ---
  for (let i = 0; i < length; i++) {
      const config = intersectionConfig[i];
      const char1 = config.char1;
      const char2 = config.char2;
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
          // --- Auto Bridge Logic ---
          if (config.bridge && config.bridge.enabled && config.bridge.auto) {
             resultManifold = applyAutoBridge(resultManifold, m);
          }

          const b = resultManifold.boundingBox();
          const width = b.max[0] - b.min[0];

          if (width > 0.001) {
             const centerX = currentXOffset + (width / 2);
             
             // --- Apply Intersection Config Transforms ---
             const sX = config.transform.scaleX || 1;
             const sY = config.transform.scaleY || 1;
             const dX = config.transform.moveX || 0;
             const dZ = config.transform.moveZ || 0;
             
             let transformed = resultManifold.scale([sX, sY, 1]); 
             const finalPos = transformed.translate([centerX + dX, 0, dZ]);
             parts.push(finalPos);

             // --- Manual Connector Bridge ---
             // Only if enabled AND auto is false
             if (config.bridge && config.bridge.enabled && !config.bridge.auto) {
                 try {
                     const { width: bw, height: bh, depth: bd, moveX: bx, moveY: by, moveZ: bz, rotationZ } = config.bridge;
                     let bridge = m.Manifold.cube([bw, bh, bd], true);
                     
                     if (rotationZ !== 0) {
                         const rotated = bridge.rotate([0, 0, rotationZ]);
                         bridge.delete();
                         bridge = rotated;
                     }

                     const positionedBridge = bridge.translate([centerX + dX + bx, by, dZ + bz]);
                     parts.push(positionedBridge);
                     bridge.delete();
                 } catch (e) {
                     console.warn("Manual bridge generation failed", e);
                 }
             }

             // --- Supports ---
             const supp = config.support;
             if (supp && supp.enabled) {
                 const h = supp.height;
                 const w = supp.width;
                 const supportGeom = createSupportPrimitive(m, supp.type, h, w);
                 if (supportGeom) {
                     const rotated = supportGeom.rotate([-90, 0, 0]);
                     const baseBottomY = (baseHeight > 0) ? (embedDepth - baseHeight) : 0;
                     const shiftY = baseBottomY + (h / 2);
                     const positioned = rotated.translate([centerX + dX, shiftY, dZ]);
                     parts.push(positioned);
                     if (supportGeom !== rotated) supportGeom.delete();
                     if (rotated !== positioned) rotated.delete();
                 }
             }
             
             // Cleanup Intermediates for Letter
             if (transformed !== resultManifold) resultManifold.delete();
             if (finalPos !== transformed) transformed.delete();

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
      throw new Error("No printable 3D geometry could be generated.");
  }

  // --- 2. Create Base ---
  if (baseHeight > 0) {
      try {
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

        const baseManifoldRaw = shapesToManifold([shape], m, baseHeight);
        
        if (baseManifoldRaw) {
            const baseRotated = baseManifoldRaw.rotate([-90, 0, 0]);
            baseManifoldRaw.delete();
            const yOffset = embedDepth - baseHeight;
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
      
      for (const p of parts) {
          if (p && typeof p.delete === 'function') p.delete();
      }

      // 4. Remove Floating Parts
      // NOTE: With auto-bridge enabled, parts like '?' dots are now connected to the body.
      // This cleanup step will no longer delete them.
      let cleanManifold = finalManifold;

      if (baseHeight > 0) {
          const components = finalManifold.decompose();
          const isArray = Array.isArray(components);
          const count = isArray ? components.length : components.size();
          
          if (count > 1) {
              const kept = [];
              const b = finalManifold.boundingBox();
              const minY = b.min[1];
              // Keep parts that touch the lowest point
              const threshold = minY + 0.2;

              for (let i = 0; i < count; i++) {
                  const comp = isArray ? components[i] : components.get(i);
                  const cb = comp.boundingBox();
                  if (cb.min[1] <= threshold) {
                      kept.push(comp);
                  } else {
                      comp.delete();
                  }
              }
              
              if (kept.length < count) {
                  if (kept.length > 0) {
                      cleanManifold = m.Manifold.union(kept);
                      kept.forEach(k => k.delete());
                      finalManifold.delete();
                  } else {
                      kept.forEach(k => k.delete());
                      cleanManifold = finalManifold;
                  }
              } else {
                  kept.forEach(k => k.delete());
                  cleanManifold = finalManifold;
              }
          }
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