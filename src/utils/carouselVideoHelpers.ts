import {
  CarouselSlide,
  CategorySlideTheme,
  TeamVisualItem,
  VisualTemplatesConfig,
} from '../types';
import { isVideoMedia } from './mediaUtils';

const hasVideoMedia = (url?: string, mediaType?: 'image' | 'video'): boolean =>
  Boolean(url && (mediaType === 'video' || isVideoMedia(url)));

const hasThemeVideo = (theme?: CategorySlideTheme): boolean => {
  const themeMascot = (theme as any)?.mascot;
  return Boolean(
    hasVideoMedia(theme?.backgroundUrl, theme?.backgroundMediaType) ||
    (theme?.layer3?.enabled && hasVideoMedia(theme.layer3.mediaUrl, theme.layer3.mediaType)) ||
    (theme?.layer4?.enabled && hasVideoMedia(theme.layer4.mediaUrl, theme.layer4.mediaType)) ||
    (themeMascot?.enabled && themeMascot.mediaType === 'video' && themeMascot.mediaUrl)
  );
};

export const isCarouselSlideVideo = (
  slide: CarouselSlide | undefined,
  themes: {
    birthdays: CategorySlideTheme;
    matches: CategorySlideTheme;
    results: CategorySlideTheme;
  },
  teamVisuals: TeamVisualItem[],
  visualTemplates: VisualTemplatesConfig
): boolean => {
  if (!slide) return false;

  if (slide.type === 'alert' && slide.alert) {
    const alert = slide.alert;
    const matchingTeamVisual = teamVisuals.find((tv) =>
      tv.category === alert.team ||
      tv.teamName === alert.team ||
      tv.teamName.toLowerCase().includes(alert.team.toLowerCase()) ||
      tv.shortAliases.some((alias) => alert.team.toLowerCase().includes(alias.toLowerCase()))
    );
    const visualImage =
      alert.customImageUrl ||
      (alert.isWin ? matchingTeamVisual?.winVisualUrl : matchingTeamVisual?.lossVisualUrl) ||
      (alert.isWin ? visualTemplates.defaultVictoryBackgroundUrl : visualTemplates.defaultDefeatBackgroundUrl);
    return hasVideoMedia(visualImage);
  }

  if (slide.type !== 'category') return false;

  if (slide.categoryId === 'photos' && slide.photo) {
    return Boolean(slide.photo.isVideo || slide.photo.mediaType === 'video' || isVideoMedia(slide.photo.imageUrl));
  }
  if (slide.categoryId === 'sponsors' && slide.sponsor) {
    return Boolean(slide.sponsor.isVideo || slide.sponsor.mediaType === 'video' || isVideoMedia(slide.sponsor.logoUrl));
  }
  if (slide.categoryId === 'logos' && slide.logo) {
    return Boolean(slide.logo.isVideo || slide.logo.mediaType === 'video' || isVideoMedia(slide.logo.logoUrl));
  }

  if (slide.categoryId === 'birthdays') return hasThemeVideo(themes.birthdays);
  if (slide.categoryId === 'matches') return hasThemeVideo(themes.matches);
  if (slide.categoryId === 'results') return hasThemeVideo(themes.results);

  return false;
};
