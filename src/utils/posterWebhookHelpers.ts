import type { MatchItem } from '../types';
import type { PosterContentType, PosterSocialPlatform } from './posterTypes';

export const buildPosterSocialWebhookPayload = ({
  platform,
  contentType,
  badgeTitle,
  shortClubName,
  caption,
  matches,
  results,
  totalPages,
  webhookUrl,
}: {
  platform: PosterSocialPlatform | string;
  contentType: PosterContentType;
  badgeTitle: string;
  shortClubName: string;
  caption: string;
  matches: MatchItem[];
  results: MatchItem[];
  totalPages: number;
  webhookUrl: string;
}) => ({
  platform,
  type: contentType,
  badgeTitle,
  title: shortClubName + ' • ' + badgeTitle,
  caption,
  matches: contentType === 'matches' ? matches : [],
  results: contentType === 'results' ? results : [],
  totalPages,
  itemsCount: contentType === 'matches' ? matches.length : contentType === 'results' ? results.length : 0,
  webhookUrl,
});
