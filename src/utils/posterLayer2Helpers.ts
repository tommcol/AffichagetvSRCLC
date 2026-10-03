import {
  CategorySlideTheme,
  FontFamilyOption,
  VisualTemplatesConfig,
} from '../types';

export interface Layer2Settings {
  primaryColor?: string;
  textColor?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  fontFamilyHeader?: FontFamilyOption;
  fontFamilyBody?: FontFamilyOption;
  resultDisplayMode?: 'both' | 'score' | 'status';
}

export function getLayer2Settings(
  categoryConfig?: CategorySlideTheme
): Layer2Settings {
  if (!categoryConfig) {
    return {};
  }

  return {
    primaryColor: categoryConfig.primaryColor,
    textColor: categoryConfig.textColor,
    badgeBgColor: categoryConfig.badgeBgColor ?? categoryConfig.primaryColor,
    badgeTextColor: categoryConfig.badgeTextColor,
    fontFamilyHeader: categoryConfig.fontFamilyHeader,
    fontFamilyBody: categoryConfig.fontFamilyBody,
    resultDisplayMode: categoryConfig.resultDisplayMode,
  };
}

export function mergeLayer2TemplateSetting(
  visualTemplates: VisualTemplatesConfig,
  categoryType: 'matches' | 'results',
  partial: Partial<CategorySlideTheme>
): VisualTemplatesConfig {
  if (categoryType === 'matches') {
    const current = visualTemplates.matchesSettings || {};

    return {
      ...visualTemplates,
      matchesSettings: {
        ...current,
        ...partial,
      },
    };
  }

  const current = visualTemplates.resultsSettings || {};

  return {
    ...visualTemplates,
    resultsSettings: {
      ...current,
      ...partial,
    },
  };
}
