import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';

export const exportToSTL = (geometry: THREE.BufferGeometry, filename: string) => {
  if (!geometry || !geometry.getAttribute('position') || geometry.getAttribute('position').count === 0) {
      console.error("Cannot export: Geometry is empty or invalid.");
      return;
  }

  try {
    const exporter = new STLExporter();
    const mesh = new THREE.Mesh(geometry);
    
    // Correct rotation for 3D printing (Z-up)
    mesh.rotation.x = Math.PI / 2;
    mesh.updateMatrixWorld();

    const result = exporter.parse(mesh, { binary: true });
    const blob = new Blob([result], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.stl`;
    link.click();
  } catch (e) {
      console.error("Export failed:", e);
      alert("Failed to generate STL. The geometry might be invalid.");
  }
};