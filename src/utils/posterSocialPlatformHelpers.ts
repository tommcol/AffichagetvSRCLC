export type PosterSocialPlatform = 'instagram' | 'tiktok' | 'facebook' | string;

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
