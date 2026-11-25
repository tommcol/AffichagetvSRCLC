import {
  StudioCountOverride,
  StudioElement,
  StudioElementRole,
  StudioElementShape,
  StudioMatchesZone,
  StudioTemplate,
  StudioTemplateCategory,
  StudioTemplateFormat,
} from '../types';

export const STUDIO_FORMATS: { id: StudioTemplateFormat; label: string; ratio: number }[] = [
  { id: '16:9', label: '16:9 (écran TV)', ratio: 16 / 9 },
  { id: '4:5', label: '4:5 (affiche réseaux)', ratio: 4 / 5 },
  { id: '9:16', label: '9:16 (story)', ratio: 9 / 16 },
  { id: '1:1', label: '1:1 (carré)', ratio: 1 },
];

export const STUDIO_CATEGORIES: { id: StudioTemplateCategory; label: string }[] = [
  { id: 'matches', label: 'Matchs' },
  { id: 'results', label: 'Résultats' },
  { id: 'birthdays', label: 'Anniversaires' },
];

export const STUDIO_SHAPES: { id: StudioElementShape; label: string }[] = [
  { id: 'pill', label: 'Pastille' },
  { id: 'rounded', label: 'Rectangle arrondi' },
  { id: 'rect', label: 'Rectangle (angles droits)' },
  { id: 'circle', label: 'Rond' },
  { id: 'star', label: 'Étoile' },
  { id: 'line', label: 'Trait' },
  { id: 'text', label: 'Texte seul' },
];

export const STUDIO_ROLES: { id: StudioElementRole; label: string }[] = [
  { id: 'decor', label: 'Rien (décor ou texte fixe)' },
  { id: 'title', label: 'Le titre' },
  { id: 'clubLogo', label: 'Le logo du club' },
  { id: 'team', label: "L'équipe du club" },
  { id: 'score', label: 'Le score' },
  { id: 'opponent', label: "L'adversaire" },
  { id: 'status', label: 'Victoire / Défaite' },
  { id: 'date', label: "La date et l'heure" },
];

// Exemples affichés dans l'éditeur pour les éléments liés aux données
export const STUDIO_ROLE_SAMPLES: Record<StudioElementRole, string> = {
  decor: '',
  title: 'TITRE',
  clubLogo: 'LOGO',
  team: 'U13 M1',
  score: '48 - 45',
  opponent: 'ADVERSAIRE - 1',
  status: 'VICTOIRE',
  date: 'SAM 14H30',
};

export const STUDIO_MAX_ROWS = 6;

export const newStudioId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const getFormatRatio = (format: StudioTemplateFormat): number =>
  STUDIO_FORMATS.find((f) => f.id === format)?.ratio ?? 4 / 5;

export const createStudioElement = (
  shape: StudioElementShape,
  overrides: Partial<StudioElement> = {}
): StudioElement => {
  const isLine = shape === 'line';
  const isText = shape === 'text';
  return {
    id: newStudioId('el'),
    name: STUDIO_SHAPES.find((s) => s.id === shape)?.label ?? 'Élément',
    shape,
    role: 'decor',
    x: 30,
    y: 30,
    w: isLine ? 30 : shape === 'circle' || shape === 'star' ? 14 : 30,
    h: isLine ? 1.5 : isText ? 10 : shape === 'circle' || shape === 'star' ? 14 : 12,
    rotation: 0,
    visible: true,
    fill: isText ? 'transparent' : '#dc2626',
    stroke: '#ffffff',
    strokeWidth: 0,
    opacity: 1,
    shadow: false,
    text: isText ? 'Texte' : '',
    fontFamily: 'Bebas Neue',
    fontSize: 60,
    textColor: '#ffffff',
    ...overrides,
  };
};

export const DEFAULT_STUDIO_ZONE: StudioMatchesZone = {
  x: 5,
  y: 30,
  w: 90,
  h: 55,
  gap: 1.5,
  maxRowHeight: 18,
};

export const createBlankStudioTemplate = (
  name: string,
  category: StudioTemplateCategory,
  format: StudioTemplateFormat
): StudioTemplate => ({
  id: newStudioId('tpl'),
  name,
  category,
  format,
  decor: [],
  rowElements: [],
  zone: { ...DEFAULT_STUDIO_ZONE },
  countOverrides: {},
  updatedAt: new Date().toISOString(),
});

export function createStudioMatchRow(category: StudioTemplateCategory): StudioElement[] {
  const middle = category === 'results' ? 'score' : 'date';
  return ([
    { role: 'team', x: 0, w: 27, fill: '#b91c1c' },
    { role: middle, x: 28, w: 26, fill: '#0f172a' },
    { role: 'opponent', x: 55, w: 45, fill: '#1e293b' },
  ] satisfies Partial<StudioElement>[]).map((element) => createStudioElement('rounded', {
    ...element,
    name: STUDIO_ROLES.find(({ id }) => id === element.role)?.label,
    y: 10,
    h: 80,
    fontSize: 48,
  }));
}

