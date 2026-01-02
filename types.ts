export interface TextSettings {
  text1: string;
  text2: string;
  fontUrl: string;
  fontSize: number;
  spacing: number;
  baseHeight: number;
  basePadding: number;
  baseFillet: boolean;
  supportEnabled: boolean;
  supportMask: string;
  supportHeight: number;
  supportRadius: number;
}

export enum ViewMode {
  PREVIEW = 'PREVIEW',
  RESULT = 'RESULT',
}

export interface FontVariant {
  name: string;
  url: string;
}

export type FontLibrary = Record<string, FontVariant[]>;

export interface GenerationResult {
  geometry: any; // THREE.BufferGeometry
  computeTime: number;
}