export type BaseType = 'RECTANGLE' | 'OVAL';

export interface TextSettings {
  text1: string;
  text2: string;
  fontUrl: string;
  fontSize: number;
  spacing: number;
  baseHeight: number;
  basePadding: number;
  baseType: BaseType;
  baseCornerRadius: number;
  baseTopRounding: number;
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