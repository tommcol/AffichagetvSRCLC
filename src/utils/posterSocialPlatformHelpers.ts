import type { PosterSocialPlatform } from './posterTypes';

export const getSocialCaptionForPlatform = (
  platform: PosterSocialPlatform,
  captions: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
  }
): string => {
  switch (platform) {
    case 'tiktok':
      return captions.tiktok || '';
    case 'facebook':
      return captions.facebook || '';
    case 'instagram':
    default:
      return captions.instagram || '';
  }
};
