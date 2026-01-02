export const FONTS = [
  { name: 'Helvetiker (Bold)', url: 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json' },
  { name: 'Helvetiker (Regular)', url: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json' },
  { name: 'Optimer (Bold)', url: 'https://threejs.org/examples/fonts/optimer_bold.typeface.json' },
  { name: 'Gentilis (Bold)', url: 'https://threejs.org/examples/fonts/gentilis_bold.typeface.json' },
  { name: 'Droid Sans (Bold)', url: 'https://threejs.org/examples/fonts/droid/droid_sans_bold.typeface.json' },
  { name: 'Droid Serif (Bold)', url: 'https://threejs.org/examples/fonts/droid/droid_serif_bold.typeface.json' },
];

export const DEFAULT_SETTINGS = {
  text1: 'YES',
  text2: 'NO',
  fontUrl: FONTS[0].url,
  fontSize: 20,
  spacing: 0.15, 
  baseHeight: 2,
  basePadding: 4,
  baseFillet: true,
  supportEnabled: false,
  supportMask: '',
  supportHeight: 5, // Taller support default to be visible
  supportRadius: 3,
};