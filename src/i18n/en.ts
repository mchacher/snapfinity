export const en = {
  app: { tagline: 'Photo → Gridfinity bin' },
  photo: {
    title: 'Photo',
    drop: 'Drop a photo (object + token)',
    token: 'Token',
    scale: 'Scale',
    contour: 'Contour',
  },
  params: {
    title: 'Parameters',
    pitch: 'Pitch',
    size: 'Size',
    auto: 'auto',
    adjust: 'Adjust size',
    cols: 'Width',
    rows: 'Depth',
    height: 'Height',
    thickness: 'Tool thickness',
    offset: 'Clearance',
    lip: 'Stacking lip',
    units: 'units',
    dimensions: 'Dimensions',
    sizeSection: 'Size',
    general: 'General',
  },
  export: {
    title: 'Export',
    stl: 'STL',
    step: 'STEP',
    threemf: '3MF',
    hint: 'Live preview & export coming next.',
  },
  viewer: {
    placeholder: '3D preview',
    hint: 'Your bin will appear here',
    loading: 'Generating…',
    error: 'Render failed',
  },
};

export type Dict = typeof en;
