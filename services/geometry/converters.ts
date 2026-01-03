import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils';

export const toManifold = (geometry: THREE.BufferGeometry, m: any) => {
    // 1. Weld vertices to ensure clean topology for the kernel
    // Use named import mergeVertices directly
    const geo = mergeVertices(geometry, 1e-4);
    
    const pos = geo.getAttribute('position');
    const index = geo.getIndex();
    
    if (!pos || !index) return null;

    const vertProperties = [];
    for (let i = 0; i < pos.count; i++) {
        vertProperties.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    
    const triVerts = [];
    for (let i = 0; i < index.count; i++) {
        triVerts.push(index.getX(i));
    }

    // Manifold expects flat arrays
    const mesh = {
        numProp: 3,
        vertProperties: new Float32Array(vertProperties),
        triVerts: new Uint32Array(triVerts)
    };

    return new m.Manifold(mesh);
};

export const fromManifold = (manifold: any, m: any): THREE.BufferGeometry => {
    const mesh = manifold.getMesh();
    const geom = new THREE.BufferGeometry();
    
    // mesh.vertProperties is Float32Array, mesh.triVerts is Uint32Array
    geom.setAttribute('position', new THREE.BufferAttribute(mesh.vertProperties, 3));
    geom.setIndex(new THREE.BufferAttribute(mesh.triVerts, 1));
    
    // Convert to non-indexed to ensure sharp shading (split normals at edges)
    // This fixes "artifacts" where smooth shading makes flat faces look curved
    const nonIndexed = geom.toNonIndexed();
    
    nonIndexed.computeVertexNormals();
    
    // Cleanup the indexed geometry
    geom.dispose();
    
    return nonIndexed;
};