// Template d'exemple qui reproduit l'affiche « Résultats à l'extérieur » (4:5)
export const createExampleResultsTemplate = (): StudioTemplate => {
  const decor: StudioElement[] = [];
  const stripeColors = '#dc2626';
  for (let i = 0; i < 6; i += 1) {
    decor.push(
      createStudioElement('rounded', {
        name: `Trait titre ${i + 1}`,
        x: 40.5 + i * 3.1,
        y: 4.4,
        w: 2.2,
        h: 2.4,
        rotation: 20,
        fill: stripeColors,
        strokeWidth: 0,
      })
    );
  }
  decor.push(
    createStudioElement('rounded', {
      name: 'Bandeau titre',
      role: 'title',
      x: 21.5,
      y: 8.2,
      w: 57,
      h: 6.4,
      fill: '#dc2626',
      shadow: true,
      text: "RÉSULTATS À L'EXTÉRIEUR",
      fontFamily: 'Bebas Neue',
      fontSize: 62,
      textColor: '#ffffff',
    })
  );
  for (let i = 0; i < 3; i += 1) {
    decor.push(
      createStudioElement('line', {
        name: `Trait blanc coin ${i + 1}`,
        x: 76 + i * 5,
        y: 90 + i * 2.5,
        w: 26,
        h: 1.8,
        rotation: -45,
        fill: '#ffffff',
      })
    );
  }

  const rowElements: StudioElement[] = [
    createStudioElement('pill', {
      name: 'Pastille équipe',
      role: 'team',
      x: 0,
      y: 28,
      w: 37,
      h: 70,
      fill: '#dc2626',
      stroke: '#f87171',
      strokeWidth: 1,
      text: STUDIO_ROLE_SAMPLES.team,
      fontSize: 52,
    }),
    createStudioElement('pill', {
      name: 'Pastille score',
      role: 'score',
      x: 38,
      y: 24,
      w: 25,
      h: 74,
      fill: '#ffffff',
      text: STUDIO_ROLE_SAMPLES.score,
      fontFamily: 'Teko',
      fontSize: 56,
      textColor: '#dc2626',
    }),
    createStudioElement('pill', {
      name: 'Pastille adversaire',
      role: 'opponent',
      x: 64,
      y: 28,
      w: 36,
      h: 70,
      fill: '#0f172a',
      text: STUDIO_ROLE_SAMPLES.opponent,
      fontSize: 34,
    }),
    createStudioElement('pill', {
      name: 'Pastille victoire / défaite',
      role: 'status',
      x: 40,
      y: 0,
      w: 20,
      h: 28,
      fill: '#059669',
      text: STUDIO_ROLE_SAMPLES.status,
      fontSize: 52,
    }),
  ];

  return {
    id: newStudioId('tpl'),
    name: "Résultats à l'extérieur (exemple)",
    category: 'results',
    format: '4:5',
    decor,
    rowElements,
    zone: { x: 5, y: 31, w: 90, h: 55, gap: 0.5, maxRowHeight: 17 },
    countOverrides: {},
    updatedAt: new Date().toISOString(),
  };
};

export interface StudioRowBox {
  index: number;
  x: number; // % du canvas
  y: number;
  w: number;
  h: number;
}

// Calcule la position des lignes pour un nombre de matchs donné (placement automatique ou réglage manuel)
export const computeStudioRowBoxes = (template: StudioTemplate, count: number): StudioRowBox[] => {
  const n = Math.min(STUDIO_MAX_ROWS, Math.max(0, Math.round(count)));
  if (!n) return [];
  const override: StudioCountOverride | undefined = template.countOverrides?.[n];
  const zone: StudioMatchesZone = { ...template.zone, ...(override?.zone ?? {}) };
  const gap = n > 1 ? Math.min(zone.gap, zone.h / (2 * (n - 1))) : 0;
  const maxFittingHeight = (zone.h - gap * (n - 1)) / n;
  const rowH = Math.min(maxFittingHeight, override?.rowHeight ?? zone.maxRowHeight);
  const total = rowH * n + gap * (n - 1);
  const startY = zone.y + (zone.h - total) / 2;
  return Array.from({ length: n }, (_, index) => ({
    index,
    x: zone.x,
    y: startY + index * (rowH + gap),
    w: zone.w,
    h: rowH,
  }));
};

export const getEffectiveStudioZone = (template: StudioTemplate, count: number): StudioMatchesZone => ({
  ...template.zone,
  ...(template.countOverrides?.[count]?.zone ?? {}),
});

export const clampStudioValue = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

// Les positions utilisent des pourcentages du cadre. La tolérance vient de la taille à l'écran.
export function alignStudioAxis(position: number, size: number, targets: number[], tolerance: number) {
  let nearest = tolerance;
  let aligned = position;
  let guide: number | undefined;

  for (const offset of [size / 2, 0, size]) {
    for (const target of targets) {
      const distance = Math.abs(position + offset - target);
      if (distance > nearest || (guide !== undefined && Math.abs(distance - nearest) < 1e-9)) continue;
      const candidate = target - offset;
      if (candidate < -50 || candidate > 150) continue;
      nearest = distance;
      aligned = candidate;
      guide = target;
    }
  }

  return { position: aligned, guide };
}
