export type BaseType = 'RECTANGLE' | 'OVAL';
export type SupportType = 'CYLINDER' | 'SQUARE';

export interface TransformSettings {
  scaleX: number;
  scaleY: number; 
  moveX: number;
  moveZ: number; 
}

export interface IndividualSupportSettings {
  enabled: boolean;
  type: SupportType;
  height: number;
  width: number; 
}

export interface IntersectionConfig {
  id: string;
  char1: string;
  char2: string;
  transform: TransformSettings;
  support: IndividualSupportSettings;
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