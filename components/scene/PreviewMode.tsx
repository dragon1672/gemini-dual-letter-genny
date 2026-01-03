import React, { useEffect, useState } from 'react';
import { Center, Text3D, Html } from '@react-three/drei';
import { TextSettings } from '../../types';
import { loadFont } from '../../services/geometryService';

export const PreviewMode: React.FC<{ settings: TextSettings }> = ({ settings }) => {
  const { text1, text2, fontSize, spacing, fontUrl } = settings;
  const gap = fontSize * spacing;
  const avgCharWidth = fontSize * 0.7;

  // Use Array spread for unicode awareness
  const t1Chars = [...text1];
  const t2Chars = [...text2];
  const len = Math.min(t1Chars.length, t2Chars.length);
  const t1 = t1Chars.slice(0, len);
  const t2 = t2Chars.slice(0, len);

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

  const RenderLetters = ({ chars, rotationY, color }: { chars: string[], rotationY: number, color: string }) => {
    if (!fontData) return null;
    return (
        <group>
            {chars.map((char, i) => {
                const xPos = i * (avgCharWidth + gap);
                // Skip rendering spaces to avoid warnings or empty geometry issues
                if (char.trim() === '') return null;
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
        <RenderLetters chars={t1} rotationY={Math.PI / 4} color="#60a5fa" />
        {/* Text 2 */}
        <RenderLetters chars={t2} rotationY={-Math.PI / 4} color="#f472b6" />
        
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