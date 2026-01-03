// @ts-ignore
import Module from 'manifold-3d';

let wasm: any = null;

export const getManifold = async () => {
    if (wasm) return wasm;
    try {
        const m = await Module({
            locateFile: (path: string) => {
                if (path.endsWith('.wasm')) {
                    // Force load from jsDelivr to avoid bundler path resolution issues
                    return "https://cdn.jsdelivr.net/npm/manifold-3d@2.5.1/manifold.wasm";
                }
                return path;
            }
        } as any);
        
        // Some versions of Manifold require setup() to be awaited or called
        if (m.setup) {
            await m.setup();
        }

        // Validate that we have the necessary classes
        if (!m.Manifold || !m.CrossSection) {
            throw new Error("Manifold library loaded but missing core classes (Manifold, CrossSection).");
        }

        wasm = m;
        return wasm;
    } catch (e) {
        console.error("Manifold failed to load", e);
        throw new Error("Failed to initialize geometry engine. Please refresh the page.");
    }
};