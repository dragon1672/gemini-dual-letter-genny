
export type BaseType = 'RECTANGLE' | 'OVAL';
export type SupportType = 'CYLINDER' | 'SQUARE';

export interface CharTransform {
  scaleX: number;
  scaleY: number; 
  moveX: number;
  moveY: number; 
}

export interface IndividualSupportSettings {
  enabled: boolean;
  type: SupportType;
  height: number;
  width: number;
}

export interface BridgeSettings {
  enabled: boolean;
  auto: boolean;
  width: number;
  height: number;
  depth: number;
  moveX: number;
  moveY: number;
  moveZ: number;
  rotationZ: number;
}

export interface IntersectionConfig {
  id: string;
  char1: string;
  char2: string;
  // Per-letter overrides
  fontUrl?: string; // Legacy/Fallback for pair
  char1FontUrl?: string; // Specific font for char 1
  char2FontUrl?: string; // Specific font for char 2
  
  embedDepth?: number;
  
  char1Transform: CharTransform;
  char2Transform: CharTransform;
  
  // Positioning the result pair
  pairSpacing: { x: number; z: number };

  support: IndividualSupportSettings;
  bridge: BridgeSettings;
  isOverridden: boolean;
}

export interface TextSettings {
  // Global Inputs
  text1: string;
  text2: string;
  fontUrl: string;
  fontSize: number;
  spacing: number;
  
  // Base
  baseHeight: number;
  basePadding: number;
  baseType: BaseType;
  baseCornerRadius: number;
  baseTopRounding: number;
  embedDepth: number;

  // Global Support Defaults
  supportEnabled: boolean;
  supportType: SupportType;
  supportHeight: number;
  supportRadius: number;

  // Hierarchy - Configuration per intersection pair
  intersectionConfig: IntersectionConfig[];
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
  geometry: any;
  computeTime: number;
}
