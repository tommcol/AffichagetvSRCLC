export type PosterAiCaptionPlatform =
  | 'instagram'
  | 'tiktok'
  | 'facebook';

export interface PosterAiCaptionRequestPayload {
  platform: PosterAiCaptionPlatform;
  type: 'matches' | 'results';
  matches: any[];
  results: any[];
  clubName: string;
  shortClub: string;
  gymnasium: string;
  tone: string;
  extraContext: string;
}

export const buildPosterAiCaptionRequestPayload = ({
  platform,
  contentType,
  matches,
  results,
  clubName,
  shortClub,
  gymnasium,
  tone,
  extraContext,
}: {
  platform: PosterAiCaptionPlatform;
  contentType: 'matches' | 'results' | 'notification';
  matches: any[];
  results: any[];
  clubName: string;
  shortClub: string;
  gymnasium: string;
  tone: string;
  extraContext: string;
}): PosterAiCaptionRequestPayload => ({
  platform,
  type: contentType === 'results' ? 'results' : 'matches',
  matches,
  results,
  clubName,
  shortClub,
  gymnasium,
  tone,
  extraContext,
});
