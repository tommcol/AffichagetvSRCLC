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
  platform: 'instagram' | 'tiktok' | 'facebook';
  contentType: 'matches' | 'results' | 'notification';
  badgeTitle: string;
  shortClubName: string;
  caption: string;
  matches: unknown[];
  results: unknown[];
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
