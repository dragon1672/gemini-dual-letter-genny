import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Text3D, Grid, Stage, Html } from '@react-three/drei';
import * as THREE from 'three';
import { TextSettings, ViewMode } from '../types';
import { loadFont } from '../services/geometryService';

interface SceneProps {
  settings: TextSettings;
  generatedGeometry: THREE.BufferGeometry | null;
  mode: ViewMode;
}

const PreviewMode: React.FC<{ settings: TextSettings }> = ({ settings }) => {
  const { text1, text2, fontSize, spacing, fontUrl } = settings;
  const gap = fontSize * spacing;
  const avgCharWidth = fontSize * 0.7;

  const len = Math.min(text1.length, text2.length);
  const t1 = text1.substring(0, len);
  const t2 = text2.substring(0, len);

  const [fontData, setFontData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
      if (fontUrl) {
          setIsLoading(true);
          // Small delay to prevent flickering on fast loads
          const timer = setTimeout(() => {
             loadFont(fontUrl)
                .then(f => {
                    setFontData(f.data);
                    setIsLoading(false);
                })
                .catch(e => {
                    console.error("Failed to load preview font", e);
                    setIsLoading(false);
                });
          }, 0);
          return () => clearTimeout(timer);
      }
  }, [fontUrl]);

  const RenderLetters = ({ text, rotationY, color }: { text: string, rotationY: number, color: string }) => {
    if (!fontData) return null;
    return (
        <group>
            {text.split('').map((char, i) => {
                const xPos = i * (avgCharWidth + gap);
                return (
                    <group key={i} position={[xPos, 0, 0]}>
                        <Center disableY>
                            <Text3D 
                                font={fontData}
                                size={fontSize}
                                height={fontSize * 2.5}
                                curveSegments={2}
                                bevelEnabled={false}
                                rotation={[0, rotationY, 0]}
                            >
                                {char}
                                <meshStandardMaterial color={color} opacity={0.6} transparent />
                            </Text3D>
                        </Center>
                    </group>
                );
            })}
        </group>
    )
  }
  
  const totalApproxWidth = (len - 1) * (avgCharWidth + gap);
  const baseCenterY = -settings.baseHeight / 2;

  if (isLoading) {
      return (
        <Html center>
            <div className="flex flex-col items-center gap-2 bg-gray-900/80 p-4 rounded-lg backdrop-blur border border-gray-700">
                <i className="fas fa-circle-notch fa-spin text-blue-500 text-xl"></i>
                <span className="text-white text-xs font-semibold">Loading Font...</span>
            </div>
        </Html>
      );
  }

  return (
    <group position={[-totalApproxWidth / 2, 0, 0]}>
        {/* Text 1 */}
        <RenderLetters text={t1} rotationY={Math.PI / 4} color="#60a5fa" />
        {/* Text 2 */}
        <RenderLetters text={t2} rotationY={-Math.PI / 4} color="#f472b6" />
        
        {/* Base Preview (Wireframe) */}
        {settings.baseHeight > 0 && (
             <mesh position={[totalApproxWidth/2, baseCenterY, 0]}>
                <boxGeometry args={[totalApproxWidth + fontSize * 2 + settings.basePadding, settings.baseHeight, fontSize * 2]} />
                <meshBasicMaterial color="#475569" wireframe />
             </mesh>
        )}
    </group>
  );
};

const ResultMode: React.FC<{ geometry: THREE.BufferGeometry }> = ({ geometry }) => {
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial 
        color="#e2e8f0" 
        roughness={0.3} 
        metalness={0.1} 
        flatShading={false}
      />
    </mesh>
  );
};

const Scene: React.FC<SceneProps> = ({ settings, generatedGeometry, mode }) => {
  return (
    <div className="w-full h-full bg-gray-900 relative">
        <Canvas shadows camera={{ position: [50, 50, 50], fov: 45 }}>
            <color attach="background" args={['#0f172a']} />
            
            <OrbitControls makeDefault />
            
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 20, 10]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-10, 10, -10]} intensity={0.5} />

            <group position={[0, -10, 0]}>
                <Grid 
                    sectionSize={10} 
                    cellSize={2} 
                    position={[0, -0.1, 0]} 
                    infiniteGrid 
                    fadeDistance={300}
                    sectionColor="#475569"
                    cellColor="#1e293b"
                />
                
                <Center>
                    {mode === ViewMode.PREVIEW ? (
                        <PreviewMode settings={settings} />
                    ) : (
                        generatedGeometry && <ResultMode geometry={generatedGeometry} />
                    )}
                </Center>
            </group>
            
            <Stage intensity={0.5} environment="city" adjustCamera={false} />
        </Canvas>
        
        {/* View Toggle / Legend */}
        <div className="absolute top-4 right-4 bg-gray-800/80 backdrop-blur p-2 rounded flex flex-col gap-2 border border-gray-700 pointer-events-none select-none">
            <div className="text-xs text-gray-400 font-bold uppercase mb-1">View</div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-xs text-gray-200">Text 1 Angle</span>
            </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                <span className="text-xs text-gray-200">Text 2 Angle</span>
            </div>
        </div>
    </div>
  );
};

export default Scene;