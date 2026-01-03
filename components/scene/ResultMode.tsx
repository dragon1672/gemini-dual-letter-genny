import React from 'react';
import * as THREE from 'three';

export const ResultMode: React.FC<{ geometry: THREE.BufferGeometry }> = ({ geometry }) => {
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