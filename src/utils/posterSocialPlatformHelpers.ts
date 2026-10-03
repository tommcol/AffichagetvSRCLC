import type { PosterSocialPlatform } from './posterTypes';

export const getSocialCaptionForPlatform = (
  platform: string,
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

export type { PosterSocialPlatform };
