import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Grid, Stage } from '@react-three/drei';
import * as THREE from 'three';
import { TextSettings, ViewMode } from '../types';
import { PreviewMode } from './scene/PreviewMode';
import { ResultMode } from './scene/ResultMode';

// Augment JSX namespace to include Three.js elements
interface ThreeJSXElements {
  group: any;
  mesh: any;
  meshStandardMaterial: any;
  boxGeometry: any;
  meshBasicMaterial: any;
  ambientLight: any;
  directionalLight: any;
  color: any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeJSXElements {}
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeJSXElements {}
  }
}

interface SceneProps {
  settings: TextSettings;
  generatedGeometry: THREE.BufferGeometry | null;
  mode: ViewMode;
}

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