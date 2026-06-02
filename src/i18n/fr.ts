import type { Dict } from './en';

export const fr: Dict = {
  app: { tagline: 'Photo → bac Gridfinity' },
  photo: {
    title: 'Photo',
    drop: 'Dépose une photo (objet + token)',
    token: 'Token',
    scale: 'Échelle',
    contour: 'Contour',
  },
  params: {
    title: 'Paramètres',
    pitch: 'Pas',
    size: 'Taille',
    auto: 'auto',
    adjust: 'Ajuster la taille',
    cols: 'Largeur',
    rows: 'Profondeur',
    height: 'Hauteur',
    thickness: 'Épaisseur outil',
    offset: 'Jeu',
    lip: "Lèvre d'empilage",
    units: 'unités',
    dimensions: 'Dimensions',
    sizeSection: 'Taille',
    general: 'Général',
  },
  export: {
    title: 'Export',
    stl: 'STL',
    step: 'STEP',
    threemf: '3MF',
    hint: 'Aperçu live & export à la prochaine étape.',
  },
  viewer: {
    placeholder: 'Aperçu 3D',
    hint: 'Ton bac apparaîtra ici',
    loading: 'Génération…',
    error: 'Échec du rendu',
  },
};
